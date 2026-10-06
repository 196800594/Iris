//! message 模块 —— WS 消息管线（计划书 6.2 发送与 ACK / 6.3 差量同步 / 6.4 已读未读 / 6.6 在线状态）。
//!
//! gRPC 侧三个方法（由 grpc.rs `dispatch_client_msg` 分发）：
//! - `message.send`：参数/成员/好友校验 → Redis 幂等快速窗 → MySQL 事务
//!   `SELECT last_seq FOR UPDATE → +1 → INSERT messages` 定序落库 →
//!   NOTICE=message.ack 回发送方 → NOTICE=message.push 推对端在线连接；
//! - `conv.sync`：多会话游标差量同步（每会话每批 ≤200，has_more 翻页；
//!   群会话强制 `seq > join_seq`，入群前历史不下发）；
//! - `conv.read`：已读水位单调前进；单聊向对方在线连接下发 conv.read 通知。
//!
//! 可靠性纪律（计划书 6.2）：
//! - 幂等双层：Redis `msg:idem:{conv_id}:{client_msg_id}`（24h 快速窗）+
//!   `messages.uk_msg_conv_client` 唯一键（永久防线，撞键回查原消息返回同一 ack）；
//! - 排序只认会话内 seq；消息 ID 用 sonyflake 雪花；
//! - msg_type 取值以 proto 契约为准（TEXT=1/IMAGE=2/FILE=3/SYSTEM=4），
//!   SYSTEM(4) 不允许客户端上行（群事件系统消息由 logic 在事务内写入）。
//!
//! 单聊会话懒创建（计划书 7.3）：`message.send` 带 `conv_id=0 + to_uid` 时，
//! 校验好友关系后按 `dialog_key = min(uid)_max(uid)` 查找/创建会话并写两行成员，
//! `uk_conv_dialog` 唯一键兜底并发重建；删除好友后旧会话保留可见但禁止再发（2002）。

use im_proto::{
    ClientMsg, ConvCursor, ConvReadNotice, ConvReadReq, ConvSyncBatchResp, ConvSyncReq,
    ConvSyncResp, Frame, FrameType, MessageAckNotice, MessagePush, MessageSendReq, SyncMessage,
};
use prost::Message as _;
use redis::AsyncCommands as _;

use crate::AppState;
use im_common::error::{ApiResult, AppError};
use im_common::redis_keys;

/// conv.sync 单会话单批上限（计划书 6.3：每会话每批 200 条）。
const SYNC_BATCH_MAX: u32 = 200;
/// 文本消息内容上限（计划书 5.2：TEXT content ≤5000 字符）。
const TEXT_CONTENT_MAX: usize = 5000;

/// sync 单条消息行：(id, sender_id, msg_type, content, seq, client_msg_id, create_ms)。
type SyncRow = (u64, u64, i8, String, i64, String, Option<i64>);

// ---------------------------------------------------------------------------
// message.send
// ---------------------------------------------------------------------------

/// 处理 `message.send`（计划书 6.2 序列）。
///
/// `resp_tx` 为当前 gRPC 流的下行通道：RESPONSE（成功 ack 之外的错误）与
/// NOTICE=message.ack 都直回当前流（发送方必然在线于该流，不依赖 presence 键）；
/// 对端推送走节点注册表（支持跨节点）。
pub async fn handle_send(
    state: &AppState,
    msg: &ClientMsg,
    resp_tx: &tokio::sync::mpsc::Sender<Result<im_proto::Downstream, tonic::Status>>,
) {
    let frame = msg.frame.as_ref().expect("dispatch 已解包 frame");
    let Some(req) = MessageSendReq::decode(frame.payload.as_slice())
        .ok()
        .filter(|r| !r.client_msg_id.is_empty())
    else {
        send_response(
            resp_tx,
            msg.uid,
            frame,
            AppError::invalid_content("client_msg_id 不能为空"),
        );
        return;
    };

    match send_message(state, msg.uid, &req).await {
        Ok((server_msg_id, seq, create_time_ms, conv_id)) => {
            // 成功：NOTICE=message.ack（client_msg_id 关联；重发同 client_msg_id 得同一 ack）
            let ack = MessageAckNotice {
                client_msg_id: req.client_msg_id.clone(),
                server_msg_id,
                conv_id,
                seq: seq as u64,
                create_time_ms,
            };
            let notice = Frame {
                id: 0,
                frame_type: FrameType::Notice as i32,
                method: "message.ack".into(),
                payload: ack.encode_to_vec(),
                code: 0,
                msg: String::new(),
            };
            send_frame_down(resp_tx, msg.uid, notice);
            tracing::info!(
                uid = msg.uid,
                conv_id,
                seq,
                server_msg_id,
                "消息已落库并 ack"
            );
        }
        Err(e) => {
            // 失败：RESPONSE 原样带回请求 id + 业务错误码（计划书 5.2 方法集）
            send_response(resp_tx, msg.uid, frame, e);
        }
    }
}

/// message.send 业务主流程：返回 (server_msg_id, seq, create_time_ms, conv_id)。
async fn send_message(
    state: &AppState,
    uid: u64,
    req: &MessageSendReq,
) -> Result<(u64, i64, i64, u64), AppError> {
    // ---- 参数与内容校验（2003） ----
    if req.client_msg_id.len() > 36 {
        return Err(AppError::invalid_content("client_msg_id 过长"));
    }
    // 客户端仅允许 TEXT(1)/IMAGE(2)/FILE(3)；SYSTEM(4) 由服务端在群事件事务内写入
    // TEXT：纯文本 ≤5000 字符；IMAGE/FILE：files 表引用 JSON（计划书 5.2）
    let content: String = match req.msg_type {
        1 => {
            let text = req.content.trim();
            if text.is_empty() {
                return Err(AppError::invalid_content("消息内容不能为空"));
            }
            if text.chars().count() > TEXT_CONTENT_MAX {
                return Err(AppError::invalid_content("消息内容超长（≤5000 字符）"));
            }
            text.to_string()
        }
        2 | 3 => validate_media_content(state, uid, req.msg_type, &req.content).await?,
        _ => return Err(AppError::invalid_content("msg_type 不允许")),
    };

    // ---- 会话定位（懒创建单聊 / 校验成员与好友） ----
    let conv_id = if req.conv_id == 0 {
        ensure_dm_conv(state, uid, req.to_uid).await?
    } else {
        req.conv_id
    };
    ensure_sendable(state, uid, conv_id).await?;

    // ---- 幂等快速窗（Redis 24h）：命中即回查原消息返回同一 ack ----
    let idem_key = redis_keys::msg_idem(conv_id, &req.client_msg_id);
    let mut redis = state.redis.clone();
    let cached: Option<String> = redis.get(&idem_key).await.map_err(|e| {
        tracing::error!("幂等键读取 Redis 错误: {e}");
        AppError::internal()
    })?;
    if let Some(server_msg_id) = cached {
        if let Ok(id) = server_msg_id.parse::<u64>() {
            if let Some(ack) = load_ack(state, conv_id, &req.client_msg_id, id).await? {
                tracing::info!(uid, conv_id, server_msg_id = id, "幂等命中（Redis 窗）");
                return Ok(ack);
            }
        }
    }

    // ---- 事务定序落库：SELECT last_seq FOR UPDATE → +1 → INSERT ----
    let msg_id = im_common::id::next_id();
    let mut tx = state.pool.begin().await.map_err(tx_err("发送事务开启"))?;

    let last_seq: i64 =
        sqlx::query_scalar("SELECT last_seq FROM conversations WHERE id = ? FOR UPDATE")
            .bind(conv_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| {
                tracing::error!("会话行锁定失败: {e}");
                AppError::conv_not_found()
            })?;
    let seq = last_seq + 1;

    let insert = sqlx::query(
        "INSERT INTO messages (id, conv_id, sender_id, msg_type, content, seq, client_msg_id) \
         VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(msg_id)
    .bind(conv_id)
    .bind(uid)
    .bind(req.msg_type)
    .bind(content)
    .bind(seq)
    .bind(&req.client_msg_id)
    .execute(&mut *tx)
    .await;

    if let Err(sqlx::Error::Database(d)) = &insert {
        if d.is_unique_violation() {
            // 撞 uk_msg_conv_client（并发重发/Redis 键已淘汰）：回滚后回查原消息返回同一 ack
            // （计划书 6.2：不返回 2004、不产生重复消息）
            drop(tx);
            tracing::info!(
                uid,
                conv_id,
                client_msg_id = req.client_msg_id,
                "撞唯一键，回查原 ack"
            );
            if let Some(ack) = load_ack(state, conv_id, &req.client_msg_id, 0).await? {
                return Ok(ack);
            }
            return Err(AppError::internal());
        }
    }
    insert.map_err(tx_err("消息写入"))?;

    sqlx::query("UPDATE conversations SET last_seq = ?, last_msg_id = ? WHERE id = ?")
        .bind(seq)
        .bind(msg_id)
        .bind(conv_id)
        .execute(&mut *tx)
        .await
        .map_err(tx_err("会话水位更新"))?;
    tx.commit().await.map_err(tx_err("发送事务提交"))?;

    // ---- 写幂等键（24h） ----
    let _: Result<(), _> = redis
        .set_ex::<_, _, ()>(
            &idem_key,
            msg_id.to_string(),
            im_common::redis_keys::MSG_IDEM_TTL.as_secs(),
        )
        .await;

    // ---- 推送其他在线成员（单聊=对端；群聊=其余成员；离线静默，重连 sync 兜底） ----
    match conv_other_members(state, uid, conv_id).await {
        Ok(others) => push_message_to(state, &others, conv_id, msg_id).await,
        Err(e) => tracing::warn!(uid, conv_id, "成员扇出查询失败: {e}"),
    }

    // 查询服务端落库时间（毫秒）回填 ack
    let create_time_ms: i64 = sqlx::query_scalar(
        "SELECT CAST(ROUND(UNIX_TIMESTAMP(created_at) * 1000) AS SIGNED) FROM messages WHERE id = ?",
    )
    .bind(msg_id)
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    Ok((msg_id, seq, create_time_ms, conv_id))
}

/// 校验 IMAGE/FILE 消息的媒体引用 JSON（计划书 5.2：信令只传引用，文件本体走 HTTP）。
///
/// content 形如 `{file_id, name, size, mime, width?, height?, thumb_file_id?}`：
/// - 必须是 JSON 对象且含非空 `file_id/name/size/mime`；
/// - file_id 对应文件必须存在、上传者为本人（防枚举/盗用他人 file_id）、
///   类型与消息类型匹配（IMAGE→files.kind=1，FILE→kind=2；头像 kind=3 不作消息发送）。
///
/// 校验通过返回 trim 后的原始 JSON 字符串（直接入库，客户端按同构 JSON 解析渲染）。
async fn validate_media_content(
    state: &AppState,
    uid: u64,
    msg_type: i32,
    raw: &str,
) -> Result<String, AppError> {
    let raw = raw.trim();
    let value: serde_json::Value = serde_json::from_str(raw)
        .map_err(|_| AppError::invalid_content("媒体消息 content 必须是合法 JSON"))?;

    // 必填字段：file_id（正整数字符串/数字均可，雪花 ID 超过 JS 安全整数时客户端用字符串）
    let file_id = value
        .get("file_id")
        .and_then(|v| v.as_u64().or_else(|| v.as_str().and_then(|s| s.parse().ok())))
        .filter(|id| *id > 0)
        .ok_or_else(|| AppError::invalid_content("媒体消息缺少 file_id"))?;
    if value
        .get("name")
        .and_then(|v| v.as_str())
        .is_none_or(|s| s.is_empty() || s.chars().count() > 255)
    {
        return Err(AppError::invalid_content("媒体消息缺少合法 name"));
    }
    value
        .get("size")
        .and_then(|v| v.as_u64())
        .ok_or_else(|| AppError::invalid_content("媒体消息缺少 size"))?;
    if value
        .get("mime")
        .and_then(|v| v.as_str())
        .is_none_or(|s| s.is_empty() || s.len() > 128)
    {
        return Err(AppError::invalid_content("媒体消息缺少合法 mime"));
    }

    // 文件存在性 + 归属 + 类型匹配（BIGINT UNSIGNED→u64，TINYINT→i8）
    let row: Option<(u64, i8)> = sqlx::query_as(
        "SELECT uploader_id, kind FROM files WHERE id = ? LIMIT 1",
    )
    .bind(file_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!(file_id, error = %e, "媒体引用校验查询失败");
        AppError::internal()
    })?;
    let Some((uploader_id, kind)) = row else {
        return Err(AppError::invalid_content("文件不存在或已失效"));
    };
    if uploader_id != uid {
        return Err(AppError::invalid_content("只能发送本人上传的文件"));
    }
    let expect_kind = if msg_type == 2 { 1 } else { 2 };
    if kind != expect_kind {
        return Err(AppError::invalid_content("文件类型与消息类型不匹配"));
    }

    Ok(raw.to_string())
}

/// 加载既有消息组装 ack：`(server_msg_id, seq, create_time_ms, conv_id)`。
///
/// `hint_id` > 0 时直接按 id 查（Redis 窗命中路径）；否则按 (conv_id, client_msg_id) 回查
/// （唯一键撞键路径）。
async fn load_ack(
    state: &AppState,
    conv_id: u64,
    client_msg_id: &str,
    hint_id: u64,
) -> ApiResult<Option<(u64, i64, i64, u64)>> {
    let row: Option<(u64, i64, Option<i64>)> = if hint_id > 0 {
        sqlx::query_as(
            "SELECT id, seq, CAST(ROUND(UNIX_TIMESTAMP(created_at) * 1000) AS SIGNED) \
             FROM messages WHERE id = ? AND conv_id = ?",
        )
        .bind(hint_id)
        .bind(conv_id)
        .fetch_optional(&state.pool)
        .await
    } else {
        sqlx::query_as(
            "SELECT id, seq, CAST(ROUND(UNIX_TIMESTAMP(created_at) * 1000) AS SIGNED) \
             FROM messages WHERE conv_id = ? AND client_msg_id = ?",
        )
        .bind(conv_id)
        .bind(client_msg_id)
        .fetch_optional(&state.pool)
        .await
    }
    .map_err(|e| {
        tracing::error!("原消息回查失败: {e}");
        AppError::internal()
    })?;
    Ok(row.map(|(id, seq, ms)| (id, seq, ms.unwrap_or(0), conv_id)))
}

/// 首次单聊懒创建：按 `dialog_key = min(uid)_max(uid)` 查找/创建会话（计划书 7.3）。
async fn ensure_dm_conv(state: &AppState, uid: u64, to_uid: u64) -> Result<u64, AppError> {
    if to_uid == 0 {
        return Err(AppError::invalid_content("首次单聊须携带 to_uid"));
    }
    if to_uid == uid {
        return Err(AppError::bad_request("不能给自己发送消息"));
    }
    // 一期限制仅好友可发起单聊
    let cnt: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM friendships \
         WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
    )
    .bind(uid)
    .bind(to_uid)
    .bind(to_uid)
    .bind(uid)
    .fetch_one(&state.pool)
    .await
    .map_err(db_err("好友关系查询"))?;
    if cnt == 0 {
        return Err(AppError::not_conv_member("仅好友之间可以发起单聊"));
    }

    let dialog_key = format!("{}_{}", uid.min(to_uid), uid.max(to_uid));
    if let Some(id) = find_dm_conv(state, &dialog_key).await? {
        return Ok(id);
    }

    // 慢路径：事务建会话 + 两行成员；uk_conv_dialog 唯一键兜底并发重建
    let conv_id = im_common::id::next_id();
    let mut tx = state.pool.begin().await.map_err(tx_err("建会话事务开启"))?;
    let r = sqlx::query("INSERT INTO conversations (id, type, dialog_key) VALUES (?, 1, ?)")
        .bind(conv_id)
        .bind(&dialog_key)
        .execute(&mut *tx)
        .await;
    if let Err(sqlx::Error::Database(d)) = &r {
        if d.is_unique_violation() {
            drop(tx); // 回滚本事务，复用并发方已建的会话
            if let Some(id) = find_dm_conv(state, &dialog_key).await? {
                return Ok(id);
            }
            return Err(AppError::internal());
        }
    }
    r.map_err(tx_err("会话创建"))?;
    sqlx::query("INSERT IGNORE INTO conversation_members (conv_id, user_id) VALUES (?, ?), (?, ?)")
        .bind(conv_id)
        .bind(uid)
        .bind(conv_id)
        .bind(to_uid)
        .execute(&mut *tx)
        .await
        .map_err(tx_err("成员写入"))?;
    tx.commit().await.map_err(tx_err("建会话事务提交"))?;
    tracing::info!(uid, to_uid, conv_id, "单聊会话已懒创建");
    Ok(conv_id)
}

/// 按 dialog_key 查找已存在的单聊会话。
async fn find_dm_conv(state: &AppState, dialog_key: &str) -> Result<Option<u64>, AppError> {
    sqlx::query_scalar("SELECT id FROM conversations WHERE dialog_key = ? LIMIT 1")
        .bind(dialog_key)
        .fetch_optional(&state.pool)
        .await
        .map_err(db_err("dialog_key 会话查询"))
}

/// 发送资格校验：会话存在（2001）+ 我是成员（2002）+ 单聊双方仍是好友（2002，删好友只读）。
async fn ensure_sendable(state: &AppState, uid: u64, conv_id: u64) -> Result<(), AppError> {
    let conv_type: Option<i8> =
        sqlx::query_scalar("SELECT type FROM conversations WHERE id = ? LIMIT 1")
            .bind(conv_id)
            .fetch_optional(&state.pool)
            .await
            .map_err(db_err("会话存在性查询"))?;
    let conv_type = conv_type.ok_or_else(AppError::conv_not_found)?;

    let member: Option<u64> = sqlx::query_scalar(
        "SELECT user_id FROM conversation_members WHERE conv_id = ? AND user_id = ?",
    )
    .bind(conv_id)
    .bind(uid)
    .fetch_optional(&state.pool)
    .await
    .map_err(db_err("成员查询"))?;
    if member.is_none() {
        return Err(AppError::not_conv_member("你不是该会话成员"));
    }

    if conv_type == 1 {
        if let Some(peer) = dm_peer(state, uid, conv_id).await? {
            let cnt: i64 = sqlx::query_scalar(
                "SELECT COUNT(*) FROM friendships WHERE user_id = ? AND friend_id = ?",
            )
            .bind(uid)
            .bind(peer)
            .fetch_one(&state.pool)
            .await
            .map_err(db_err("好友关系查询"))?;
            if cnt == 0 {
                return Err(AppError::not_conv_member("已删除好友，会话暂不可发送消息"));
            }
        }
    }
    Ok(())
}

/// 单聊对端 uid（conversation_members 中另一行）；群会话返回 None。
async fn dm_peer(state: &AppState, uid: u64, conv_id: u64) -> Result<Option<u64>, AppError> {
    sqlx::query_scalar(
        "SELECT user_id FROM conversation_members WHERE conv_id = ? AND user_id != ? LIMIT 1",
    )
    .bind(conv_id)
    .bind(uid)
    .fetch_optional(&state.pool)
    .await
    .map_err(db_err("对端查询"))
}

/// 会话内除本人外的全部成员 uid（单聊=对端一人；群聊=其余成员）。
async fn conv_other_members(
    state: &AppState,
    exclude_uid: u64,
    conv_id: u64,
) -> ApiResult<Vec<u64>> {
    sqlx::query_scalar(
        "SELECT user_id FROM conversation_members WHERE conv_id = ? AND user_id != ?",
    )
    .bind(conv_id)
    .bind(exclude_uid)
    .fetch_all(&state.pool)
    .await
    .map_err(db_err("成员列表查询"))
}

/// 向多个用户推送 NOTICE=message.push（消息本体 + 发送者资料快照只查一次）。
///
/// 扇出规则（计划书 6.5）：目标全部成员 → MGET presence 按网关节点聚合 →
/// 每节点一条 gRPC Push（批量 uids）；离线成员静默跳过（重连 conv.sync 兜底）。
async fn push_message_to(state: &AppState, to_uids: &[u64], conv_id: u64, msg_id: u64) {
    if to_uids.is_empty() {
        return;
    }
    // 消息本体 + 发送者昵称/头像快照（客户端免二次查询）
    let row: Option<(u64, i8, String, i64, String, Option<i64>)> = sqlx::query_as(
        "SELECT m.sender_id, m.msg_type, m.content, m.seq, m.client_msg_id, \
         CAST(ROUND(UNIX_TIMESTAMP(m.created_at) * 1000) AS SIGNED) \
         FROM messages m WHERE m.id = ? AND m.conv_id = ?",
    )
    .bind(msg_id)
    .bind(conv_id)
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();
    let Some((sender_id, msg_type, content, seq, client_msg_id, create_ms)) = row else {
        return;
    };
    let (nickname, _avatar): (Option<String>, Option<u64>) = sqlx::query_as(
        "SELECT p.nickname, p.avatar_file_id FROM users u \
         LEFT JOIN user_profiles p ON p.user_id = u.id WHERE u.id = ?",
    )
    .bind(sender_id)
    .fetch_one(&state.pool)
    .await
    .unwrap_or((None, None));

    let sync_msg = SyncMessage {
        id: msg_id,
        conv_id,
        sender_id,
        msg_type: msg_type as i32,
        content,
        seq: seq as u64,
        client_msg_id,
        create_time_ms: create_ms.unwrap_or(0),
    };
    let push = MessagePush {
        message: Some(sync_msg),
        sender_nickname: nickname.unwrap_or_default(),
        // 头像下载路径 W8 文件模块落地后填充；一期固定空串（默认头像）
        sender_avatar: String::new(),
    };
    let frame = Frame {
        id: 0,
        frame_type: FrameType::Notice as i32,
        method: "message.push".into(),
        payload: push.encode_to_vec(),
        code: 0,
        msg: String::new(),
    };
    push_frame_to_many(state, to_uids, frame).await;
}

/// 向全部在线成员广播 NOTICE=group.event（计划书 6.5 第 6 条；离线成员由
/// 重连后拉取群资料与历史系统消息兜底）。
pub async fn broadcast_group_event(
    state: &AppState,
    member_uids: &[u64],
    group_id: u64,
    event_type: &str,
    data_json: &str,
) {
    if member_uids.is_empty() {
        return;
    }
    let notice = im_proto::GroupEventNotice {
        group_id,
        event_type: event_type.into(),
        data_json: data_json.into(),
    };
    let frame = Frame {
        id: 0,
        frame_type: FrameType::Notice as i32,
        method: "group.event".into(),
        payload: notice.encode_to_vec(),
        code: 0,
        msg: String::new(),
    };
    push_frame_to_many(state, member_uids, frame).await;
}

/// 在线扇出原语：MGET presence → 按节点聚合 → 每节点一条 Push（批量 uids）。
///
/// presence 查询失败视为全员离线（静默放弃本次推送，客户端重连 sync 兜底）。
async fn push_frame_to_many(state: &AppState, uids: &[u64], frame: Frame) {
    let keys: Vec<String> = uids.iter().map(|u| redis_keys::presence(*u)).collect();
    let mut redis = state.redis.clone();
    let nodes: Result<Vec<Option<String>>, _> =
        redis::cmd("MGET").arg(&keys).query_async(&mut redis).await;
    let Ok(nodes) = nodes else {
        tracing::warn!("批量 presence 查询失败，放弃本次在线推送");
        return;
    };

    // node_id → 该节点上的目标 uid 集合
    let mut by_node: std::collections::HashMap<String, Vec<u64>> = std::collections::HashMap::new();
    for (uid, node) in uids.iter().zip(nodes) {
        if let Some(node_id) = node {
            by_node.entry(node_id).or_default().push(*uid);
        }
    }
    for (node_id, batch) in by_node {
        state
            .nodes
            .push_to_node(&node_id, frame.clone(), batch)
            .await;
    }
}

// ---------------------------------------------------------------------------
// conv.sync
// ---------------------------------------------------------------------------

/// 处理 `conv.sync`：多会话差量同步（计划书 6.3）。
///
/// 每会话独立游标：`start = max(has_seq, join_seq)`（群会话入群前消息不下发），
/// 返回其后 ≤batch 条（seq 升序）+ has_more。非成员会话返回空批（客户端可感知失效）。
pub async fn handle_sync(
    state: &AppState,
    msg: &ClientMsg,
    resp_tx: &tokio::sync::mpsc::Sender<Result<im_proto::Downstream, tonic::Status>>,
) {
    let frame = msg.frame.as_ref().expect("dispatch 已解包 frame");
    let req = match ConvSyncReq::decode(frame.payload.as_slice()) {
        Ok(r) => r,
        Err(_) => {
            send_response(
                resp_tx,
                msg.uid,
                frame,
                AppError::bad_request("conv.sync payload 非法"),
            );
            return;
        }
    };
    let batch = req.batch_size.clamp(1, SYNC_BATCH_MAX);

    let mut convs = Vec::with_capacity(req.cursors.len());
    for cursor in &req.cursors {
        convs.push(sync_one_conv(state, msg.uid, cursor, batch).await);
    }

    let resp = ConvSyncBatchResp { convs };
    let resp_frame = Frame {
        id: frame.id,
        frame_type: FrameType::Response as i32,
        method: frame.method.clone(),
        payload: resp.encode_to_vec(),
        code: 0,
        msg: String::new(),
    };
    send_frame_down(resp_tx, msg.uid, resp_frame);
}

/// 单会话同步：游标之后的最多 batch 条（seq 升序）。
async fn sync_one_conv(
    state: &AppState,
    uid: u64,
    cursor: &ConvCursor,
    batch: u32,
) -> ConvSyncResp {
    // 成员与 join_seq：非成员/会话不存在 → 空批（不泄露会话存在性）
    let join_seq: Option<i64> = sqlx::query_scalar(
        "SELECT cm.join_seq FROM conversation_members cm \
         JOIN conversations c ON c.id = cm.conv_id \
         WHERE cm.conv_id = ? AND cm.user_id = ?",
    )
    .bind(cursor.conv_id)
    .bind(uid)
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();
    let Some(join_seq) = join_seq else {
        return ConvSyncResp {
            conv_id: cursor.conv_id,
            messages: vec![],
            has_more: false,
        };
    };

    // 起点 = max(客户端游标, join_seq)：群会话强制入群基线（计划书 6.3）
    let start = (cursor.has_seq as i64).max(join_seq);
    let rows: Vec<SyncRow> = sqlx::query_as(
        "SELECT id, sender_id, msg_type, content, seq, client_msg_id, \
         CAST(ROUND(UNIX_TIMESTAMP(created_at) * 1000) AS SIGNED) \
         FROM messages WHERE conv_id = ? AND seq > ? ORDER BY seq LIMIT ?",
    )
    .bind(cursor.conv_id)
    .bind(start)
    .bind(batch + 1)
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let has_more = rows.len() > batch as usize;
    let messages = rows
        .into_iter()
        .take(batch as usize)
        .map(
            |(id, sender_id, msg_type, content, seq, client_msg_id, ms)| SyncMessage {
                id,
                conv_id: cursor.conv_id,
                sender_id,
                msg_type: msg_type as i32,
                content,
                seq: seq as u64,
                client_msg_id,
                create_time_ms: ms.unwrap_or(0),
            },
        )
        .collect();

    ConvSyncResp {
        conv_id: cursor.conv_id,
        messages,
        has_more,
    }
}

// ---------------------------------------------------------------------------
// conv.read
// ---------------------------------------------------------------------------

/// 处理 `conv.read`：已读水位单调前进（计划书 6.4）。
///
/// 成员校验 → `read_seq = GREATEST(read_seq, ?)` → 单聊向对方在线连接下发
/// NOTICE=conv.read（群聊不广播）→ RESPONSE code=0。
pub async fn handle_read(
    state: &AppState,
    msg: &ClientMsg,
    resp_tx: &tokio::sync::mpsc::Sender<Result<im_proto::Downstream, tonic::Status>>,
) {
    let frame = msg.frame.as_ref().expect("dispatch 已解包 frame");
    let req = match ConvReadReq::decode(frame.payload.as_slice()) {
        Ok(r) => r,
        Err(_) => {
            send_response(
                resp_tx,
                msg.uid,
                frame,
                AppError::bad_request("conv.read payload 非法"),
            );
            return;
        }
    };

    match report_read(state, msg.uid, &req).await {
        Ok(Some(peer)) => {
            // 单聊已读通知（对方在线才推）
            let notice = ConvReadNotice {
                conv_id: req.conv_id,
                user_id: msg.uid,
                read_seq: req.read_seq,
            };
            let frame = Frame {
                id: 0,
                frame_type: FrameType::Notice as i32,
                method: "conv.read".into(),
                payload: notice.encode_to_vec(),
                code: 0,
                msg: String::new(),
            };
            push_to_user(state, peer, frame).await;
            send_ok(resp_tx, msg.uid, msg.frame.as_ref().expect("frame"));
        }
        Ok(None) => send_ok(resp_tx, msg.uid, msg.frame.as_ref().expect("frame")),
        Err(e) => send_response(resp_tx, msg.uid, frame, e),
    }
}

/// 已读水位单调前进；返回 `Some(对端uid)` 表示单聊且需通知对方。
async fn report_read(
    state: &AppState,
    uid: u64,
    req: &ConvReadReq,
) -> Result<Option<u64>, AppError> {
    // 会话存在 + 我是成员
    let conv_type: Option<i8> =
        sqlx::query_scalar("SELECT type FROM conversations WHERE id = ? LIMIT 1")
            .bind(req.conv_id)
            .fetch_optional(&state.pool)
            .await
            .map_err(db_err("会话存在性查询"))?;
    let conv_type = conv_type.ok_or_else(AppError::conv_not_found)?;

    let mut tx = state.pool.begin().await.map_err(tx_err("已读事务开启"))?;
    let r = sqlx::query(
        "UPDATE conversation_members SET read_seq = GREATEST(read_seq, ?) \
         WHERE conv_id = ? AND user_id = ?",
    )
    .bind(req.read_seq as i64)
    .bind(req.conv_id)
    .bind(uid)
    .execute(&mut *tx)
    .await
    .map_err(tx_err("已读水位更新"))?;
    tx.commit().await.map_err(tx_err("已读事务提交"))?;
    if r.rows_affected() == 0 {
        return Err(AppError::not_conv_member("你不是该会话成员"));
    }

    if conv_type == 1 {
        return dm_peer(state, uid, req.conv_id).await;
    }
    Ok(None) // 群聊不广播已读（计划书 6.4）
}

// ---------------------------------------------------------------------------
// presence（计划书 6.6：上下线事件 → 好友 presence.change 推送）
// ---------------------------------------------------------------------------

/// 处理 gateway 上报的在线状态事件：向该用户在线好友推送 presence.change。
///
/// 限频 10 秒/人（按接收者）：Redis `presence:chg:{接收者}` SET NX EX 10，
/// 抢到才推，避免批量上下线的抖动风暴。
pub async fn handle_presence_event(state: &AppState, uid: u64, online: bool) {
    if uid == 0 {
        return;
    }
    // 我的好友列表
    let friends: Vec<u64> =
        sqlx::query_scalar("SELECT friend_id FROM friendships WHERE user_id = ?")
            .bind(uid)
            .fetch_all(&state.pool)
            .await
            .unwrap_or_default();
    if friends.is_empty() {
        return;
    }

    // 批量查好友在线状态（MGET presence 键）
    let keys: Vec<String> = friends.iter().map(|f| redis_keys::presence(*f)).collect();
    let mut redis = state.redis.clone();
    let nodes: Result<Vec<Option<String>>, _> =
        redis::cmd("MGET").arg(&keys).query_async(&mut redis).await;
    let Ok(nodes) = nodes else {
        tracing::warn!("presence 事件好友在线查询失败");
        return;
    };

    let notice = im_proto::PresenceChangeNotice {
        user_id: uid,
        online,
    };
    let frame = Frame {
        id: 0,
        frame_type: FrameType::Notice as i32,
        method: "presence.change".into(),
        payload: notice.encode_to_vec(),
        code: 0,
        msg: String::new(),
    };

    for (friend, node) in friends.into_iter().zip(nodes) {
        let Some(_node_id) = node else { continue }; // 离线好友跳过
                                                     // 限频：该接收者 10 秒内只推一条（SET NX EX 10）
        let key = redis_keys::presence_chg_limited(friend);
        let acquired: Result<Option<String>, _> = redis::cmd("SET")
            .arg(&key)
            .arg(1i64)
            .arg("NX")
            .arg("EX")
            .arg(10i64)
            .query_async(&mut redis)
            .await;
        if !matches!(acquired, Ok(Some(_))) {
            continue;
        }
        push_to_user(state, friend, frame.clone()).await;
    }
}

// ---------------------------------------------------------------------------
// 下行发送辅助
// ---------------------------------------------------------------------------

/// 经节点注册表向用户在线连接推一帧（presence 查节点；离线/节点丢失静默）。
async fn push_to_user(state: &AppState, uid: u64, frame: Frame) {
    let mut redis = state.redis.clone();
    let node: Option<String> = redis.get(redis_keys::presence(uid)).await.unwrap_or(None);
    if let Some(node_id) = node {
        state.nodes.push_to_node(&node_id, frame, vec![uid]).await;
    }
}

/// RESPONSE 帧（错误出口）：id 原样带回，payload 为空，code/msg 填业务错误。
fn send_response(
    resp_tx: &tokio::sync::mpsc::Sender<Result<im_proto::Downstream, tonic::Status>>,
    uid: u64,
    req_frame: &Frame,
    err: AppError,
) {
    let resp = Frame {
        id: req_frame.id,
        frame_type: FrameType::Response as i32,
        method: req_frame.method.clone(),
        payload: Vec::new(),
        code: err.code,
        msg: err.msg,
    };
    send_frame_down(resp_tx, uid, resp);
}

/// RESPONSE 帧（成功出口，无 payload）。
fn send_ok(
    resp_tx: &tokio::sync::mpsc::Sender<Result<im_proto::Downstream, tonic::Status>>,
    uid: u64,
    req_frame: &Frame,
) {
    let resp = Frame {
        id: req_frame.id,
        frame_type: FrameType::Response as i32,
        method: req_frame.method.clone(),
        payload: Vec::new(),
        code: 0,
        msg: String::new(),
    };
    send_frame_down(resp_tx, uid, resp);
}

/// 帧经当前 gRPC 流下发（uids=[目标 uid]，gateway 收到后按 uids 路由到连接；
/// 发送方帧直回其所在流，可靠不依赖 presence 键）。
fn send_frame_down(
    resp_tx: &tokio::sync::mpsc::Sender<Result<im_proto::Downstream, tonic::Status>>,
    uid: u64,
    frame: Frame,
) {
    let down = im_proto::Downstream {
        body: Some(im_proto::downstream::Body::Push(im_proto::Push {
            uids: vec![uid],
            frame: Some(frame),
        })),
    };
    if let Err(e) = resp_tx.try_send(Ok(down)) {
        tracing::warn!(uid, "下行帧发送失败: {e}");
    }
}

/// DB 错误 → 5000（保留日志细节）。
fn db_err(ctx: &'static str) -> impl Fn(sqlx::Error) -> AppError {
    move |e| {
        tracing::error!("{ctx}失败: {e}");
        AppError::internal()
    }
}

/// 事务错误 → 5000（保留日志细节）。
fn tx_err(ctx: &'static str) -> impl Fn(sqlx::Error) -> AppError {
    move |e| {
        tracing::error!("{ctx}失败: {e}");
        AppError::internal()
    }
}
