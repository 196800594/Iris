//! contacts 模块 —— 好友关系链（技术文档 5.1 第 4 条 / REST 清单 5.2 / 计划书 7.2 DDL）。
//!
//! - POST /contacts/requests：发起好友申请（每对人一行，重复申请刷新并重置为待处理）；
//! - GET /contacts/requests?direction=incoming|outgoing：收到 / 发出的申请（最近 50 条）；
//! - POST /contacts/requests/{id}/accept：同意（事务写双向 friendships 两行）；
//! - POST /contacts/requests/{id}/reject：拒绝（幂等，可重复拒绝）；
//! - GET /contacts/friends：好友列表（备注 + 在线快照，在线快照 Redis 故障时降级为全离线）；
//! - PUT /contacts/friends/{id}/remark：修改好友备注（仅自己可见）；
//! - DELETE /contacts/friends/{id}：删除好友（双向两行同语句物理删除；会话与历史保留，W4 处理只读）。
//!
//! 关键规则（计划书 v1.1 / 5.3 错误码）：
//! - 申请对象必须存在（1008）；不能加自己（1006）；已是好友（3001）；
//! - 对方已有待处理申请指向我时拒绝受理新申请（3002），避免两条申请互锁；
//! - friendships 双向两行由同意事务写入，`uk_friendship_pair` 唯一键兜底并发（INSERT IGNORE）。

use std::collections::HashMap;
use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::Json;
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use validator::Validate;

use crate::middleware::AuthUser;
use crate::AppState;
use im_common::error::{ApiResult, AppError};
use im_common::redis_keys;

/// contacts 路由挂载点（嵌于 /api/v1 下，全部需 Bearer access）。
pub fn router() -> axum::Router<Arc<AppState>> {
    axum::Router::new()
        .route(
            "/contacts/requests",
            axum::routing::post(apply).get(list_requests),
        )
        .route(
            "/contacts/requests/{id}/accept",
            axum::routing::post(accept),
        )
        .route(
            "/contacts/requests/{id}/reject",
            axum::routing::post(reject),
        )
        .route("/contacts/friends", axum::routing::get(list_friends))
        .route(
            "/contacts/friends/{id}/remark",
            axum::routing::put(set_remark),
        )
        .route(
            "/contacts/friends/{id}",
            axum::routing::delete(delete_friend),
        )
}

// ---------------------------------------------------------------------------
// DTO
// ---------------------------------------------------------------------------

/// POST /contacts/requests 请求体。
#[derive(Debug, Deserialize, Validate)]
pub struct ApplyReq {
    /// 目标用户 ID（雪花，数值）
    pub to_uid: u64,
    /// 打招呼内容（可空，最长 64 字符，DDL VARCHAR(64)）
    #[validate(length(max = 64, message = "打招呼最长 64 字符"))]
    pub greeting: Option<String>,
}

/// GET /contacts/requests 查询参数。
#[derive(Debug, Deserialize)]
pub struct ListRequestsQuery {
    /// 方向：incoming（收到的，默认）/ outgoing（发出的）
    pub direction: Option<String>,
}

/// PUT /contacts/friends/{id}/remark 请求体。
#[derive(Debug, Deserialize, Validate)]
pub struct RemarkReq {
    /// 备注内容（0-32 字符，空串即清除备注）
    #[validate(length(max = 32, message = "备注最长 32 字符"))]
    pub remark: String,
}

/// 申请表 JOIN 行（other_* 为对端用户信息；与 SQL 列序一致）。
#[derive(Debug, FromRow)]
struct RequestRow {
    /// 申请 ID
    id: u64,
    /// 对端用户 ID（incoming 时为申请人，outgoing 时为接收人）
    other_id: u64,
    /// 打招呼内容
    greeting: String,
    /// 0 待处理 1 已同意 2 已拒绝
    status: i8,
    /// 申请时间
    created_at: NaiveDateTime,
    /// 对端登录名
    username: String,
    /// 对端昵称（profile 缺失 → NULL）
    nickname: Option<String>,
    /// 对端头像文件 ID
    avatar_file_id: Option<u64>,
}

/// 申请列表项响应。
#[derive(Debug, Serialize)]
struct RequestResp {
    /// 申请 ID（字符串避免 JS 精度丢失）
    id: String,
    /// 0 待处理 1 已同意 2 已拒绝
    status: i8,
    /// 打招呼内容
    greeting: String,
    /// 申请时间（本地格式化字符串）
    created_at: String,
    /// 对端用户信息
    user: BriefUser,
}

/// 好友表 JOIN 行（与 SQL 列序一致）。
#[derive(Debug, FromRow)]
struct FriendRow {
    /// 好友用户 ID
    friend_id: u64,
    /// 我的备注（仅自己可见）
    remark: String,
    /// 成为好友时间
    created_at: NaiveDateTime,
    /// 好友登录名
    username: String,
    /// 好友昵称
    nickname: Option<String>,
    /// 好友头像文件 ID
    avatar_file_id: Option<u64>,
}

/// 好友列表项响应。
#[derive(Debug, Serialize)]
struct FriendResp {
    /// 用户 ID（字符串避免 JS 精度丢失）
    id: String,
    /// 登录名
    username: String,
    /// 昵称（缺省兜底为用户名）
    nickname: String,
    /// 头像文件 ID（null = 默认头像）
    avatar_file_id: Option<String>,
    /// 我的备注（空串 = 未设置）
    remark: String,
    /// 在线快照（presence 键存在即在线；Redis 故障降级为 false）
    online: bool,
    /// 成为好友时间
    befriend_at: String,
}

/// 申请列表中对端用户简要信息。
#[derive(Debug, Serialize)]
struct BriefUser {
    /// 用户 ID
    id: String,
    /// 登录名
    username: String,
    /// 昵称（缺省兜底为用户名）
    nickname: String,
    /// 头像文件 ID
    avatar_file_id: Option<String>,
}

/// DATETIME(3) → "YYYY-MM-DD HH:MM:SS" 字符串。
fn fmt_time(t: NaiveDateTime) -> String {
    t.format("%Y-%m-%d %H:%M:%S").to_string()
}

/// 入参校验辅助：失败时取首条错误消息返回 1006（与 users/auth 保持同一行为）。
fn ensure_valid<T: Validate>(req: &T) -> Result<(), AppError> {
    req.validate().map_err(|e| {
        let msg = e
            .field_errors()
            .values()
            .flat_map(|v| v.iter())
            .filter_map(|err| err.message.as_ref().map(|m| m.to_string()))
            .next()
            .unwrap_or_else(|| "参数校验失败".into());
        AppError::bad_request(msg)
    })
}

/// 统一成功响应体。
fn ok() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "code": 0, "msg": "ok" }))
}

// ---------------------------------------------------------------------------
// 申请
// ---------------------------------------------------------------------------

/// POST /contacts/requests —— 发起好友申请。
///
/// 幂等语义（DDL：每对人一行，重复申请更新本行）：同方向重复申请刷新招呼语、
/// 重置为待处理；同方向待处理期间重复调用不产生新行。
pub async fn apply(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Json(req): Json<ApplyReq>,
) -> ApiResult<Json<serde_json::Value>> {
    ensure_valid(&req)?;
    if req.to_uid == auth.uid {
        return Err(AppError::bad_request("不能添加自己为好友"));
    }
    let greeting = req.greeting.as_deref().map(str::trim).unwrap_or_default();

    // 申请对象必须存在（users.id 为 BIGINT UNSIGNED，u64 解码）
    let target: Option<u64> = sqlx::query_scalar("SELECT id FROM users WHERE id = ? LIMIT 1")
        .bind(req.to_uid)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| {
            tracing::error!("申请目标存在性查询失败: {e}");
            AppError::internal()
        })?;
    if target.is_none() {
        return Err(AppError::not_found("目标用户不存在"));
    }

    // 已是好友（任一方向行存在即互为好友，双向由同意事务成对写入）
    let cnt: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM friendships \
         WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
    )
    .bind(auth.uid)
    .bind(req.to_uid)
    .bind(req.to_uid)
    .bind(auth.uid)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("好友关系查询失败: {e}");
        AppError::internal()
    })?;
    if cnt > 0 {
        return Err(AppError::already_friends());
    }

    // 对方已有待处理申请指向我：提示先处理，避免双方各持一条申请的死锁态
    let reverse: Option<u64> = sqlx::query_scalar(
        "SELECT id FROM friend_requests WHERE requester_id = ? AND addressee_id = ? AND status = 0 LIMIT 1",
    )
    .bind(req.to_uid)
    .bind(auth.uid)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("反向申请查询失败: {e}");
        AppError::internal()
    })?;
    if reverse.is_some() {
        return Err(AppError::request_conflict(
            "对方已向你发送好友申请，请先处理该申请",
        ));
    }

    // UPSERT：uk_friend_request_pair 撞键即更新（刷新招呼语、重置待处理、清 handled_at）
    sqlx::query(
        "INSERT INTO friend_requests (id, requester_id, addressee_id, greeting, status) \
         VALUES (?, ?, ?, ?, 0) AS n \
         ON DUPLICATE KEY UPDATE greeting = n.greeting, status = 0, \
         handled_at = NULL, created_at = CURRENT_TIMESTAMP(3)",
    )
    .bind(im_common::id::next_id())
    .bind(auth.uid)
    .bind(req.to_uid)
    .bind(greeting)
    .execute(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("好友申请写入失败: {e}");
        AppError::internal()
    })?;

    tracing::info!(from = auth.uid, to = req.to_uid, "好友申请已提交");
    Ok(ok())
}

/// GET /contacts/requests —— 收到 / 发出的申请列表（最近 50 条）。
pub async fn list_requests(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Query(q): Query<ListRequestsQuery>,
) -> ApiResult<Json<serde_json::Value>> {
    let direction = q.direction.as_deref().unwrap_or("incoming");
    if direction != "incoming" && direction != "outgoing" {
        return Err(AppError::bad_request(
            "direction 只能为 incoming 或 outgoing",
        ));
    }

    // 对端 = incoming 的申请人 / outgoing 的接收人，JOIN 取对端展示信息
    let rows: Vec<RequestRow> = if direction == "incoming" {
        sqlx::query_as(
            "SELECT fr.id, fr.requester_id AS other_id, fr.greeting, fr.status, fr.created_at, \
             u.username, p.nickname, p.avatar_file_id \
             FROM friend_requests fr \
             JOIN users u ON u.id = fr.requester_id \
             LEFT JOIN user_profiles p ON p.user_id = fr.requester_id \
             WHERE fr.addressee_id = ? ORDER BY fr.created_at DESC LIMIT 50",
        )
        .bind(auth.uid)
        .fetch_all(&state.pool)
        .await
    } else {
        sqlx::query_as(
            "SELECT fr.id, fr.addressee_id AS other_id, fr.greeting, fr.status, fr.created_at, \
             u.username, p.nickname, p.avatar_file_id \
             FROM friend_requests fr \
             JOIN users u ON u.id = fr.addressee_id \
             LEFT JOIN user_profiles p ON p.user_id = fr.addressee_id \
             WHERE fr.requester_id = ? ORDER BY fr.created_at DESC LIMIT 50",
        )
        .bind(auth.uid)
        .fetch_all(&state.pool)
        .await
    }
    .map_err(|e| {
        tracing::error!("申请列表查询失败: {e}");
        AppError::internal()
    })?;

    let requests: Vec<RequestResp> = rows
        .into_iter()
        .map(|r| {
            let username = r.username;
            RequestResp {
                id: r.id.to_string(),
                status: r.status,
                greeting: r.greeting,
                created_at: fmt_time(r.created_at),
                user: BriefUser {
                    id: r.other_id.to_string(),
                    nickname: r.nickname.unwrap_or_else(|| username.clone()),
                    username,
                    avatar_file_id: r.avatar_file_id.map(|v| v.to_string()),
                },
            }
        })
        .collect();

    Ok(Json(serde_json::json!({ "requests": requests })))
}

/// POST /contacts/requests/{id}/accept —— 同意申请（计划书 7.2：同意时插入双向两行）。
///
/// 事务：INSERT IGNORE 双向 friendships（唯一键兜底并发/重复同意）→
/// 申请行置 status=1。已同意的申请重复调用幂等返回 ok。
pub async fn accept(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
) -> ApiResult<Json<serde_json::Value>> {
    // 仅接收人可处理该申请
    let row: Option<(u64, u64, i8)> = sqlx::query_as(
        "SELECT requester_id, addressee_id, status FROM friend_requests WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("申请查询失败: {e}");
        AppError::internal()
    })?;
    let (requester, addressee, status) = row.ok_or_else(|| AppError::not_found("申请不存在"))?;
    if addressee != auth.uid {
        return Err(AppError::forbidden("无权处理该申请"));
    }
    match status {
        1 => return Ok(ok()), // 幂等：关系在首次同意事务中已建立
        2 => return Err(AppError::request_conflict("该申请已被拒绝，无法同意")),
        _ => {}
    }

    let mut tx = state.pool.begin().await.map_err(|e| {
        tracing::error!("同意申请事务开启失败: {e}");
        AppError::internal()
    })?;

    // 双向两行；INSERT IGNORE：极端并发（两条互逆申请各被同意）下唯一键兜底为无操作
    sqlx::query(
        "INSERT IGNORE INTO friendships (id, user_id, friend_id) VALUES (?, ?, ?), (?, ?, ?)",
    )
    .bind(im_common::id::next_id())
    .bind(auth.uid)
    .bind(requester)
    .bind(im_common::id::next_id())
    .bind(requester)
    .bind(auth.uid)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("好友关系写入失败: {e}");
        AppError::internal()
    })?;

    sqlx::query(
        "UPDATE friend_requests SET status = 1, handled_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
    )
    .bind(id)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("申请状态更新失败: {e}");
        AppError::internal()
    })?;
    tx.commit().await.map_err(|e| {
        tracing::error!("同意申请事务提交失败: {e}");
        AppError::internal()
    })?;

    tracing::info!(uid = auth.uid, requester, "已同意好友申请");
    Ok(ok())
}

/// POST /contacts/requests/{id}/reject —— 拒绝申请（幂等：已拒绝重复调用返回 ok）。
pub async fn reject(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
) -> ApiResult<Json<serde_json::Value>> {
    let row: Option<(u64, u64, i8)> = sqlx::query_as(
        "SELECT requester_id, addressee_id, status FROM friend_requests WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("申请查询失败: {e}");
        AppError::internal()
    })?;
    let (_, addressee, status) = row.ok_or_else(|| AppError::not_found("申请不存在"))?;
    if addressee != auth.uid {
        return Err(AppError::forbidden("无权处理该申请"));
    }
    if status == 1 {
        return Err(AppError::request_conflict("你们已是好友，无法拒绝该申请"));
    }
    if status == 0 {
        sqlx::query(
            "UPDATE friend_requests SET status = 2, handled_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
        )
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| {
            tracing::error!("申请状态更新失败: {e}");
            AppError::internal()
        })?;
    }
    Ok(ok())
}

// ---------------------------------------------------------------------------
// 好友关系
// ---------------------------------------------------------------------------

/// GET /contacts/friends —— 好友列表（备注 + 在线快照）。
///
/// 在线快照：批量 MGET `presence:{uid}`（键存在即在线）；Redis 异常时降级为全离线，
/// 不影响列表主数据返回。
pub async fn list_friends(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
) -> ApiResult<Json<serde_json::Value>> {
    let rows: Vec<FriendRow> = sqlx::query_as(
        "SELECT f.friend_id, f.remark, f.created_at, u.username, p.nickname, p.avatar_file_id \
         FROM friendships f \
         JOIN users u ON u.id = f.friend_id \
         LEFT JOIN user_profiles p ON p.user_id = f.friend_id \
         WHERE f.user_id = ? ORDER BY f.created_at DESC",
    )
    .bind(auth.uid)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("好友列表查询失败: {e}");
        AppError::internal()
    })?;

    // 在线快照：MGET 批量查 presence 键；故障降级为全离线（辅助信息不阻塞主流程）
    let mut online_map: HashMap<u64, bool> = HashMap::new();
    if !rows.is_empty() {
        let keys: Vec<String> = rows
            .iter()
            .map(|r| redis_keys::presence(r.friend_id))
            .collect();
        let mut redis = state.redis.clone();
        let vals: Result<Vec<Option<String>>, _> =
            redis::cmd("MGET").arg(&keys).query_async(&mut redis).await;
        match vals {
            Ok(vals) => {
                for (r, v) in rows.iter().zip(vals) {
                    online_map.insert(r.friend_id, v.is_some());
                }
            }
            Err(e) => tracing::warn!("好友在线快照查询失败（降级为离线）: {e}"),
        }
    }

    let friends: Vec<FriendResp> = rows
        .into_iter()
        .map(|r| {
            let username = r.username;
            FriendResp {
                id: r.friend_id.to_string(),
                nickname: r.nickname.unwrap_or_else(|| username.clone()),
                username,
                avatar_file_id: r.avatar_file_id.map(|v| v.to_string()),
                remark: r.remark,
                online: online_map.get(&r.friend_id).copied().unwrap_or(false),
                befriend_at: fmt_time(r.created_at),
            }
        })
        .collect();

    Ok(Json(serde_json::json!({ "friends": friends })))
}

/// PUT /contacts/friends/{id}/remark —— 修改好友备注（仅存于我方 friendships 行，自己可见）。
pub async fn set_remark(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
    Json(req): Json<RemarkReq>,
) -> ApiResult<Json<serde_json::Value>> {
    ensure_valid(&req)?;
    let remark = req.remark.trim().to_string();

    // 先确认是好友（MySQL 默认不开启 CLIENT_FOUND_ROWS，同值 UPDATE 的
    // rows_affected=0 会误判为非好友，故用 SELECT 显式判存）
    let exists: Option<u64> =
        sqlx::query_scalar("SELECT user_id FROM friendships WHERE user_id = ? AND friend_id = ?")
            .bind(auth.uid)
            .bind(id)
            .fetch_optional(&state.pool)
            .await
            .map_err(|e| {
                tracing::error!("好友关系查询失败: {e}");
                AppError::internal()
            })?;
    if exists.is_none() {
        return Err(AppError::not_found("该用户不是你的好友"));
    }

    sqlx::query("UPDATE friendships SET remark = ? WHERE user_id = ? AND friend_id = ?")
        .bind(&remark)
        .bind(auth.uid)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| {
            tracing::error!("备注更新失败: {e}");
            AppError::internal()
        })?;

    Ok(ok())
}

/// DELETE /contacts/friends/{id} —— 删除好友（双向两行同语句物理删除）。
///
/// 仅删除关系行；会话与历史消息保留（计划书：删除后旧单聊会话只读，
/// 服务端消息校验在 W4 消息管线接入 2002）。
pub async fn delete_friend(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
) -> ApiResult<Json<serde_json::Value>> {
    let r = sqlx::query(
        "DELETE FROM friendships \
         WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
    )
    .bind(auth.uid)
    .bind(id)
    .bind(id)
    .bind(auth.uid)
    .execute(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("删除好友失败: {e}");
        AppError::internal()
    })?;
    if r.rows_affected() == 0 {
        return Err(AppError::not_found("该用户不是你的好友"));
    }

    tracing::info!(uid = auth.uid, friend = id, "已删除好友");
    Ok(ok())
}
