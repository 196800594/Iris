//! 统一错误类型：业务错误码（计划书 5.3 分段）+ HTTP 状态映射。
//!
//! REST 统一出口为 `{ "code": ..., "msg": ..., "request_id": ... }`；
//! WS 侧直接复用 code/msg 填充 `Frame`。5000 段对外模糊化（只回"服务繁忙"），
//! 细节由调用方用 tracing 记录。

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

/// 业务错误：code 为计划书 5.3 分段错误码，msg 为对用户可见的中文描述。
#[derive(Debug, Clone, thiserror::Error)]
#[error("code={code} msg={msg}")]
pub struct AppError {
    /// 业务错误码（0 成功；1000 段鉴权/通用、2000 段消息、3000 段关系链/群、4000 段文件、5000 段内部）
    pub code: u32,
    /// 对用户可见的中文错误描述
    pub msg: String,
}

impl AppError {
    /// 快捷构造。
    pub fn new(code: u32, msg: impl Into<String>) -> Self {
        Self {
            code,
            msg: msg.into(),
        }
    }

    /// 1001 未登录（无/错 Bearer、ticket 无效）。
    pub fn unauthorized() -> Self {
        Self::new(1001, "未登录或凭证无效")
    }

    /// 1002 令牌过期。
    pub fn token_expired() -> Self {
        Self::new(1002, "令牌已过期")
    }

    /// 1005 触发限流。
    pub fn rate_limited() -> Self {
        Self::new(1005, "请求过于频繁，请稍后再试")
    }

    /// 1006 参数校验失败。
    pub fn bad_request(msg: impl Into<String>) -> Self {
        Self::new(1006, msg)
    }

    /// 5000 段内部错误：对外模糊化，只回"服务繁忙"。
    pub fn internal() -> Self {
        Self::new(5000, "服务繁忙，请稍后再试")
    }

    /// 按错误码段映射 HTTP 状态码（计划书 5.3 语义对齐表）。
    fn http_status(&self) -> StatusCode {
        match self.code {
            1001 | 1002 | 1004 => StatusCode::UNAUTHORIZED, // 未登录/过期/凭证错误
            1003 | 1006 => StatusCode::BAD_REQUEST,         // 验证码错误/参数校验
            1007 => StatusCode::CONFLICT,                   // 资源冲突/已占用
            1005 => StatusCode::TOO_MANY_REQUESTS,          // 限流
            2001..=2005 => StatusCode::BAD_REQUEST,         // 消息域
            3001 | 3002 | 3005 => StatusCode::CONFLICT,     // 关系链冲突
            3003 => StatusCode::BAD_REQUEST,                // 群满
            3004 => StatusCode::FORBIDDEN,                  // 无权限
            4001 | 4002 => StatusCode::BAD_REQUEST,         // 文件类型/超大
            4003 => StatusCode::FORBIDDEN,                  // 签名错误/过期
            5000..=5999 => StatusCode::INTERNAL_SERVER_ERROR, // 内部错误
            _ => StatusCode::BAD_REQUEST,
        }
    }
}

/// 转换为 axum 响应：`{"code":..., "msg":..., "request_id":...}` + 映射的 HTTP 状态码。
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        // request_id 由中间件注入；W1 骨架先留空字符串占位（W2 接入 trace 中间件后填充）
        let body = json!({
            "code": self.code,
            "msg": self.msg,
            "request_id": "",
        });
        (self.http_status(), Json(body)).into_response()
    }
}

/// 便捷别名：handler 返回类型。
pub type ApiResult<T> = Result<T, AppError>;
