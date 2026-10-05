//! Redis 键构造函数与 TTL 常量——键名格式的**唯一出处**。
//!
//! 键总表（计划书 5.2 / 技术文档 5.2.1）：
//! | 键 | 类型 | TTL | 用途 |
//! |---|---|---|---|
//! | verify:email:{email}:{purpose} | string | 300s | 邮箱验证码（register/reset 分键） |
//! | cooldown:email:{email} | string | 60s | 同邮箱重发冷却 |
//! | ratelimit:auth:{ip} | counter | 60s | 鉴权接口 IP 限流 |
//! | ws:ticket:{ticket} | string | 30s | WS 一次性建连票据（GETDEL） |
//! | msg:idem:{conv_id}:{client_msg_id} | string | 24h | 发送幂等快速窗口（库唯一键兜底） |
//! | presence:{uid} | string | 120s | 用户在线状态与所在节点（30s 续期） |

use std::time::Duration;

/// 邮箱验证码有效期：300 秒。
pub const EMAIL_CODE_TTL: Duration = Duration::from_secs(300);
/// 同邮箱重发冷却：60 秒。
pub const EMAIL_COOLDOWN_TTL: Duration = Duration::from_secs(60);
/// 鉴权 IP 限流窗口：60 秒。
pub const AUTH_RATE_LIMIT_TTL: Duration = Duration::from_secs(60);
/// WS ticket 有效期：30 秒。
pub const WS_TICKET_TTL: Duration = Duration::from_secs(30);
/// 发送幂等窗口：24 小时。
pub const MSG_IDEM_TTL: Duration = Duration::from_secs(86_400);
/// presence 键 TTL：120 秒（30 秒心跳续期）。
pub const PRESENCE_TTL: Duration = Duration::from_secs(120);

/// 邮箱验证码键：`verify:email:{email}:{purpose}`（purpose = register/reset，分键不混用）。
pub fn verify_email(email: &str, purpose: &str) -> String {
    format!("verify:email:{email}:{purpose}")
}

/// 同邮箱重发冷却键：`cooldown:email:{email}`。
pub fn cooldown_email(email: &str) -> String {
    format!("cooldown:email:{email}")
}

/// 鉴权接口 IP 限流键：`ratelimit:auth:{ip}`。
pub fn ratelimit_auth(ip: &str) -> String {
    format!("ratelimit:auth:{ip}")
}

/// WS 一次性建连票据键：`ws:ticket:{ticket}`（核销用 GETDEL）。
pub fn ws_ticket(ticket: &str) -> String {
    format!("ws:ticket:{ticket}")
}

/// 发送幂等键：`msg:idem:{conv_id}:{client_msg_id}`（值存 server_msg_id）。
pub fn msg_idem(conv_id: u64, client_msg_id: &str) -> String {
    format!("msg:idem:{conv_id}:{client_msg_id}")
}

/// 用户在线状态键：`presence:{uid}`（值 = node_id，30 秒续期）。
pub fn presence(uid: u64) -> String {
    format!("presence:{uid}")
}

/// 用户连接计数键：`presence:conns:{uid}`（网关 INCR/DECR，0→1/1→0 触发 PresenceEvent）。
pub fn presence_conns(uid: u64) -> String {
    format!("presence:conns:{uid}")
}
