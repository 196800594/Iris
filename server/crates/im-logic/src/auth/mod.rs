//! # auth 模块 —— 账号认证（技术文档 5.1 第 2 条 / 计划书 6.1）
//!
//! 职责：邮箱验证码、注册、登录、JWT 双令牌签发、refresh 轮换与盗用检测、
//! 登出、邮箱找回密码、WS ticket 签发、鉴权接口 IP 限流。
//!
//! 关键纪律：
//! - email 一律 trim + 小写归一后入库/比对（计划书 6.1 邮箱归一化）；
//! - 验证码按 purpose（register/reset）分键存储、一次性使用；
//! - `EMAIL_DEV_CODE` 万能码仅 `APP_ENV=development` 生效，production 强制忽略；
//! - refresh 轮换：旧 jti 标记 rotated；再次使用即判定盗用 → 整族吊销 + ForceKick。

mod dto;
mod handlers;
// jwt 供 middleware（Bearer 提取器）跨模块使用
pub(crate) mod jwt;
mod mailer;
mod refresh_store;

use std::sync::Arc;

use axum::routing::{get, post};
use axum::Router;
use redis::AsyncCommands;

use crate::middleware::client_ip;
use crate::AppState;

/// 鉴权相关路由挂载点（全部无鉴权，除 ws/ticket 需 Bearer access）。
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/auth/email-code", post(handlers::email_code))
        .route("/auth/register", post(handlers::register))
        .route("/auth/login", post(handlers::login))
        .route("/auth/refresh", post(handlers::refresh))
        .route("/auth/logout", post(handlers::logout))
        .route("/auth/reset-password", post(handlers::reset_password))
        .route("/ws/ticket", post(handlers::ws_ticket))
        // 保留 GET 便于浏览器直接访问调试（与 POST 等价实现）
        .route("/ws/ticket", get(handlers::ws_ticket))
}

/// 归一化邮箱：trim + 转小写（计划书 6.1；库内只存小写形式）。
pub fn normalize_email(email: &str) -> String {
    email.trim().to_lowercase()
}

/// 鉴权接口 IP 限流：`ratelimit:auth:{ip}` 固定窗口 60s，超上限返回 1005。
///
/// 覆盖接口：发码 / 注册 / 登录 / 重置密码（ws/ticket 已有 Bearer 鉴权不重复限流）。
pub async fn check_auth_rate_limit(
    state: &Arc<AppState>,
    ip: &str,
) -> Result<(), im_common::error::AppError> {
    let key = im_common::redis_keys::ratelimit_auth(ip);
    let mut redis = state.redis.clone();
    // INCR 原子自增；返回值 1 表示窗口首请求，需要设置过期
    let n: i64 = redis.incr(&key, 1i64).await.map_err(|e| {
        tracing::error!("鉴权限流 Redis 错误: {e}");
        im_common::error::AppError::internal()
    })?;
    if n == 1 {
        let _: Result<i64, _> = redis.expire(&key, 60).await; // 窗口 60 秒（im-common redis_keys::AUTH_RATE_LIMIT_TTL）
    }
    if n > state.cfg.auth_rate_limit_per_minute as i64 {
        return Err(im_common::error::AppError::rate_limited());
    }
    Ok(())
}

/// 从请求中解析客户端真实 IP（用于限流键）。
///
/// 优先 `X-Forwarded-For` 首值（经 Caddy 反代时由边缘注入），其次 `X-Real-IP`，
/// 都没有则取 TCP 对端地址（本机直连场景）。
/// 注意：直连场景下 XFF 可被伪造，仅作限流用途可接受；生产经 Caddy 时首值可信。
pub fn extract_ip(headers: &axum::http::HeaderMap, addr: Option<&std::net::SocketAddr>) -> String {
    if let Some(xff) = headers.get("x-forwarded-for").and_then(|v| v.to_str().ok()) {
        // XFF 可能是逗号分隔链：取第一个（最初的客户端）
        if let Some(first) = xff.split(',').next() {
            let ip = first.trim();
            if !ip.is_empty() {
                return ip.to_string();
            }
        }
    }
    if let Some(rip) = headers.get("x-real-ip").and_then(|v| v.to_str().ok()) {
        let ip = rip.trim();
        if !ip.is_empty() {
            return ip.to_string();
        }
    }
    client_ip(addr)
}

/// 校验邮箱验证码（一次性；万能码仅 development 生效）。
///
/// - `EMAIL_DEV_CODE` 非空且为开发环境：不查 Redis、直接通过（不发信场景的演示兜底）；
/// - 正常路径：GET `verify:email:{email}:{purpose}` 比对，通过即 DEL（一次性）；
/// - 缺失/不匹配返回 1003。
pub async fn verify_email_code(
    state: &Arc<AppState>,
    email: &str,
    purpose: &str,
    code: &str,
) -> Result<(), im_common::error::AppError> {
    // 开发万能码：不查 Redis、不删除（可反复使用，仅演示环境）
    if state.cfg.is_dev()
        && !state.cfg.email_dev_code.is_empty()
        && code == state.cfg.email_dev_code
    {
        return Ok(());
    }
    let key = im_common::redis_keys::verify_email(email, purpose);
    let mut redis = state.redis.clone();
    let stored: Option<String> = redis.get(&key).await.map_err(|e| {
        tracing::error!("验证码读取 Redis 错误: {e}");
        im_common::error::AppError::internal()
    })?;
    match stored {
        Some(stored) if stored == code => {
            // 一次性：校验通过立即删除
            let _: Result<i64, _> = redis.del(&key).await;
            Ok(())
        }
        _ => Err(im_common::error::AppError::code_invalid()),
    }
}
