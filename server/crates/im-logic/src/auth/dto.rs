//! auth 模块的请求/响应 DTO（validator 入参校验，计划书 1006 参数校验失败）。
//!
//! 响应字段命名保持 snake_case（与 Rust/数据库一致，桌面端 TS 类型由同构生成）。

use serde::{Deserialize, Serialize};
use validator::Validate;

/// 发送邮箱验证码请求（POST /auth/email-code）。
#[derive(Debug, Deserialize, Validate)]
pub struct EmailCodeReq {
    /// 邮箱（服务端 trim + 小写归一后使用）
    #[validate(email(message = "邮箱格式不正确"))]
    pub email: String,
    /// 用途：register（要求邮箱未注册）/ reset（要求邮箱已注册）
    pub purpose: String,
}

/// 注册请求（POST /auth/register）。
#[derive(Debug, Deserialize, Validate)]
pub struct RegisterReq {
    /// 登录名：4-32 位字母/数字/下划线
    #[validate(
        length(min = 4, max = 32, message = "用户名长度须为 4-32 位"),
        regex(path = "username_re()", message = "用户名只能包含字母、数字、下划线")
    )]
    pub username: String,
    /// 昵称：必填，1-32 位
    #[validate(length(min = 1, max = 32, message = "昵称长度须为 1-32 位"))]
    pub nickname: String,
    /// 邮箱（归一化后查重）
    #[validate(email(message = "邮箱格式不正确"))]
    pub email: String,
    /// 密码：8-64 位，须含字母与数字
    #[validate(length(min = 8, max = 64, message = "密码长度须为 8-64 位"))]
    pub password: String,
    /// 邮箱验证码（purpose=register）
    #[validate(length(min = 4, max = 8, message = "验证码格式不正确"))]
    pub code: String,
}

/// 登录请求（POST /auth/login）。
#[derive(Debug, Deserialize, Validate)]
pub struct LoginReq {
    /// 登录凭证：用户名或邮箱（含 @ 按邮箱处理）
    #[validate(length(min = 1, max = 255, message = "账号不能为空"))]
    pub account: String,
    /// 密码明文（仅 TLS 链路内传输，服务端 argon2id 校验）
    #[validate(length(min = 1, max = 64, message = "密码不能为空"))]
    pub password: String,
    /// 设备唯一标识（客户端持久化 UUID），用于同端登录互斥与异端踢线识别
    #[validate(length(min = 1, max = 128, message = "device_id 不能为空"))]
    pub device_id: String,
    /// 设备名称（如主机名），可选，用于踢线提示文案
    #[serde(default)]
    pub device_name: Option<String>,
}

/// 刷新令牌请求（POST /auth/refresh）。
#[derive(Debug, Deserialize)]
pub struct RefreshReq {
    /// 登录时获得的 refresh 令牌
    pub refresh_token: String,
}

/// 登出请求（POST /auth/logout，需 Bearer access）。
#[derive(Debug, Deserialize)]
pub struct LogoutReq {
    /// 当前设备的 refresh 令牌（吊销其所属轮换族）
    pub refresh_token: String,
}

/// 重置密码请求（POST /auth/reset-password）。
#[derive(Debug, Deserialize, Validate)]
pub struct ResetPasswordReq {
    /// 邮箱（须已注册；归一化后比对）
    #[validate(email(message = "邮箱格式不正确"))]
    pub email: String,
    /// 验证码（purpose=reset）
    #[validate(length(min = 4, max = 8, message = "验证码格式不正确"))]
    pub code: String,
    /// 新密码：8-64 位，须含字母与数字
    #[validate(length(min = 8, max = 64, message = "密码长度须为 8-64 位"))]
    pub new_password: String,
}

/// 令牌对响应（login / refresh 通用）。
#[derive(Debug, Serialize)]
pub struct TokenPairResp {
    /// access 令牌（JWT HS256，默认 2h）
    pub access_token: String,
    /// refresh 令牌（JWT，默认 30d，轮换机制）
    pub refresh_token: String,
    /// 令牌类型（HTTP Authorization 头前缀）
    pub token_type: String,
    /// access 有效期（秒）
    pub expires_in: u64,
}

/// WS ticket 签发响应（POST /ws/ticket）。
#[derive(Debug, Serialize)]
pub struct TicketResp {
    /// 一次性建连票据，客户端以 `?ticket=` 携带
    pub ticket: String,
    /// 票据有效期（秒），过期需重新签发
    pub expires_in: u64,
}

/// 用户名格式正则：字母/数字/下划线。
static USERNAME_RE: once_cell::sync::Lazy<regex::Regex> = once_cell::sync::Lazy::new(|| {
    regex::Regex::new(r"^[A-Za-z0-9_]+$").expect("用户名正则编译失败")
});

/// validator `regex(path)` 要求 `&'static Regex`（AsRegex 未对 Lazy 实现，经由本函数解引用）。
pub fn username_re() -> &'static regex::Regex {
    &USERNAME_RE
}
