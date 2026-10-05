//! REST 中间件与鉴权提取器。
//!
//! - [`AuthUser`]：`Authorization: Bearer <access>` 提取 + JWT 无状态校验，
//!   失败统一 1001/1002（计划书 5.3）；
//! - [`request_id`]：每请求生成 uuid 写入 `x-request-id` 响应头与日志 span，
//!   错误响应体的 request_id 字段由排错表以此关联；
//! - [`client_ip`]：TCP 对端地址兜底取 IP。

use std::sync::Arc;

use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::middleware::Next;
use axum::response::Response;

use crate::auth::jwt;
use crate::AppState;

/// 已鉴权用户（REST 受保护接口的处理器参数注入）。
#[derive(Debug, Clone, Copy)]
pub struct AuthUser {
    /// 经 access 令牌校验的用户 ID
    pub uid: u64,
}

impl FromRequestParts<Arc<AppState>> for AuthUser {
    type Rejection = im_common::error::AppError;

    /// 从 Authorization 头解析 Bearer access 令牌并校验。
    ///
    /// # 错误
    /// - 头缺失/格式错/签名非法/类型不符 → 1001；
    /// - 过期 → 1002（客户端拦截后走 /auth/refresh → 原请求重放）。
    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        let header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or_else(im_common::error::AppError::unauthorized)?;
        let token = header
            .strip_prefix("Bearer ")
            .filter(|t| !t.is_empty())
            .ok_or_else(im_common::error::AppError::unauthorized)?;

        let claims = jwt::verify(token, &state.cfg.jwt_secret, jwt::TYPE_ACCESS)?;
        let uid = claims
            .sub
            .parse()
            .map_err(|_| im_common::error::AppError::unauthorized())?;
        Ok(AuthUser { uid })
    }
}

/// request_id 中间件：生成 uuid → 日志 span + `x-request-id` 响应头。
pub async fn request_id(req: axum::extract::Request, next: Next) -> Response {
    let rid = uuid::Uuid::new_v4().simple().to_string();
    // 与请求处理共用同一 span，日志可按 rid 关联
    let span = tracing::info_span!("http", rid = %rid, method = %req.method());
    let mut resp = tracing::Instrument::instrument(next.run(req), span).await;
    if let Ok(v) = axum::http::HeaderValue::from_str(&rid) {
        resp.headers_mut().insert("x-request-id", v);
    }
    resp
}

/// TCP 对端 IP（无代理头时的兜底；限流键用）。
pub fn client_ip(addr: Option<&std::net::SocketAddr>) -> String {
    addr.map(|a| a.ip().to_string())
        .unwrap_or_else(|| "unknown".into())
}
