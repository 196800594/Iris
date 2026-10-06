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

    /// 1003 验证码错误/过期。
    pub fn code_invalid() -> Self {
        Self::new(1003, "验证码错误或已过期")
    }

    /// 1004 凭证错误（账号或密码错误、邮箱未注册、账号禁用等登录类失败）。
    pub fn invalid_credentials(msg: impl Into<String>) -> Self {
        Self::new(1004, msg)
    }

    /// 1007 资源冲突/已占用（用户名重复、邮箱已注册等）。
    pub fn conflict(msg: impl Into<String>) -> Self {
        Self::new(1007, msg)
    }

    /// 1008 资源不存在（通用请求段补充码，映射 HTTP 404）。
    pub fn not_found(msg: impl Into<String>) -> Self {
        Self::new(1008, msg)
    }

    /// 3001 已是好友（重复加好友/重复同意）。
    pub fn already_friends() -> Self {
        Self::new(3001, "你们已经是好友了")
    }

    /// 3002 好友申请状态冲突（对方有待处理申请/申请已被处理）。
    pub fn request_conflict(msg: impl Into<String>) -> Self {
        Self::new(3002, msg)
    }

    /// 3004 无权限执行该操作（处理他人的申请等）。
    pub fn forbidden(msg: impl Into<String>) -> Self {
        Self::new(3004, msg)
    }

    /// 3003 群成员已达上限（建群/邀请/申请审批共用）。
    pub fn group_full() -> Self {
        Self::new(3003, "群成员已达上限")
    }

    /// 3005 已是群成员（重复邀请/重复入群）。
    pub fn already_member() -> Self {
        Self::new(3005, "已是群成员")
    }

    /// 2001 会话不存在。
    pub fn conv_not_found() -> Self {
        Self::new(2001, "会话不存在")
    }

    /// 2002 非会话成员/无权操作该会话（含删好友后旧单聊只读，计划书 7.3）。
    pub fn not_conv_member(msg: impl Into<String>) -> Self {
        Self::new(2002, msg)
    }

    /// 2003 消息内容非法（空内容/超长/类型不允许）。
    pub fn invalid_content(msg: impl Into<String>) -> Self {
        Self::new(2003, msg)
    }

    /// 1006 参数校验失败。
    pub fn bad_request(msg: impl Into<String>) -> Self {
        Self::new(1006, msg)
    }

    /// 4001 文件类型不在白名单（计划书 5.3 文件域）。
    pub fn file_type_unsupported() -> Self {
        Self::new(4001, "文件类型不允许")
    }

    /// 4002 文件超过大小上限（图片 20MiB / 其他 100MiB，计划书 6.7）。
    pub fn file_too_large() -> Self {
        Self::new(4002, "文件大小超过限制")
    }

    /// 4003 签名错误/过期（文件下载 HMAC 校验失败）。
    pub fn bad_signature() -> Self {
        Self::new(4003, "签名错误或下载链接已过期")
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
            1008 => StatusCode::NOT_FOUND,                  // 资源不存在
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
