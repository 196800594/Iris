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
//! | presence:chg:{uid} | string | 10s | presence.change 推送限频（10 秒/人，防抖动风暴） |
//! | refresh:fam:{family_id} | hash | 30d | refresh 轮换族（uid + jti→状态），盗用检测依据 |
//! | refresh:user:{uid} | set | 30d | 用户全部 refresh 族（重置密码/登出时整族吊销） |

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

/// presence.change 推送限频键：`presence:chg:{接收者uid}`（SET NX EX 10，抢到才推）。
pub fn presence_chg_limited(receiver_uid: u64) -> String {
    format!("presence:chg:{receiver_uid}")
}

/// 用户连接计数键：`presence:conns:{uid}`（网关 INCR/DECR，0→1/1→0 触发 PresenceEvent）。
pub fn presence_conns(uid: u64) -> String {
    format!("presence:conns:{uid}")
}

/// refresh 轮换族键：`refresh:fam:{family_id}`。
///
/// Hash 结构：`uid` 字段存属主；`jti:{jti}` 字段存该令牌状态
/// （active 在用 / rotated 已被轮换 / revoked 已吊销）。
/// 已轮换/已吊销的 jti 必须保留记录（而非删除），否则无法识别"旧令牌被复用"的盗用行为。
pub fn refresh_family(family_id: &str) -> String {
    format!("refresh:fam:{family_id}")
}

/// 用户 refresh 族集合键：`refresh:user:{uid}`（成员为 family_id）。
pub fn refresh_user(uid: u64) -> String {
    format!("refresh:user:{uid}")
}

/// refresh 族 Hash 内的属主字段名。
pub const REFRESH_FIELD_UID: &str = "uid";
/// refresh 令牌状态：在用（可正常轮换）。
pub const REFRESH_STATE_ACTIVE: &str = "active";
/// refresh 令牌状态：已被轮换（再次使用即盗用）。
pub const REFRESH_STATE_ROTATED: &str = "rotated";
/// refresh 令牌状态：已吊销（再次使用即盗用）。
pub const REFRESH_STATE_REVOKED: &str = "revoked";
