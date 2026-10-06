//! users 模块 —— 用户资料（技术文档 5.1 第 3 条 / REST 清单 5.2）。
//!
//! - GET /users/me：当前用户 + 资料；
//! - PATCH /users/me：改昵称/头像/签名/性别（只更新提供的字段）；
//! - GET /users/search?q=&cursor=：按用户名前缀/昵称包含/邮箱精确搜索（脱敏：不返回邮箱）；
//! - GET /users/{id}：用户公开资料。

use std::sync::Arc;

use axum::extract::{Path, State};
use axum::Json;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use validator::Validate;

use crate::middleware::AuthUser;
use crate::AppState;
use im_common::error::{ApiResult, AppError};

/// 用户 + 资料 JOIN 行（与 SQL 列序一致）。
#[derive(Debug, FromRow)]
struct UserWithProfileRow {
    /// 用户 ID
    id: u64,
    /// 登录名
    username: String,
    /// 邮箱（仅 /users/me 返回本人）
    email: String,
    /// 昵称（LEFT JOIN 可能缺失 → NULL）
    nickname: Option<String>,
    /// 头像文件 ID（NULL = 默认头像）
    avatar_file_id: Option<u64>,
    /// 性别：0 未知 1 男 2 女（TINYINT）
    gender: Option<i8>,
    /// 个性签名
    signature: Option<String>,
}

/// 当前用户响应（本人视角，含邮箱）。
#[derive(Debug, Serialize)]
pub struct MeResp {
    /// 用户 ID（字符串避免 JS 精度丢失）
    pub id: String,
    /// 登录名
    pub username: String,
    /// 邮箱
    pub email: String,
    /// 昵称
    pub nickname: String,
    /// 头像文件 ID（null = 默认头像）
    pub avatar_file_id: Option<String>,
    /// 性别：0 未知 1 男 2 女
    pub gender: i16,
    /// 个性签名
    pub signature: String,
}

/// 用户公开资料响应（他人视角，脱敏：无邮箱）。
#[derive(Debug, Serialize)]
pub struct PublicUserResp {
    /// 用户 ID
    pub id: String,
    /// 登录名
    pub username: String,
    /// 昵称
    pub nickname: String,
    /// 头像文件 ID（null = 默认头像）
    pub avatar_file_id: Option<String>,
    /// 个性签名
    pub signature: String,
}

impl MeResp {
    /// 由 JOIN 行组装（profile 缺失时给默认值）。
    fn from_row(r: UserWithProfileRow) -> Self {
        // 先取出 username 供昵称兜底，避免部分移动后的借用冲突
        let username = r.username;
        let nickname = r.nickname.unwrap_or_else(|| username.clone());
        Self {
            id: r.id.to_string(),
            username,
            email: r.email,
            nickname,
            avatar_file_id: r.avatar_file_id.map(|v| v.to_string()),
            gender: r.gender.unwrap_or(0) as i16,
            signature: r.signature.unwrap_or_default(),
        }
    }
}

impl PublicUserResp {
    /// 由 JOIN 行组装（脱敏：丢弃 email）。
    fn from_row(r: UserWithProfileRow) -> Self {
        let username = r.username;
        let nickname = r.nickname.unwrap_or_else(|| username.clone());
        Self {
            id: r.id.to_string(),
            username,
            nickname,
            avatar_file_id: r.avatar_file_id.map(|v| v.to_string()),
            signature: r.signature.unwrap_or_default(),
        }
    }
}

/// users 路由挂载点（嵌于 /api/v1 下，均需 Bearer access）。
pub fn router() -> axum::Router<Arc<AppState>> {
    axum::Router::new()
        .route("/users/me", axum::routing::get(get_me).patch(patch_me))
        .route("/users/search", axum::routing::get(search))
        .route("/users/{id}", axum::routing::get(get_user))
}

/// SELECT users LEFT JOIN user_profiles 的公共列集。
const USER_PROFILE_SELECT: &str =
    "SELECT u.id, u.username, u.email, p.nickname, p.avatar_file_id, p.gender, p.signature \
     FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id";

/// GET /users/me —— 当前用户与资料。
pub async fn get_me(State(state): State<Arc<AppState>>, auth: AuthUser) -> ApiResult<Json<MeResp>> {
    let row: Option<UserWithProfileRow> =
        sqlx::query_as(&format!("{USER_PROFILE_SELECT} WHERE u.id = ?"))
            .bind(auth.uid)
            .fetch_optional(&state.pool)
            .await
            .map_err(|e| {
                tracing::error!("用户资料查询失败: {e}");
                AppError::internal()
            })?;
    let row = row.ok_or_else(|| AppError::not_found("用户不存在"))?;
    Ok(Json(MeResp::from_row(row)))
}

/// PATCH /users/me 请求体（全部可选，仅更新提供的字段）。
#[derive(Debug, Deserialize, Validate)]
pub struct PatchMeReq {
    /// 新昵称（1-32 字符）
    #[validate(length(min = 1, max = 32, message = "昵称长度须为 1-32 位"))]
    pub nickname: Option<String>,
    /// 头像文件 ID；0 表示清除为默认头像（JSON 数字或数字字符串均可）
    #[serde(default, deserialize_with = "crate::id_serde::de_u64_opt")]
    pub avatar_file_id: Option<u64>,
    /// 性别：0 未知 1 男 2 女
    pub gender: Option<i16>,
    /// 个性签名（0-128 字符）
    #[validate(length(max = 128, message = "签名最长 128 字符"))]
    pub signature: Option<String>,
}

/// PATCH /users/me —— 修改昵称/头像/签名/性别。
///
/// 先确保资料行存在（INSERT IGNORE），再读出当前值合并 PATCH 字段后整行写回。
pub async fn patch_me(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Json(req): Json<PatchMeReq>,
) -> ApiResult<Json<serde_json::Value>> {
    req.validate().map_err(|e| {
        let msg = e
            .field_errors()
            .values()
            .flat_map(|v| v.iter())
            .filter_map(|err| err.message.as_ref().map(|m| m.to_string()))
            .next()
            .unwrap_or_else(|| "参数校验失败".into());
        AppError::bad_request(msg)
    })?;
    if let Some(g) = req.gender {
        // gender 枚举校验（0 未知 1 男 2 女）
        if !(0..=2).contains(&g) {
            return Err(AppError::bad_request("gender 只能为 0/1/2"));
        }
    }

    let mut tx = state.pool.begin().await.map_err(|e| {
        tracing::error!("资料事务开启失败: {e}");
        AppError::internal()
    })?;

    // 资料行兜底创建（注册时已建，这里防历史数据缺失）
    sqlx::query("INSERT IGNORE INTO user_profiles (user_id, nickname) SELECT ?, username FROM users WHERE id = ?")
        .bind(auth.uid)
        .bind(auth.uid)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!("资料行兜底创建失败: {e}");
            AppError::internal()
        })?;

    // 读当前值 → 合并 → 整行写回（避免动态拼 SET，也避免覆盖未提供字段）
    let cur: (String, Option<u64>, i8, String) = sqlx::query_as(
        "SELECT nickname, avatar_file_id, gender, signature FROM user_profiles WHERE user_id = ?",
    )
    .bind(auth.uid)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("资料读取失败: {e}");
        AppError::internal()
    })?;

    let nickname = req.nickname.clone().unwrap_or(cur.0);
    // avatar_file_id=0 约定为"清除头像"→ 存 NULL
    let avatar_file_id: Option<u64> = match req.avatar_file_id {
        Some(0) => None,
        Some(v) => Some(v),
        None => cur.1,
    };
    let gender: i8 = req.gender.map(|g| g as i8).unwrap_or(cur.2);
    let signature = req.signature.clone().unwrap_or(cur.3);

    sqlx::query(
        "UPDATE user_profiles SET nickname = ?, avatar_file_id = ?, gender = ?, signature = ? WHERE user_id = ?",
    )
    .bind(&nickname)
    .bind(avatar_file_id)
    .bind(gender)
    .bind(&signature)
    .bind(auth.uid)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("资料更新失败: {e}");
        AppError::internal()
    })?;
    tx.commit().await.map_err(|e| {
        tracing::error!("资料事务提交失败: {e}");
        AppError::internal()
    })?;

    Ok(Json(serde_json::json!({ "code": 0, "msg": "ok" })))
}

/// GET /users/search —— 搜索用户（脱敏，不含密码/邮箱）。
///
/// 规则：q 含 @ → 邮箱精确匹配；否则用户名前缀匹配 OR 昵称包含匹配。
/// keyset 分页：cursor 为上一页最后一个用户 id；每页固定 20 条。
pub async fn search(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> ApiResult<Json<serde_json::Value>> {
    let q = params.get("q").map(|s| s.trim()).unwrap_or_default();
    if q.is_empty() {
        return Err(AppError::bad_request("q 不能为空"));
    }
    // cursor 解析（可选；非法值按首页处理）
    let cursor: u64 = params
        .get("cursor")
        .and_then(|c| c.parse().ok())
        .unwrap_or(0);

    let mut rows: Vec<UserWithProfileRow> = if q.contains('@') {
        // 邮箱精确匹配（库内小写归一，查询同样归一）
        let email = crate::auth::normalize_email(q);
        sqlx::query_as(&format!(
            "{USER_PROFILE_SELECT} WHERE u.email = ? AND u.id > ? ORDER BY u.id LIMIT 21"
        ))
        .bind(email)
        .bind(cursor)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| {
            tracing::error!("用户搜索失败: {e}");
            AppError::internal()
        })?
    } else {
        // 用户名前缀 + 昵称包含；LIKE 通配符转义防注入式全表扫描
        let like_prefix = format!("{}%", escape_like(q));
        let like_contains = format!("%{}%", escape_like(q));
        sqlx::query_as(&format!(
            "{USER_PROFILE_SELECT} WHERE (u.username LIKE ? OR p.nickname LIKE ?) AND u.id > ? ORDER BY u.id LIMIT 21"
        ))
        .bind(like_prefix)
        .bind(like_contains)
        .bind(cursor)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| {
            tracing::error!("用户搜索失败: {e}");
            AppError::internal()
        })?
    };

    // 多取 1 条判断 has_more；只返回 20 条
    let has_more = rows.len() > 20;
    rows.truncate(20);
    let next_cursor = if has_more {
        rows.last().map(|r| r.id.to_string())
    } else {
        None
    };

    let users: Vec<PublicUserResp> = rows.into_iter().map(PublicUserResp::from_row).collect();
    tracing::debug!(uid = auth.uid, q, "user search");
    Ok(Json(serde_json::json!({
        "users": users,
        "next_cursor": next_cursor,
    })))
}

/// GET /users/{id} —— 查看用户公开资料。
pub async fn get_user(
    State(state): State<Arc<AppState>>,
    _auth: AuthUser,
    Path(id): Path<u64>,
) -> ApiResult<Json<PublicUserResp>> {
    let row: Option<UserWithProfileRow> =
        sqlx::query_as(&format!("{USER_PROFILE_SELECT} WHERE u.id = ?"))
            .bind(id)
            .fetch_optional(&state.pool)
            .await
            .map_err(|e| {
                tracing::error!("用户公开资料查询失败: {e}");
                AppError::internal()
            })?;
    let row = row.ok_or_else(|| AppError::not_found("用户不存在"))?;
    Ok(Json(PublicUserResp::from_row(row)))
}

/// LIKE 通配符转义（% _ \），防止用户输入干扰匹配语义。
fn escape_like(input: &str) -> String {
    input
        .replace('\\', "\\\\")
        .replace('%', "\\%")
        .replace('_', "\\_")
}
