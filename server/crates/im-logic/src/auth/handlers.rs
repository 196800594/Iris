//! auth 接口处理器（计划书 6.1 注册/登录/建连流程）。
//!
//! 成功响应体为业务 JSON；失败统一经 [`im_common::error::AppError`] 转
//! `{code, msg, request_id}`（计划书 5.3 错误码）。

use std::net::SocketAddr;
use std::sync::Arc;

use argon2::password_hash::{PasswordHash, SaltString};
use argon2::{Argon2, PasswordHasher, PasswordVerifier};
use axum::extract::connect_info::ConnectInfo;
use axum::extract::State;
use axum::http::HeaderMap;
use axum::Json;
use rand::Rng;
use redis::AsyncCommands;
use validator::Validate;

use super::dto::*;
use super::{jwt, mailer, refresh_store, verify_email_code};
use crate::middleware::AuthUser;
use crate::AppState;
use im_common::error::{ApiResult, AppError};
use im_common::redis_keys;

/// 入参校验辅助：失败时取首条错误消息返回 1006。
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

/// 密码强度：8-64 位且同时包含字母与数字（长度由 validator 保证，这里补字符种类）。
fn ensure_password_strength(password: &str) -> Result<(), AppError> {
    let has_letter = password.chars().any(|c| c.is_ascii_alphabetic());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    if has_letter && has_digit {
        Ok(())
    } else {
        Err(AppError::bad_request("密码必须同时包含字母和数字"))
    }
}

/// argon2id 哈希密码（随机盐）。
fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut rand::rngs::OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| {
            tracing::error!("argon2 哈希失败: {e}");
            AppError::internal()
        })
}

/// 校验密码与 argon2id 哈希是否匹配。
fn verify_password(password: &str, stored: &str) -> bool {
    PasswordHash::new(stored)
        .map(|parsed| {
            Argon2::default()
                .verify_password(password.as_bytes(), &parsed)
                .is_ok()
        })
        .unwrap_or(false)
}

/// 签发 access + refresh 令牌对。
///
/// `family_id`：登录时新建族；refresh 时沿用旧族（`jti` 为新登记的 jti）。
async fn issue_token_pair(
    state: &AppState,
    uid: u64,
    family_id: &str,
    jti: &str,
) -> Result<TokenPairResp, AppError> {
    let access = jwt::sign_access(
        &state.cfg.jwt_secret,
        uid,
        family_id,
        state.cfg.access_token_ttl_seconds,
    )?;
    let refresh = jwt::sign_refresh_with_jti(
        &state.cfg.jwt_secret,
        uid,
        family_id,
        jti,
        state.cfg.refresh_token_ttl_seconds,
    )?;
    Ok(TokenPairResp {
        access_token: access,
        refresh_token: refresh,
        token_type: "Bearer".into(),
        expires_in: state.cfg.access_token_ttl_seconds,
    })
}

/// POST /auth/email-code —— 发送邮箱验证码（计划书 6.1 步骤 1-2）。
///
/// 流程：IP 限流 → purpose 存在性校验（register 未注册 / reset 已注册）→
/// 60s 冷却 → 生成 6 位码存 Redis（300s）→ SMTP 发信或开发日志。
pub async fn email_code(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(req): Json<EmailCodeReq>,
) -> ApiResult<Json<serde_json::Value>> {
    ensure_valid(&req)?;
    let ip = super::extract_ip(&headers, Some(&addr));
    super::check_auth_rate_limit(&state, &ip).await?;
    let email = super::normalize_email(&req.email);

    // purpose 白名单（计划书 v1.1：register/reset 分键、分场景校验存在性）
    match req.purpose.as_str() {
        "register" => {
            // 注册：要求邮箱未注册（否则泄露"已注册"提示也符合产品语义，1007 冲突）
            // users.id 为 BIGINT UNSIGNED，必须用 u64 解码（sqlx 严格类型校验）
            let exists: Option<u64> =
                sqlx::query_scalar("SELECT id FROM users WHERE email = ? LIMIT 1")
                    .bind(&email)
                    .fetch_optional(&state.pool)
                    .await
                    .map_err(|e| {
                        tracing::error!("邮箱存在性查询失败: {e}");
                        AppError::internal()
                    })?;
            if exists.is_some() {
                return Err(AppError::conflict("该邮箱已注册，请直接登录"));
            }
        }
        "reset" => {
            // 找回密码：要求邮箱已注册
            let exists: Option<u64> =
                sqlx::query_scalar("SELECT id FROM users WHERE email = ? LIMIT 1")
                    .bind(&email)
                    .fetch_optional(&state.pool)
                    .await
                    .map_err(|e| {
                        tracing::error!("邮箱存在性查询失败: {e}");
                        AppError::internal()
                    })?;
            if exists.is_none() {
                return Err(AppError::invalid_credentials("该邮箱尚未注册"));
            }
        }
        _ => return Err(AppError::bad_request("purpose 必须为 register 或 reset")),
    }

    // 同邮箱 60 秒重发冷却：SET NX EX 原子占位
    let cooldown_key = redis_keys::cooldown_email(&email);
    let mut redis = state.redis.clone();
    let cooldown_secs = state.cfg.email_code_resend_cooldown_seconds;
    // 原生 SET key value NX EX <secs>（redis-rs 的 set_nx_ex 在 0.27 不可用，用 cmd 组装最直观）
    let acquired: Result<Option<String>, _> = redis::cmd("SET")
        .arg(&cooldown_key)
        .arg(1i64)
        .arg("NX")
        .arg("EX")
        .arg(cooldown_secs)
        .query_async(&mut redis)
        .await;
    if !matches!(acquired, Ok(Some(_))) {
        return Err(AppError::rate_limited());
    }

    // 6 位数字验证码
    let code: u32 = rand::thread_rng().gen_range(100_000..1_000_000);
    let code = code.to_string();

    // 开发万能码启用时：不存 Redis、不发信（演示兜底；production 强制忽略）
    let dev_bypass = state.cfg.is_dev() && !state.cfg.email_dev_code.is_empty();
    if dev_bypass {
        tracing::info!(email, "[dev] 万能验证码已启用，跳过发码（EMAIL_DEV_CODE）");
    } else {
        // 存 Redis（register/reset 分键）
        let key = redis_keys::verify_email(&email, &req.purpose);
        let _: Result<(), _> = redis
            .set_ex::<_, _, ()>(&key, &code, state.cfg.email_code_ttl_seconds)
            .await;

        // 发信：SMTP_ENABLED=false 时只打日志（开发模式）
        if state.cfg.smtp_enabled {
            let st = state.clone();
            let email_clone = email.clone();
            let code_clone = code.clone();
            tokio::spawn(async move {
                if let Err(e) = mailer::send_code_email(&st, &email_clone, &code_clone).await {
                    tracing::error!(email = email_clone, "验证码邮件发送失败: {e}");
                } else {
                    tracing::info!(email = email_clone, "验证码邮件已发送");
                }
            });
        } else {
            tracing::info!(email, "[dev] email code: {code}");
        }
    }

    Ok(Json(serde_json::json!({
        "sent": true,
        "cooldown_seconds": cooldown_secs,
    })))
}

/// POST /auth/register —— 注册（计划书 6.1）。
///
/// 事务：INSERT users + INSERT user_profiles（昵称默认 = 用户名）；
/// 邮箱验证码一次性核销；argon2id 哈希密码。
pub async fn register(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(req): Json<RegisterReq>,
) -> ApiResult<Json<serde_json::Value>> {
    ensure_valid(&req)?;
    ensure_password_strength(&req.password)?;
    let ip = super::extract_ip(&headers, Some(&addr));
    super::check_auth_rate_limit(&state, &ip).await?;
    let email = super::normalize_email(&req.email);
    let username = req.username.trim().to_string();

    // 验证码一次性核销（purpose=register 分键；万能码仅 development）
    verify_email_code(&state, &email, "register", &req.code).await?;

    // 预查重给友好错误（并发兜底靠唯一键 + 撞键回查）
    // users.id 为 BIGINT UNSIGNED，必须用 u64 解码（sqlx 严格类型校验）
    let username_taken: Option<u64> =
        sqlx::query_scalar("SELECT id FROM users WHERE username = ? LIMIT 1")
            .bind(&username)
            .fetch_optional(&state.pool)
            .await
            .map_err(|e| {
                tracing::error!("注册查重失败: {e}");
                AppError::internal()
            })?;
    if username_taken.is_some() {
        return Err(AppError::conflict("用户名已被占用"));
    }
    let email_taken: Option<u64> =
        sqlx::query_scalar("SELECT id FROM users WHERE email = ? LIMIT 1")
            .bind(&email)
            .fetch_optional(&state.pool)
            .await
            .map_err(|e| {
                tracing::error!("注册查重失败: {e}");
                AppError::internal()
            })?;
    if email_taken.is_some() {
        return Err(AppError::conflict("该邮箱已注册，请直接登录"));
    }

    let password_hash = hash_password(&req.password)?;
    let uid = im_common::id::next_id();

    // 事务：账号 + 资料（昵称默认 = 用户名，注册后可改）
    let mut tx = state.pool.begin().await.map_err(|e| {
        tracing::error!("注册事务开启失败: {e}");
        AppError::internal()
    })?;
    let r =
        sqlx::query("INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)")
            .bind(uid)
            .bind(&username)
            .bind(&email)
            .bind(&password_hash)
            .execute(&mut *tx)
            .await;
    if let Err(e) = r {
        // 并发注册撞唯一键：给出友好冲突提示
        if e.as_database_error()
            .is_some_and(|d| d.is_unique_violation())
        {
            return Err(AppError::conflict("用户名或邮箱已被占用"));
        }
        tracing::error!("注册写入失败: {e}");
        return Err(AppError::internal());
    }
    sqlx::query("INSERT INTO user_profiles (user_id, nickname) VALUES (?, ?)")
        .bind(uid)
        .bind(req.nickname.trim())
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!("注册资料写入失败: {e}");
            AppError::internal()
        })?;
    tx.commit().await.map_err(|e| {
        tracing::error!("注册事务提交失败: {e}");
        AppError::internal()
    })?;

    tracing::info!(uid, username, "用户注册成功");
    Ok(Json(serde_json::json!({ "user_id": uid.to_string() })))
}

/// POST /auth/login —— 登录（账号 = 用户名或邮箱）。
///
/// 校验 argon2id → 创建 refresh 族 → 签发双令牌。
pub async fn login(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(req): Json<LoginReq>,
) -> ApiResult<Json<TokenPairResp>> {
    ensure_valid(&req)?;
    let ip = super::extract_ip(&headers, Some(&addr));
    super::check_auth_rate_limit(&state, &ip).await?;

    // 含 @ 按邮箱归一化处理；否则按用户名 trim
    let account = req.account.trim().to_string();
    let lookup = if account.contains('@') {
        super::normalize_email(&account)
    } else {
        account
    };

    let row: Option<(u64, String, String, i8)> = sqlx::query_as(
        "SELECT id, password_hash, username, status FROM users WHERE username = ? OR email = ? LIMIT 1",
    )
    .bind(&lookup)
    .bind(&lookup)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!("登录查询失败: {e}");
        AppError::internal()
    })?;

    let Some((uid, password_hash, _username, status)) = row else {
        // 用户不存在与密码错误统一表述，避免账号枚举
        return Err(AppError::invalid_credentials("账号或密码错误"));
    };
    if status != 0 {
        return Err(AppError::invalid_credentials("账号已被禁用"));
    }
    if !verify_password(&req.password, &password_hash) {
        return Err(AppError::invalid_credentials("账号或密码错误"));
    }

    // 新 refresh 族 + 首枚 jti 登记 + 签发
    let family_id = refresh_store::issue_family(&state, uid).await?;
    let new_jti = uuid::Uuid::new_v4().to_string();
    refresh_store::register_login_jti(&state, &family_id, &new_jti, uid).await?;
    let pair = issue_token_pair(&state, uid, &family_id, &new_jti).await?;

    tracing::info!(uid, "用户登录成功");
    Ok(Json(pair))
}

/// POST /auth/refresh —— 刷新令牌（轮换；旧 jti 标记 rotated）。
///
/// 盗用检测：已 rotated/revoked 的 refresh 被再次使用 → 整族吊销 + ForceKick。
pub async fn refresh(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RefreshReq>,
) -> ApiResult<Json<TokenPairResp>> {
    if req.refresh_token.is_empty() {
        return Err(AppError::bad_request("refresh_token 不能为空"));
    }
    // 签名与类型校验；refresh 过期必须重新登录（映射为 1001，
    // 避免客户端把 1002 当作 access 过期而再次刷新形成循环）
    let claims = match jwt::verify(&req.refresh_token, &state.cfg.jwt_secret, jwt::TYPE_REFRESH) {
        Ok(c) => c,
        Err(e) if e.code == 1002 => return Err(AppError::unauthorized()),
        Err(e) => return Err(e),
    };

    let uid: u64 = claims.sub.parse().map_err(|_| AppError::unauthorized())?;
    match refresh_store::rotate(&state, uid, &claims.fam, &claims.jti).await? {
        refresh_store::RotateOutcome::Rotated {
            uid,
            family_id,
            new_jti,
        } => {
            let pair = issue_token_pair(&state, uid, &family_id, &new_jti).await?;
            Ok(Json(pair))
        }
        // 盗用已整族吊销并踢下线，统一按未授权处理
        refresh_store::RotateOutcome::Stolen => Err(AppError::unauthorized()),
    }
}

/// POST /auth/logout —— 登出：吊销 refresh 族（当前设备）。
pub async fn logout(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
    Json(req): Json<LogoutReq>,
) -> ApiResult<Json<serde_json::Value>> {
    if req.refresh_token.is_empty() {
        return Err(AppError::bad_request("refresh_token 不能为空"));
    }
    // refresh 有效才知要吊销哪个族；无效则视为已登出（幂等友好）
    if let Ok(claims) = jwt::verify(&req.refresh_token, &state.cfg.jwt_secret, jwt::TYPE_REFRESH) {
        // 校验族属主：只能吊销自己的族（防用他人 refresh 做 DoS）
        if claims.sub == auth.uid.to_string() {
            refresh_store::revoke_family(&state, &claims.fam).await;
        }
    }
    Ok(Json(serde_json::json!({ "code": 0, "msg": "ok" })))
}

/// POST /auth/reset-password —— 邮箱验证码找回密码（计划书 6.1）。
///
/// 校验 purpose=reset 验证码 → 更新 argon2id 哈希 →
/// 吊销该用户全部 refresh 族 + ForceKick（其他设备强制重新登录）。
pub async fn reset_password(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(req): Json<ResetPasswordReq>,
) -> ApiResult<Json<serde_json::Value>> {
    ensure_valid(&req)?;
    ensure_password_strength(&req.new_password)?;
    let ip = super::extract_ip(&headers, Some(&addr));
    super::check_auth_rate_limit(&state, &ip).await?;
    let email = super::normalize_email(&req.email);

    let row: Option<u64> = sqlx::query_scalar("SELECT id FROM users WHERE email = ? LIMIT 1")
        .bind(&email)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| {
            tracing::error!("重置密码查询用户失败: {e}");
            AppError::internal()
        })?;
    let Some(uid) = row else {
        return Err(AppError::invalid_credentials("该邮箱尚未注册"));
    };

    // 验证码一次性核销（purpose=reset）
    verify_email_code(&state, &email, "reset", &req.code).await?;

    let password_hash = hash_password(&req.new_password)?;
    sqlx::query("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(&password_hash)
        .bind(uid)
        .execute(&state.pool)
        .await
        .map_err(|e| {
            tracing::error!("密码更新失败: {e}");
            AppError::internal()
        })?;

    // 吊销全部 refresh 族 + 踢下线（全部 WS 连接重新登录）
    refresh_store::revoke_all_user(&state, uid).await;
    crate::force_kick(&state, uid, "密码已重置，请重新登录").await;

    tracing::info!(uid, "密码重置完成，refresh 全族吊销");
    Ok(Json(serde_json::json!({ "code": 0, "msg": "ok" })))
}

/// POST /ws/ticket —— 签发 WS 一次性建连票据（需 Bearer access）。
///
/// Redis `SET ws:ticket:{t} = uid EX ttl`；网关握手时 GETDEL 一次性核销。
pub async fn ws_ticket(
    State(state): State<Arc<AppState>>,
    auth: AuthUser,
) -> ApiResult<Json<TicketResp>> {
    let ticket = uuid::Uuid::new_v4().simple().to_string();
    let key = redis_keys::ws_ticket(&ticket);
    let mut redis = state.redis.clone();
    let _: Result<(), _> = redis
        .set_ex::<_, _, ()>(&key, auth.uid.to_string(), state.cfg.ws_ticket_ttl_seconds)
        .await;
    Ok(Json(TicketResp {
        ticket,
        expires_in: state.cfg.ws_ticket_ttl_seconds,
    }))
}
