//! groups 模块 —— 群聊（计划书 6.5 群消息扇出 / 7.3 群事件一致性 / 技术文档 REST 清单）。
//!
//! - POST /groups：建群（同一事务建 `groups` + `conversations` + 成员行，member_count 事务维护）；
//! - GET /groups/{id}：群资料与成员列表（仅群成员可看）；
//! - PATCH /groups/{id}：改群名/公告（群主/管理员）→ 系统消息(profile) + group.event；
//! - POST /groups/{id}/invite：邀请好友入群（对象必须是本人好友；无需确认直接入群，
//!   join_seq = 当前 last_seq，入群前历史不可见）→ 系统消息(invited) + group.event；
//! - POST /groups/{id}/applications：主动申请入群（每群每人一行，重复申请重置本行）；
//! - GET /groups/applications：待我（群主/管理员）审批的申请（最近 50 条）；
//! - POST /groups/applications/{id}/accept|reject：审批（accept 事务入群 + 系统消息(join)）；
//! - POST /groups/{id}/admins、DELETE /groups/{id}/admins/{uid}：任命/免去管理员（仅群主）；
//! - POST /groups/{id}/transfer：转让群主（旧群主变普通成员）→ 系统消息(transfer) + group.event；
//! - POST /groups/{id}/leave：退群（群主须先转让否则 3004）→ 系统消息(leave) + group.event。
//!
//! 关键规则（计划书 v1.1）：
//! - 群系统消息 msg_type=SYSTEM(4，以 proto 契约为准)，在业务事务内写入并**正常占用 seq**，
//!   client_msg_id 用 `sys-{雪花id}` 满足 uk_msg_conv_client；历史消息中可见；
//! - 退群物理删除 member 行；重新入群 join_seq 刷新为当前 last_seq；
//! - member_count 在建群/入群/退群事务内增减，不做运行时 COUNT(*)；
//! - 群主退群前必须先转让（3004）；管理员踢人/解散群属二期。

use std::sync::Arc;

use axum::extract::{Path, State};
use axum::Json;
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::prelude::FromRow;
use sqlx::MySql;
use validator::Validate;

use crate::message::broadcast_group_event;
use crate::middleware::AuthUser;
use crate::AppState;
use im_common::error::{ApiResult, AppError};
use im_common::id::next_id;

/// groups 路由挂载点（嵌于 /api/v1 下，全部需 Bearer access）。
pub fn router() -> axum::Router<Arc<AppState>> {
    axum::Router::new()
        .route("/groups", axum::routing::post(create_group))
        // 注意：/groups/applications（静态段）与 /groups/{id}（动态段）可共存，静态优先匹配
        .route(
            "/groups/applications",
            axum::routing::get(list_applications),
        )
        .route(
            "/groups/applications/{id}/accept",
            axum::routing::post(accept_application),
        )
        .route(
            "/groups/applications/{id}/reject",
            axum::routing::post(reject_application),
        )
        .route(
            "/groups/{id}",
            axum::routing::get(group_detail).patch(update_group),
        )
        .route("/groups/{id}/invite", axum::routing::post(invite))
        .route("/groups/{id}/applications", axum::routing::post(apply_join))
        .route("/groups/{id}/admins", axum::routing::post(add_admin))
        .route(
            "/groups/{id}/admins/{uid}",
            axum::routing::delete(remove_admin),
        )
        .route("/groups/{id}/transfer", axum::routing::post(transfer_owner))
        .route("/groups/{id}/leave", axum::routing::post(leave_group))
}

// ---------------------------------------------------------------------------
// DTO
// ---------------------------------------------------------------------------

/// POST /groups 请求体。
#[derive(Debug, Deserialize, Validate)]
pub struct CreateGroupReq {
    /// 群名（1-64 字符，DDL VARCHAR(64)）
    #[validate(length(min = 1, max = 64, message = "群名须为 1-64 字符"))]
    pub name: String,
    /// 初始成员（不含本人；必须是本人好友，上限为群容量 - 1）
    /// 元素支持 JSON 数字或数字字符串（雪花 ID 超 JS 安全整数）
    #[serde(default, deserialize_with = "crate::id_serde::de_u64_vec")]
    pub member_ids: Vec<u64>,
}

/// PATCH /groups/{id} 请求体（至少携带一个字段）。
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateGroupReq {
    /// 新群名（可空 = 不修改）
    #[validate(length(min = 1, max = 64, message = "群名须为 1-64 字符"))]
    pub name: Option<String>,
    /// 新公告（可空 = 不修改；0-500 字符，DDL VARCHAR(500)）
    #[validate(length(max = 500, message = "公告最长 500 字符"))]
    pub announcement: Option<String>,
}

/// POST /groups/{id}/invite 请求体。
#[derive(Debug, Deserialize)]
pub struct InviteReq {
    /// 被邀请用户列表（必须是本人好友且非群成员；去重后批量入群）
    /// 元素支持 JSON 数字或数字字符串（雪花 ID 超 JS 安全整数）
    #[serde(deserialize_with = "crate::id_serde::de_u64_vec")]
    pub user_ids: Vec<u64>,
}

/// POST /groups/{id}/applications 请求体。
#[derive(Debug, Deserialize, Validate)]
pub struct ApplyJoinReq {
    /// 申请留言（可空，最长 64 字符）
    #[validate(length(max = 64, message = "申请留言最长 64 字符"))]
    pub message: Option<String>,
}

/// POST /groups/{id}/admins 请求体。
#[derive(Debug, Deserialize)]
pub struct AdminReq {
    /// 目标用户（须为群内普通成员；JSON 数字或数字字符串均可）
    #[serde(deserialize_with = "crate::id_serde::de_u64")]
    pub user_id: u64,
}

/// POST /groups/{id}/transfer 请求体。
#[derive(Debug, Deserialize)]
pub struct TransferReq {
    /// 新群主（须为群内成员；JSON 数字或数字字符串均可）
    #[serde(deserialize_with = "crate::id_serde::de_u64")]
    pub new_owner_id: u64,
}

/// 成员列表项。
#[derive(Debug, Serialize)]
struct MemberResp {
    /// 成员 uid（字符串避免 JS 精度丢失）
    user_id: String,
    /// 登录名
    username: String,
    /// 昵称（profile 缺失回退 username）
    nickname: String,
    /// 头像文件 ID
    avatar_file_id: Option<String>,
    /// 0 普通成员 1 群主 2 管理员
    role: i8,
    /// 加入时间（本地格式化）
    joined_at: String,
}

/// GET /groups/{id} 响应体。
#[derive(Debug, Serialize)]
struct GroupDetailResp {
    /// 群 ID
    id: String,
    /// 群名
    name: String,
    /// 群头像文件 ID
    avatar_file_id: Option<String>,
    /// 群公告
    announcement: String,
    /// 群主 uid
    owner_id: String,
    /// 当前成员数
    member_count: i32,
    /// 成员上限
    max_members: i32,
    /// 成员列表（群主 → 管理员 → 普通成员，同类按加入时间）
    members: Vec<MemberResp>,
}

/// 审批列表行（JOIN 群与申请人；与 SQL 列序一致）。
#[derive(Debug, FromRow)]
struct ApplicationRow {
    /// 申请 ID
    id: u64,
    /// 群 ID
    group_id: u64,
    /// 群名
    group_name: String,
    /// 申请人 uid
    applicant_id: u64,
    /// 申请人登录名
    username: String,
    /// 申请人昵称（profile 缺失 → NULL）
    nickname: Option<String>,
    /// 申请人头像文件 ID
    avatar_file_id: Option<u64>,
    /// 申请留言
    message: String,
    /// 申请时间
    created_at: NaiveDateTime,
}

/// 审批列表项响应。
#[derive(Debug, Serialize)]
struct ApplicationResp {
    /// 申请 ID
    id: String,
    /// 目标群
    group: GroupBrief,
    /// 申请人
    applicant: ApplicantBrief,
    /// 申请留言
    message: String,
    /// 申请时间（本地格式化）
    created_at: String,
}

/// 审批列表中的群摘要。
#[derive(Debug, Serialize)]
struct GroupBrief {
    /// 群 ID
    id: String,
    /// 群名
    name: String,
}

/// 审批列表中的申请人摘要。
#[derive(Debug, Serialize)]
struct ApplicantBrief {
    /// uid
    id: String,
    /// 登录名
    username: String,
    /// 昵称（缺失回退 username）
    nickname: String,
    /// 头像文件 ID
    avatar_file_id: Option<String>,
}

/// `NaiveDateTime` → "YYYY-MM-DD HH:MM:SS"。
fn fmt_time(t: NaiveDateTime) -> String {
    t.format("%Y-%m-%d %H:%M:%S").to_string()
}

// ---------------------------------------------------------------------------
// 内部辅助（行锁 / 角色 / 成员 / 系统消息）
// ---------------------------------------------------------------------------

/// 事务内锁定的群关键状态（`groups` 与 `conversations` 行均 FOR UPDATE）。
struct GroupLock {
    /// 对应会话 ID
    conv_id: u64,
    /// 当前成员数
    member_count: i32,
    /// 成员上限
    max_members: i32,
    /// 会话当前 seq（入群基线 / 系统消息定序都基于它）
    last_seq: i64,
}

/// 群成员列表行：(uid, username, nickname, avatar_file_id, role, joined_at)。
type MemberRow = (u64, String, Option<String>, Option<u64>, i8, NaiveDateTime);

/// 事务内锁定群与会话行并读取关键水位（计划书 7.3：水位与计数一律事务内维护）。
async fn lock_group(
    tx: &mut sqlx::Transaction<'static, MySql>,
    group_id: u64,
) -> ApiResult<GroupLock> {
    let row: Option<(u64, i32, i32, i64)> = sqlx::query_as(
        "SELECT g.conv_id, g.member_count, g.max_members, c.last_seq \
         FROM `groups` g JOIN conversations c ON c.id = g.conv_id \
         WHERE g.id = ? FOR UPDATE",
    )
    .bind(group_id)
    .fetch_optional(&mut **tx)
    .await
    .map_err(db_err("群行锁定"))?;
    let (conv_id, member_count, max_members, last_seq) =
        row.ok_or_else(|| AppError::not_found("群不存在"))?;
    Ok(GroupLock {
        conv_id,
        member_count,
        max_members,
        last_seq,
    })
}

/// 我的成员角色（0 普通 1 群主 2 管理员；非成员返回 None）。
/// `e` 可传连接池或事务，供校验（池）与变更（事务）两个阶段复用。
async fn my_role<'e, E>(e: E, group_id: u64, uid: u64) -> ApiResult<Option<i8>>
where
    E: sqlx::Executor<'e, Database = MySql>,
{
    sqlx::query_scalar(
        "SELECT cm.role FROM conversation_members cm \
         JOIN `groups` g ON g.conv_id = cm.conv_id \
         WHERE g.id = ? AND cm.user_id = ?",
    )
    .bind(group_id)
    .bind(uid)
    .fetch_optional(e)
    .await
    .map_err(db_err("群角色查询"))
}

/// 群全部成员 uid（广播 group.event 用）。
async fn member_uids<'e, E>(e: E, group_id: u64) -> ApiResult<Vec<u64>>
where
    E: sqlx::Executor<'e, Database = MySql>,
{
    sqlx::query_scalar(
        "SELECT cm.user_id FROM conversation_members cm \
         JOIN `groups` g ON g.conv_id = cm.conv_id WHERE g.id = ?",
    )
    .bind(group_id)
    .fetch_all(e)
    .await
    .map_err(db_err("群成员查询"))
}

/// 在业务事务内写入群系统消息并占用 seq（计划书 6.5 第 6 条）。
///
/// - `msg_type = SYSTEM(4)`（以 proto 契约为准；DDL 注释滞后以代码为准）；
/// - `client_msg_id = "sys-{雪花id}"`，天然满足 uk_msg_conv_client；
/// - 定序与其他消息一致：锁 conversations 行 → last_seq+1 → INSERT → 回写水位；
/// - 返回写入的 seq。
async fn write_system_msg_tx(
    tx: &mut sqlx::Transaction<'static, MySql>,
    conv_id: u64,
    operator: u64,
    content: &serde_json::Value,
) -> ApiResult<i64> {
    let last_seq: i64 =
        sqlx::query_scalar("SELECT last_seq FROM conversations WHERE id = ? FOR UPDATE")
            .bind(conv_id)
            .fetch_one(&mut **tx)
            .await
            .map_err(db_err("系统消息定序"))?;
    let seq = last_seq + 1;
    let msg_id = next_id();
    sqlx::query(
        "INSERT INTO messages (id, conv_id, sender_id, msg_type, content, seq, client_msg_id) \
         VALUES (?, ?, ?, 4, ?, ?, ?)",
    )
    .bind(msg_id)
    .bind(conv_id)
    .bind(operator)
    .bind(content.to_string())
    .bind(seq)
    .bind(format!("sys-{msg_id}"))
    .execute(&mut **tx)
    .await
    .map_err(db_err("系统消息写入"))?;
    sqlx::query("UPDATE conversations SET last_seq = ?, last_msg_id = ? WHERE id = ?")
        .bind(seq)
        .bind(msg_id)
        .bind(conv_id)
        .execute(&mut **tx)
        .await
        .map_err(db_err("系统消息水位回写"))?;
    Ok(seq)
}

/// 事务提交后向全员广播 group.event（离线成员由重连拉群资料与历史系统消息兜底）。
async fn broadcast(state: &AppState, group_id: u64, event_type: &str, data: &serde_json::Value) {
    let Ok(members) = member_uids(&state.pool, group_id).await else {
        return;
    };
    broadcast_group_event(state, &members, group_id, event_type, &data.to_string()).await;
}

/// 数据库错误归一（与 message.rs db_err 同语义）。
fn db_err(ctx: &'static str) -> impl Fn(sqlx::Error) -> AppError {
    move |e| {
        tracing::error!("{ctx}失败: {e}");
        AppError::internal()
    }
}

// ---------------------------------------------------------------------------
// POST /groups —— 建群
// ---------------------------------------------------------------------------

/// 建群：同一事务建 `conversations(type=2)` + `groups` + 成员行（计划书 7.3）。
///
/// 初始成员必须是本人好友（与邀请同规则）；群容量 1 + n ≤ max_members。
async fn create_group(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Json(req): Json<CreateGroupReq>,
) -> ApiResult<Json<serde_json::Value>> {
    req.validate()
        .map_err(|e| AppError::bad_request(first_msg(&e)))?;
    let name = req.name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::bad_request("群名不能为空"));
    }
    // 去重并排除本人
    let mut members: Vec<u64> = req
        .member_ids
        .iter()
        .copied()
        .filter(|u| *u != auth.uid)
        .collect();
    members.sort_unstable();
    members.dedup();
    // 容量：先按行数粗判，再在事务内按 groups.max_members 复核
    if members.len() as i64 + 1 > 200 {
        return Err(AppError::group_full());
    }

    // 初始成员必须全是我的好友（与"邀请对象必须是本人好友"同规则）
    if !members.is_empty() {
        let placeholders = vec!["?"; members.len()].join(", ");
        let sql = format!(
            "SELECT COUNT(*) FROM friendships WHERE user_id = ? AND friend_id IN ({placeholders})"
        );
        let mut q = sqlx::query_scalar::<_, i64>(&sql).bind(auth.uid);
        for u in &members {
            q = q.bind(u);
        }
        let cnt = q
            .fetch_one(&state.pool)
            .await
            .map_err(db_err("好友批量校验"))?;
        if cnt != members.len() as i64 {
            return Err(AppError::bad_request("初始成员必须是你的好友"));
        }
    }

    let group_id = next_id();
    let conv_id = next_id();
    let mut tx = state.pool.begin().await.map_err(db_err("建群事务开启"))?;
    sqlx::query("INSERT INTO conversations (id, type, group_id) VALUES (?, 2, ?)")
        .bind(conv_id)
        .bind(group_id)
        .execute(&mut *tx)
        .await
        .map_err(db_err("群会话创建"))?;
    // max_members 取 DDL 默认 200（一期不开放自定义）
    sqlx::query(
        "INSERT INTO `groups` (id, conv_id, name, owner_id, member_count) \
         VALUES (?, ?, ?, ?, ?)",
    )
    .bind(group_id)
    .bind(conv_id)
    .bind(&name)
    .bind(auth.uid)
    .bind(members.len() as i32 + 1)
    .execute(&mut *tx)
    .await
    .map_err(db_err("群创建"))?;
    // 群主行 + 成员行（建群成员 join_seq=0，可见全部群内历史）
    sqlx::query("INSERT INTO conversation_members (conv_id, user_id, role) VALUES (?, ?, 1)")
        .bind(conv_id)
        .bind(auth.uid)
        .execute(&mut *tx)
        .await
        .map_err(db_err("群主成员行写入"))?;
    for u in &members {
        sqlx::query(
            "INSERT IGNORE INTO conversation_members (conv_id, user_id, role) VALUES (?, ?, 0)",
        )
        .bind(conv_id)
        .bind(u)
        .execute(&mut *tx)
        .await
        .map_err(db_err("成员行写入"))?;
    }
    tx.commit().await.map_err(db_err("建群事务提交"))?;

    tracing::info!(
        uid = auth.uid,
        group_id,
        conv_id,
        members = members.len(),
        "群已创建"
    );
    Ok(Json(json!({
        "group_id": group_id.to_string(),
        "conv_id": conv_id.to_string(),
        "name": name,
        "member_count": members.len() as i32 + 1,
    })))
}

// ---------------------------------------------------------------------------
// GET /groups/{id} —— 群资料与成员
// ---------------------------------------------------------------------------

/// 群详情 + 成员列表（仅群成员可查看，非成员 3004）。
async fn group_detail(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
) -> ApiResult<Json<serde_json::Value>> {
    if my_role(&state.pool, id, auth.uid).await?.is_none() {
        return Err(AppError::forbidden("仅群成员可查看群资料"));
    }
    let g: Option<(String, Option<u64>, String, u64, i32, i32)> = sqlx::query_as(
        "SELECT name, avatar_file_id, announcement, owner_id, member_count, max_members \
         FROM `groups` WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await
    .map_err(db_err("群资料查询"))?;
    let Some((name, avatar, announcement, owner_id, member_count, max_members)) = g else {
        return Err(AppError::not_found("群不存在"));
    };

    // 成员列表：群主(1) → 管理员(2) → 普通成员(0)，同类按加入时间
    let members: Vec<MemberRow> = sqlx::query_as(
        "SELECT cm.user_id, u.username, p.nickname, p.avatar_file_id, cm.role, cm.joined_at \
         FROM conversation_members cm \
         JOIN users u ON u.id = cm.user_id \
         LEFT JOIN user_profiles p ON p.user_id = cm.user_id \
         WHERE cm.conv_id = (SELECT conv_id FROM `groups` WHERE id = ?) \
         ORDER BY FIELD(cm.role, 1, 2, 0), cm.joined_at",
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await
    .map_err(db_err("群成员列表查询"))?;

    let members = members
        .into_iter()
        .map(
            |(uid, username, nickname, avatar, role, joined_at)| MemberResp {
                user_id: uid.to_string(),
                nickname: nickname.unwrap_or_else(|| username.clone()),
                username,
                avatar_file_id: avatar.map(|v| v.to_string()),
                role,
                joined_at: fmt_time(joined_at),
            },
        )
        .collect();

    Ok(Json(
        serde_json::to_value(GroupDetailResp {
            id: id.to_string(),
            name,
            avatar_file_id: avatar.map(|v| v.to_string()),
            announcement,
            owner_id: owner_id.to_string(),
            member_count,
            max_members,
            members,
        })
        .expect("群详情序列化"),
    ))
}

// ---------------------------------------------------------------------------
// PATCH /groups/{id} —— 修改群名/公告（群主/管理员）
// ---------------------------------------------------------------------------

/// 修改群资料：仅群主/管理员；写系统消息(profile) 占 seq 并广播 group.event。
async fn update_group(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
    Json(req): Json<UpdateGroupReq>,
) -> ApiResult<Json<serde_json::Value>> {
    req.validate()
        .map_err(|e| AppError::bad_request(first_msg(&e)))?;
    let role = my_role(&state.pool, id, auth.uid)
        .await?
        .ok_or_else(|| AppError::forbidden("仅群成员可操作该群"))?;
    if role != 1 && role != 2 {
        return Err(AppError::forbidden("仅群主或管理员可修改群资料"));
    }
    let name = req.name.as_deref().map(str::trim).filter(|s| !s.is_empty());
    if name.is_none() && req.announcement.is_none() {
        return Err(AppError::bad_request("至少携带 name 或 announcement 之一"));
    }

    let mut tx = state.pool.begin().await.map_err(db_err("改资料事务开启"))?;
    let lock = lock_group(&mut tx, id).await?;
    let mut data = json!({"event": "profile", "operator": auth.uid});
    if let Some(n) = name {
        sqlx::query("UPDATE `groups` SET name = ? WHERE id = ?")
            .bind(n)
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(db_err("群名更新"))?;
        data["name"] = json!(n);
    }
    if let Some(a) = &req.announcement {
        sqlx::query("UPDATE `groups` SET announcement = ? WHERE id = ?")
            .bind(a)
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(db_err("公告更新"))?;
        data["announcement"] = json!(a);
    }
    write_system_msg_tx(&mut tx, lock.conv_id, auth.uid, &data).await?;
    tx.commit().await.map_err(db_err("改资料事务提交"))?;

    broadcast(&state, id, "profile", &data).await;
    tracing::info!(uid = auth.uid, group_id = id, "群资料已更新");
    Ok(Json(json!({})))
}

// ---------------------------------------------------------------------------
// POST /groups/{id}/invite —— 邀请好友入群
// ---------------------------------------------------------------------------

/// 邀请入群：对象必须是本人好友；直接入群无需确认；join_seq = 当前 last_seq；
/// group_applications 写 inviter_id 留痕（每群每人一行，复用重置）；系统消息(invited)。
async fn invite(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
    Json(req): Json<InviteReq>,
) -> ApiResult<Json<serde_json::Value>> {
    if my_role(&state.pool, id, auth.uid).await?.is_none() {
        return Err(AppError::forbidden("仅群成员可邀请好友入群"));
    }
    let mut targets: Vec<u64> = req
        .user_ids
        .iter()
        .copied()
        .filter(|u| *u != auth.uid)
        .collect();
    targets.sort_unstable();
    targets.dedup();
    if targets.is_empty() {
        return Err(AppError::bad_request("user_ids 不能为空"));
    }
    // 被邀请者必须是本人好友（计划书 6.5 第 7 条）
    let placeholders = vec!["?"; targets.len()].join(", ");
    let sql = format!(
        "SELECT COUNT(*) FROM friendships WHERE user_id = ? AND friend_id IN ({placeholders})"
    );
    let mut q = sqlx::query_scalar::<_, i64>(&sql).bind(auth.uid);
    for u in &targets {
        q = q.bind(u);
    }
    let cnt = q
        .fetch_one(&state.pool)
        .await
        .map_err(db_err("好友批量校验"))?;
    if cnt != targets.len() as i64 {
        return Err(AppError::bad_request("只能邀请你的好友入群"));
    }

    let mut tx = state.pool.begin().await.map_err(db_err("邀请事务开启"))?;
    let lock = lock_group(&mut tx, id).await?;
    // 容量复核（以事务内锁定值为准）
    if lock.member_count + targets.len() as i32 > lock.max_members {
        return Err(AppError::group_full());
    }

    for u in &targets {
        // 已是成员 → 3005（先在事务内校验，防并发入群窗口）
        let already: Option<u64> = sqlx::query_scalar(
            "SELECT user_id FROM conversation_members WHERE conv_id = ? AND user_id = ?",
        )
        .bind(lock.conv_id)
        .bind(u)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db_err("成员存在性校验"))?;
        if already.is_some() {
            return Err(AppError::already_member());
        }
        // 申请行留痕：每群每人一行，复用重置（计划书 7.3）
        sqlx::query(
            "INSERT INTO group_applications \
             (id, group_id, applicant_id, inviter_id, message, status, handled_by, handled_at, created_at) \
             VALUES (?, ?, ?, ?, '', 1, ?, NOW(3), NOW(3)) \
             ON DUPLICATE KEY UPDATE inviter_id = VALUES(inviter_id), status = 1, \
             handled_by = VALUES(handled_by), handled_at = VALUES(handled_at), created_at = VALUES(created_at)",
        )
        .bind(next_id())
        .bind(id)
        .bind(u)
        .bind(auth.uid)
        .bind(auth.uid)
        .execute(&mut *tx)
        .await
        .map_err(db_err("邀请留痕写入"))?;
        // 直接入群：join_seq = 当前 last_seq（入群前历史不可见）
        sqlx::query(
            "INSERT IGNORE INTO conversation_members (conv_id, user_id, role, join_seq) \
             VALUES (?, ?, 0, ?)",
        )
        .bind(lock.conv_id)
        .bind(u)
        .bind(lock.last_seq)
        .execute(&mut *tx)
        .await
        .map_err(db_err("成员写入"))?;
    }

    // 实际新增行数（INSERT IGNORE 撞键会被吞）维护 member_count
    let actual: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM conversation_members WHERE conv_id = ?")
            .bind(lock.conv_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(db_err("成员计数"))?;
    let added = actual - lock.member_count as i64;
    if added > 0 {
        sqlx::query("UPDATE `groups` SET member_count = ? WHERE id = ?")
            .bind(actual as i32)
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(db_err("成员数维护"))?;
    }

    let data = json!({
        "event": "invited",
        "operator": auth.uid,
        "targets": targets,
    });
    write_system_msg_tx(&mut tx, lock.conv_id, auth.uid, &data).await?;
    tx.commit().await.map_err(db_err("邀请事务提交"))?;

    broadcast(&state, id, "invited", &data).await;
    tracing::info!(uid = auth.uid, group_id = id, added, "邀请入群完成");
    Ok(Json(json!({"added": added})))
}

// ---------------------------------------------------------------------------
// POST /groups/{id}/applications —— 主动申请入群
// ---------------------------------------------------------------------------

/// 主动申请：每群每人一行；有待处理申请 → 3002；其余状态复用重置本行。
async fn apply_join(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
    Json(req): Json<ApplyJoinReq>,
) -> ApiResult<Json<serde_json::Value>> {
    req.validate()
        .map_err(|e| AppError::bad_request(first_msg(&e)))?;
    let message = req.message.unwrap_or_default();

    let g: Option<(u64, i32, i32)> =
        sqlx::query_as("SELECT conv_id, member_count, max_members FROM `groups` WHERE id = ?")
            .bind(id)
            .fetch_optional(&state.pool)
            .await
            .map_err(db_err("群查询"))?;
    let Some((conv_id, member_count, max_members)) = g else {
        return Err(AppError::not_found("群不存在"));
    };
    if my_role(&state.pool, id, auth.uid).await?.is_some() {
        return Err(AppError::already_member());
    }
    if member_count >= max_members {
        return Err(AppError::group_full());
    }

    // 每群每人一行：有待处理 → 3002；被拒/被忽略/历史同意 → 复用重置
    let exist: Option<i8> = sqlx::query_scalar(
        "SELECT status FROM group_applications WHERE group_id = ? AND applicant_id = ?",
    )
    .bind(id)
    .bind(auth.uid)
    .fetch_optional(&state.pool)
    .await
    .map_err(db_err("申请行查询"))?;
    let app_id = next_id();
    match exist {
        Some(0) => return Err(AppError::request_conflict("你已有待处理的入群申请")),
        Some(_) => {
            sqlx::query(
                "UPDATE group_applications SET inviter_id = NULL, message = ?, status = 0, \
                 handled_by = NULL, handled_at = NULL, created_at = NOW(3) \
                 WHERE group_id = ? AND applicant_id = ?",
            )
            .bind(&message)
            .bind(id)
            .bind(auth.uid)
            .execute(&state.pool)
            .await
            .map_err(db_err("申请行重置"))?;
            // 复用行：取回原行 id 作响应
            let old: u64 = sqlx::query_scalar(
                "SELECT id FROM group_applications WHERE group_id = ? AND applicant_id = ?",
            )
            .bind(id)
            .bind(auth.uid)
            .fetch_one(&state.pool)
            .await
            .map_err(db_err("申请行回查"))?;
            return Ok(Json(
                json!({"application_id": old.to_string(), "conv_id": conv_id.to_string()}),
            ));
        }
        None => {
            sqlx::query(
                "INSERT INTO group_applications (id, group_id, applicant_id, message, status) \
                 VALUES (?, ?, ?, ?, 0)",
            )
            .bind(app_id)
            .bind(id)
            .bind(auth.uid)
            .bind(&message)
            .execute(&state.pool)
            .await
            .map_err(db_err("申请写入"))?;
        }
    }
    Ok(Json(json!({"application_id": app_id.to_string()})))
}

// ---------------------------------------------------------------------------
// GET /groups/applications —— 待我审批
// ---------------------------------------------------------------------------

/// 待我审批的申请：我是该群群主/管理员（role 1/2）且 status=0，最近 50 条。
async fn list_applications(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
) -> ApiResult<Json<serde_json::Value>> {
    let rows: Vec<ApplicationRow> = sqlx::query_as(
        "SELECT ga.id, ga.group_id, g.name AS group_name, ga.applicant_id, \
         u.username, p.nickname, p.avatar_file_id, ga.message, ga.created_at \
         FROM group_applications ga \
         JOIN `groups` g ON g.id = ga.group_id \
         JOIN conversation_members cm ON cm.conv_id = g.conv_id \
           AND cm.user_id = ? AND cm.role IN (1, 2) \
         JOIN users u ON u.id = ga.applicant_id \
         LEFT JOIN user_profiles p ON p.user_id = ga.applicant_id \
         WHERE ga.status = 0 \
         ORDER BY ga.created_at DESC LIMIT 50",
    )
    .bind(auth.uid)
    .fetch_all(&state.pool)
    .await
    .map_err(db_err("审批列表查询"))?;

    let applications: Vec<ApplicationResp> = rows
        .into_iter()
        .map(|r| ApplicationResp {
            id: r.id.to_string(),
            group: GroupBrief {
                id: r.group_id.to_string(),
                name: r.group_name,
            },
            applicant: ApplicantBrief {
                id: r.applicant_id.to_string(),
                nickname: r.nickname.unwrap_or_else(|| r.username.clone()),
                username: r.username,
                avatar_file_id: r.avatar_file_id.map(|v| v.to_string()),
            },
            message: r.message,
            created_at: fmt_time(r.created_at),
        })
        .collect();
    Ok(Json(json!({ "applications": applications })))
}

// ---------------------------------------------------------------------------
// POST /groups/applications/{id}/accept | reject —— 审批
// ---------------------------------------------------------------------------

/// 申请行 + 群上下文（审批前置校验共用）。
struct AppCtx {
    group_id: u64,
    applicant_id: u64,
    status: i8,
}

/// 加载申请行并校验审批权（群主/管理员）与状态。
async fn load_app_for_review(state: &AppState, auth: AuthUser, app_id: u64) -> ApiResult<AppCtx> {
    let row: Option<(u64, u64, i8)> = sqlx::query_as(
        "SELECT group_id, applicant_id, status FROM group_applications WHERE id = ?",
    )
    .bind(app_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(db_err("申请行查询"))?;
    let Some((group_id, applicant_id, status)) = row else {
        return Err(AppError::not_found("申请不存在"));
    };
    match my_role(&state.pool, group_id, auth.uid).await? {
        Some(1) | Some(2) => {}
        _ => return Err(AppError::forbidden("仅群主或管理员可审批入群申请")),
    }
    Ok(AppCtx {
        group_id,
        applicant_id,
        status,
    })
}

/// 同意申请：事务内写入成员行（join_seq = 当前 last_seq）+ 维护计数 + 系统消息(join)。
async fn accept_application(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
) -> ApiResult<Json<serde_json::Value>> {
    let ctx = load_app_for_review(&state, auth, id).await?;
    if ctx.status == 1 {
        // 幂等：已同意过的申请重复同意直接成功
        return Ok(Json(json!({})));
    }
    if ctx.status != 0 {
        return Err(AppError::request_conflict("申请已被处理"));
    }

    let mut tx = state.pool.begin().await.map_err(db_err("审批事务开启"))?;
    let lock = lock_group(&mut tx, ctx.group_id).await?;
    if lock.member_count >= lock.max_members {
        return Err(AppError::group_full());
    }
    // 申请人可能在等待期间被邀请入群
    let already: Option<u64> = sqlx::query_scalar(
        "SELECT user_id FROM conversation_members WHERE conv_id = ? AND user_id = ?",
    )
    .bind(lock.conv_id)
    .bind(ctx.applicant_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(db_err("成员存在性校验"))?;
    if already.is_some() {
        // 申请已无意义：置为已同意并幂等返回
        sqlx::query(
            "UPDATE group_applications SET status = 1, handled_by = ?, handled_at = NOW(3) \
             WHERE id = ?",
        )
        .bind(auth.uid)
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(db_err("申请状态更新"))?;
        tx.commit().await.map_err(db_err("审批事务提交"))?;
        return Ok(Json(json!({})));
    }

    sqlx::query(
        "UPDATE group_applications SET status = 1, handled_by = ?, handled_at = NOW(3) WHERE id = ?",
    )
    .bind(auth.uid)
    .bind(id)
    .execute(&mut *tx)
    .await
    .map_err(db_err("申请状态更新"))?;
    sqlx::query(
        "INSERT IGNORE INTO conversation_members (conv_id, user_id, role, join_seq) \
         VALUES (?, ?, 0, ?)",
    )
    .bind(lock.conv_id)
    .bind(ctx.applicant_id)
    .bind(lock.last_seq)
    .execute(&mut *tx)
    .await
    .map_err(db_err("成员写入"))?;
    sqlx::query("UPDATE `groups` SET member_count = member_count + 1 WHERE id = ?")
        .bind(ctx.group_id)
        .execute(&mut *tx)
        .await
        .map_err(db_err("成员数维护"))?;

    let data = json!({
        "event": "join",
        "operator": ctx.applicant_id,
        "targets": [ctx.applicant_id],
    });
    write_system_msg_tx(&mut tx, lock.conv_id, ctx.applicant_id, &data).await?;
    tx.commit().await.map_err(db_err("审批事务提交"))?;

    broadcast(&state, ctx.group_id, "join", &data).await;
    tracing::info!(
        group_id = ctx.group_id,
        applicant = ctx.applicant_id,
        "入群申请已同意"
    );
    Ok(Json(json!({})))
}

/// 拒绝申请：幂等（重复拒绝成功）；不写系统消息、不动成员。
async fn reject_application(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
) -> ApiResult<Json<serde_json::Value>> {
    let ctx = load_app_for_review(&state, auth, id).await?;
    if ctx.status == 2 {
        return Ok(Json(json!({}))); // 幂等
    }
    if ctx.status != 0 {
        return Err(AppError::request_conflict("申请已被处理"));
    }
    sqlx::query(
        "UPDATE group_applications SET status = 2, handled_by = ?, handled_at = NOW(3) WHERE id = ?",
    )
    .bind(auth.uid)
    .bind(id)
    .execute(&state.pool)
    .await
    .map_err(db_err("申请状态更新"))?;
    tracing::info!(
        group_id = ctx.group_id,
        applicant = ctx.applicant_id,
        "入群申请已拒绝"
    );
    Ok(Json(json!({})))
}

// ---------------------------------------------------------------------------
// POST /groups/{id}/admins、DELETE /groups/{id}/admins/{uid} —— 管理员任免
// ---------------------------------------------------------------------------

/// 任命管理员（仅群主；目标须为群内普通成员；重复任命幂等）。
async fn add_admin(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
    Json(req): Json<AdminReq>,
) -> ApiResult<Json<serde_json::Value>> {
    if my_role(&state.pool, id, auth.uid).await? != Some(1) {
        return Err(AppError::forbidden("仅群主可任命管理员"));
    }
    if req.user_id == auth.uid {
        return Err(AppError::bad_request("不能对群主本人设置管理员"));
    }
    let conv_id: Option<u64> = sqlx::query_scalar("SELECT conv_id FROM `groups` WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(db_err("群查询"))?;
    let Some(conv_id) = conv_id else {
        return Err(AppError::not_found("群不存在"));
    };
    let role: Option<i8> = sqlx::query_scalar(
        "SELECT role FROM conversation_members WHERE conv_id = ? AND user_id = ?",
    )
    .bind(conv_id)
    .bind(req.user_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(db_err("成员角色查询"))?;
    match role {
        None => return Err(AppError::bad_request("对方不是该群成员")),
        Some(2) => return Ok(Json(json!({}))), // 已是管理员，幂等
        _ => {}
    }
    sqlx::query("UPDATE conversation_members SET role = 2 WHERE conv_id = ? AND user_id = ?")
        .bind(conv_id)
        .bind(req.user_id)
        .execute(&state.pool)
        .await
        .map_err(db_err("任命管理员"))?;
    tracing::info!(group_id = id, target = req.user_id, "已任命管理员");
    Ok(Json(json!({})))
}

/// 免去管理员（仅群主；目标须为管理员；重复免去幂等）。
async fn remove_admin(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path((id, uid)): Path<(u64, u64)>,
) -> ApiResult<Json<serde_json::Value>> {
    if my_role(&state.pool, id, auth.uid).await? != Some(1) {
        return Err(AppError::forbidden("仅群主可免去管理员"));
    }
    if uid == auth.uid {
        return Err(AppError::bad_request("不能对群主本人操作"));
    }
    let conv_id: Option<u64> = sqlx::query_scalar("SELECT conv_id FROM `groups` WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(db_err("群查询"))?;
    let Some(conv_id) = conv_id else {
        return Err(AppError::not_found("群不存在"));
    };
    // 仅当目标是管理员(2)时更新；其余（普通成员/不存在）幂等成功
    sqlx::query(
        "UPDATE conversation_members SET role = 0 WHERE conv_id = ? AND user_id = ? AND role = 2",
    )
    .bind(conv_id)
    .bind(uid)
    .execute(&state.pool)
    .await
    .map_err(db_err("免去管理员"))?;
    tracing::info!(group_id = id, target = uid, "已免去管理员");
    Ok(Json(json!({})))
}

// ---------------------------------------------------------------------------
// POST /groups/{id}/transfer —— 转让群主
// ---------------------------------------------------------------------------

/// 转让群主（仅群主）：新群主须为群成员；旧群主变普通成员；系统消息(transfer)。
async fn transfer_owner(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
    Json(req): Json<TransferReq>,
) -> ApiResult<Json<serde_json::Value>> {
    if my_role(&state.pool, id, auth.uid).await? != Some(1) {
        return Err(AppError::forbidden("仅群主可转让群主"));
    }
    if req.new_owner_id == auth.uid {
        return Err(AppError::bad_request("不能转让给自己"));
    }

    let mut tx = state.pool.begin().await.map_err(db_err("转让事务开启"))?;
    let lock = lock_group(&mut tx, id).await?;
    let role: Option<i8> = sqlx::query_scalar(
        "SELECT role FROM conversation_members WHERE conv_id = ? AND user_id = ?",
    )
    .bind(lock.conv_id)
    .bind(req.new_owner_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(db_err("成员角色查询"))?;
    if role.is_none() {
        return Err(AppError::bad_request("新群主必须是该群成员"));
    }

    sqlx::query("UPDATE `groups` SET owner_id = ? WHERE id = ?")
        .bind(req.new_owner_id)
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(db_err("群主更新"))?;
    sqlx::query("UPDATE conversation_members SET role = 0 WHERE conv_id = ? AND user_id = ?")
        .bind(lock.conv_id)
        .bind(auth.uid)
        .execute(&mut *tx)
        .await
        .map_err(db_err("旧群主降级"))?;
    sqlx::query("UPDATE conversation_members SET role = 1 WHERE conv_id = ? AND user_id = ?")
        .bind(lock.conv_id)
        .bind(req.new_owner_id)
        .execute(&mut *tx)
        .await
        .map_err(db_err("新群主升级"))?;

    let data = json!({
        "event": "transfer",
        "operator": auth.uid,
        "targets": [req.new_owner_id],
    });
    write_system_msg_tx(&mut tx, lock.conv_id, auth.uid, &data).await?;
    tx.commit().await.map_err(db_err("转让事务提交"))?;

    broadcast(&state, id, "transfer", &data).await;
    tracing::info!(
        group_id = id,
        from = auth.uid,
        to = req.new_owner_id,
        "群主已转让"
    );
    Ok(Json(json!({})))
}

// ---------------------------------------------------------------------------
// POST /groups/{id}/leave —— 退群
// ---------------------------------------------------------------------------

/// 退群：物理删除 member 行 + member_count-1 + 系统消息(leave)；
/// 群主须先转让（3004）；广播给退群后的剩余成员。
async fn leave_group(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Path(id): Path<u64>,
) -> ApiResult<Json<serde_json::Value>> {
    let role = my_role(&state.pool, id, auth.uid)
        .await?
        .ok_or_else(|| AppError::forbidden("你不是该群成员"))?;
    if role == 1 {
        return Err(AppError::forbidden("群主须先转让群主后才能退群"));
    }

    let mut tx = state.pool.begin().await.map_err(db_err("退群事务开启"))?;
    let lock = lock_group(&mut tx, id).await?;
    sqlx::query("DELETE FROM conversation_members WHERE conv_id = ? AND user_id = ?")
        .bind(lock.conv_id)
        .bind(auth.uid)
        .execute(&mut *tx)
        .await
        .map_err(db_err("成员行删除"))?;
    sqlx::query("UPDATE `groups` SET member_count = member_count - 1 WHERE id = ?")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(db_err("成员数维护"))?;

    let data = json!({
        "event": "leave",
        "operator": auth.uid,
        "targets": [auth.uid],
    });
    write_system_msg_tx(&mut tx, lock.conv_id, auth.uid, &data).await?;
    tx.commit().await.map_err(db_err("退群事务提交"))?;

    broadcast(&state, id, "leave", &data).await;
    tracing::info!(uid = auth.uid, group_id = id, "已退群");
    Ok(Json(json!({})))
}

// ---------------------------------------------------------------------------
// 小工具
// ---------------------------------------------------------------------------

/// 取 validator 错误的第一条消息。
fn first_msg(e: &validator::ValidationErrors) -> String {
    e.field_errors()
        .values()
        .next()
        .and_then(|v| v.first())
        .and_then(|err| err.message.as_ref().map(|m| m.to_string()))
        .unwrap_or_else(|| "参数校验失败".into())
}
