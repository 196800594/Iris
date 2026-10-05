//! conversations 模块 —— 会话 REST 接口（技术文档 5.2 清单 / 计划书 6.4 未读公式）。
//!
//! - GET /conversations：我的会话列表（最后消息 + 未读数 + 单聊对端/群资料）；
//! - GET /conversations/{id}/messages?before_seq=&limit=：历史消息分页
//!   （seq 倒序游标，最新在前；群会话强制 `seq > join_seq`）。
//!
//! 未读数（计划书 6.4）：`max(0, last_seq − max(read_seq, join_seq))`——
//! 单聊 join_seq 恒为 0；群聊以入群时刻为基线，入群前消息不计未读。

use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::Json;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::middleware::AuthUser;
use crate::AppState;
use im_common::error::{ApiResult, AppError};

/// conversations 路由挂载点（嵌于 /api/v1 下，全部需 Bearer access）。
pub fn router() -> axum::Router<Arc<AppState>> {
    axum::Router::new()
        .route("/conversations", axum::routing::get(list_conversations))
        .route(
            "/conversations/{id}/messages",
            axum::routing::get(list_messages),
        )
}

// ---------------------------------------------------------------------------
// GET /conversations
// ---------------------------------------------------------------------------

/// 会话主行（与主查询列序一致）。
#[derive(Debug, FromRow)]
struct ConvRow {
    /// 会话 ID
    id: u64,
    /// 1 单聊 2 群聊
    conv_type: i8,
    /// 关联群 ID（type=2 时有值）
    group_id: Option<u64>,
    /// 会话最新序号
    last_seq: i64,
    /// 我的已读水位
    read_seq: i64,
    /// 我的入群基线（单聊恒 0）
    join_seq: i64,
    /// 群名（type=2）
    group_name: Option<String>,
    /// 群头像文件 ID（type=2）
    group_avatar: Option<u64>,
    /// 最后消息类型（无消息 → NULL）
    last_msg_type: Option<i8>,
    /// 最后消息内容
    last_content: Option<String>,
    /// 最后消息发送者
    last_sender: Option<u64>,
    /// 最后消息时间（毫秒）
    last_ms: Option<i64>,
    /// 会话最后活跃时间（毫秒，排序键）
    updated_ms: i64,
}

/// 单聊对端行（对 type=1 的会话逐行补充）。
#[derive(Debug, FromRow)]
struct PeerRow {
    /// 会话 ID
    conv_id: u64,
    /// 对端用户 ID
    peer_id: u64,
    /// 对端登录名
    username: String,
    /// 对端昵称
    nickname: Option<String>,
    /// 对端头像文件 ID
    avatar_file_id: Option<u64>,
    /// 我给对端设的备注（仅自己可见）
    remark: Option<String>,
}

/// 会话列表项响应。
#[derive(Debug, Serialize)]
struct ConversationResp {
    /// 会话 ID（字符串避免 JS 精度丢失）
    id: String,
    /// 1 单聊 2 群聊
    conv_type: i8,
    /// 未读数 = max(0, last_seq − max(read_seq, join_seq))
    unread: i64,
    /// 最后一条消息（会话尚无消息 → null）
    last_msg: Option<LastMsgResp>,
    /// 单聊对端信息（type=1）
    peer: Option<PeerResp>,
    /// 群信息（type=2）
    group: Option<GroupResp>,
    /// 会话最后活跃时间（毫秒）
    updated_ms: i64,
}

/// 最后一条消息摘要。
#[derive(Debug, Serialize)]
struct LastMsgResp {
    /// 消息类型（proto MsgType：1 文本 2 图片 3 文件 4 系统）
    msg_type: i8,
    /// 文本原文或媒体 JSON
    content: String,
    /// 发送者 uid
    sender_id: String,
    /// 服务端时间（毫秒）
    create_time_ms: i64,
}

/// 单聊对端信息。
#[derive(Debug, Serialize)]
struct PeerResp {
    /// 用户 ID
    id: String,
    /// 登录名
    username: String,
    /// 昵称（缺省兜底用户名）
    nickname: String,
    /// 头像文件 ID
    avatar_file_id: Option<String>,
    /// 我的备注（空串 = 未设置）
    remark: String,
}

/// 群信息。
#[derive(Debug, Serialize)]
struct GroupResp {
    /// 群 ID
    id: String,
    /// 群名
    name: String,
    /// 群头像文件 ID
    avatar_file_id: Option<String>,
}

/// GET /conversations —— 我的会话列表（最后消息 + 未读数）。
pub async fn list_conversations(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
) -> ApiResult<Json<serde_json::Value>> {
    // 主查询：我的全部会话 + 成员水位 + 群资料 + 最后消息快照
    let convs: Vec<ConvRow> = sqlx::query_as(
        "SELECT c.id, c.type AS conv_type, c.group_id, c.last_seq, cm.read_seq, cm.join_seq, \
         g.name AS group_name, g.avatar_file_id AS group_avatar, \
         m.msg_type AS last_msg_type, m.content AS last_content, m.sender_id AS last_sender, \
         CAST(ROUND(UNIX_TIMESTAMP(m.created_at) * 1000) AS SIGNED) AS last_ms, \
         CAST(ROUND(UNIX_TIMESTAMP(c.updated_at) * 1000) AS SIGNED) AS updated_ms \
         FROM conversation_members cm \
         JOIN conversations c ON c.id = cm.conv_id \
         LEFT JOIN `groups` g ON g.conv_id = c.id \
         LEFT JOIN messages m ON m.id = c.last_msg_id \
         WHERE cm.user_id = ? \
         ORDER BY c.updated_at DESC",
    )
    .bind(auth.uid)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("会话列表查询失败: {e}");
        AppError::internal()
    })?;

    // 单聊对端信息（含我的备注）：一次 JOIN 查出全部 type=1 会话的对端
    let peers: Vec<PeerRow> = sqlx::query_as(
        "SELECT cm.conv_id, cm2.user_id AS peer_id, u.username, p.nickname, p.avatar_file_id, f.remark \
         FROM conversation_members cm \
         JOIN conversations c ON c.id = cm.conv_id AND c.type = 1 \
         JOIN conversation_members cm2 ON cm2.conv_id = cm.conv_id AND cm2.user_id != cm.user_id \
         JOIN users u ON u.id = cm2.user_id \
         LEFT JOIN user_profiles p ON p.user_id = cm2.user_id \
         LEFT JOIN friendships f ON f.user_id = cm.user_id AND f.friend_id = cm2.user_id \
         WHERE cm.user_id = ?",
    )
    .bind(auth.uid)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("单聊对端查询失败: {e}");
        AppError::internal()
    })?;
    let mut peer_map: std::collections::HashMap<u64, PeerRow> =
        peers.into_iter().map(|p| (p.conv_id, p)).collect();

    let list: Vec<ConversationResp> = convs
        .into_iter()
        .map(|r| {
            let unread = (r.last_seq - r.read_seq.max(r.join_seq)).max(0);
            let peer = peer_map.remove(&r.id).map(|p| {
                let username = p.username;
                PeerResp {
                    id: p.peer_id.to_string(),
                    nickname: p.nickname.unwrap_or_else(|| username.clone()),
                    username,
                    avatar_file_id: p.avatar_file_id.map(|v| v.to_string()),
                    remark: p.remark.unwrap_or_default(),
                }
            });
            let group = match (r.conv_type, r.group_id) {
                (2, Some(gid)) => Some(GroupResp {
                    id: gid.to_string(),
                    name: r.group_name.clone().unwrap_or_default(),
                    avatar_file_id: r.group_avatar.map(|v| v.to_string()),
                }),
                _ => None,
            };
            ConversationResp {
                id: r.id.to_string(),
                conv_type: r.conv_type,
                unread,
                last_msg: r.last_msg_type.map(|t| LastMsgResp {
                    msg_type: t,
                    content: r.last_content.clone().unwrap_or_default(),
                    sender_id: r.last_sender.map(|v| v.to_string()).unwrap_or_default(),
                    create_time_ms: r.last_ms.unwrap_or(0),
                }),
                peer,
                group,
                updated_ms: r.updated_ms,
            }
        })
        .collect();

    Ok(Json(serde_json::json!({ "conversations": list })))
}

// ---------------------------------------------------------------------------
// GET /conversations/{id}/messages
// ---------------------------------------------------------------------------

/// 历史消息查询参数。
#[derive(Debug, Deserialize)]
pub struct MessagesQuery {
    /// 游标：返回 seq < before_seq 的消息（缺省 = 最新，即 last_seq + 1）
    pub before_seq: Option<i64>,
    /// 每页条数（默认 50，上限 200）
    pub limit: Option<u32>,
}

/// 历史消息行（与查询列序一致）。
#[derive(Debug, FromRow)]
struct HistoryRow {
    /// 消息雪花 ID
    id: u64,
    /// 发送者 uid
    sender_id: u64,
    /// 消息类型（proto MsgType）
    msg_type: i8,
    /// 文本原文或媒体 JSON
    content: String,
    /// 会话内序号
    seq: i64,
    /// 幂等键
    client_msg_id: String,
    /// 服务端时间（毫秒）
    create_time_ms: Option<i64>,
}

/// 单条历史消息响应。
#[derive(Debug, Serialize)]
struct HistoryMsgResp {
    /// 消息 ID（字符串避免 JS 精度丢失）
    id: String,
    /// 会话 ID
    conv_id: String,
    /// 发送者 uid
    sender_id: String,
    /// 消息类型
    msg_type: i8,
    /// 内容
    content: String,
    /// 会话内序号
    seq: i64,
    /// 幂等键
    client_msg_id: String,
    /// 服务端时间（毫秒）
    create_time_ms: i64,
}

/// GET /conversations/{id}/messages —— 历史消息分页（seq 倒序游标，最新在前）。
///
/// 校验会话存在（2001）与成员资格（2002）；群会话强制 `seq > join_seq`
/// （入群前历史既不下发，计划书 6.3/6.4）。响应携带 `next_before_seq`
/// 供继续上翻；`has_more=false` 表示已到顶。
pub async fn list_messages(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(conv_id): Path<u64>,
    Query(q): Query<MessagesQuery>,
) -> ApiResult<Json<serde_json::Value>> {
    let limit = q.limit.unwrap_or(50).clamp(1, 200);

    // 会话存在性 + 我的成员水位
    let row: Option<(i8, i64, i64, i64)> = sqlx::query_as(
        "SELECT c.type, c.last_seq, cm.read_seq, cm.join_seq \
         FROM conversations c \
         JOIN conversation_members cm ON cm.conv_id = c.id AND cm.user_id = ? \
         WHERE c.id = ?",
    )
    .bind(auth.uid)
    .bind(conv_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("会话成员查询失败: {e}");
        AppError::internal()
    })?;
    let (_, last_seq, _, join_seq) =
        row.ok_or_else(|| AppError::not_conv_member("你不是该会话成员"))?;

    // 游标：缺省从最新开始；下界 join_seq（群入群基线；单聊恒 0）
    let before = q.before_seq.unwrap_or(last_seq + 1);
    let rows: Vec<HistoryRow> = sqlx::query_as(
        "SELECT id, sender_id, msg_type, content, seq, client_msg_id, \
         CAST(ROUND(UNIX_TIMESTAMP(created_at) * 1000) AS SIGNED) AS create_time_ms \
         FROM messages \
         WHERE conv_id = ? AND seq < ? AND seq > ? \
         ORDER BY seq DESC LIMIT ?",
    )
    .bind(conv_id)
    .bind(before)
    .bind(join_seq)
    .bind(limit + 1)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("历史消息查询失败: {e}");
        AppError::internal()
    })?;

    let has_more = rows.len() > limit as usize;
    let mut page: Vec<HistoryRow> = rows.into_iter().take(limit as usize).collect();
    // next_before_seq = 本页最小 seq（继续上翻的游标；页空则置 0）
    let next_before_seq = page.last().map(|r| r.seq).unwrap_or(0);

    let messages: Vec<HistoryMsgResp> = page
        .drain(..)
        .map(|r| HistoryMsgResp {
            id: r.id.to_string(),
            conv_id: conv_id.to_string(),
            sender_id: r.sender_id.to_string(),
            msg_type: r.msg_type,
            content: r.content,
            seq: r.seq,
            client_msg_id: r.client_msg_id,
            create_time_ms: r.create_time_ms.unwrap_or(0),
        })
        .collect();

    Ok(Json(serde_json::json!({
        "messages": messages,
        "has_more": has_more,
        "next_before_seq": next_before_seq,
    })))
}
