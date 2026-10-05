//! JWT 签发与校验（HS256，jsonwebtoken 9）。
//!
//! 载荷约定（计划书 6.1）：
//! - `sub`：uid 字符串；
//! - `jti`：本令牌唯一 ID（refresh 轮换与盗用检测的依据）；
//! - `fam`：refresh 轮换族 ID（access 与 refresh 同族，便于追溯）；
//! - `typ`：access / refresh（防止两类令牌混用）；
//! - `iat` / `exp`：签发与过期时间（秒级 Unix 时间戳）。
//!
//! access 令牌无状态校验（只验签名与过期，不查 Redis）；
//! refresh 令牌的存活状态存 Redis（[`super::refresh_store`]）。
//! 签名密钥统一取自 `Config.jwt_secret`（启动期 fail-fast 校验必填）。

use im_common::error::AppError;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

/// JWT 载荷（自定义字段名压缩以减小令牌体积：fam=family_id、typ=token_type）。
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// 用户 ID（uid 字符串）
    pub sub: String,
    /// 本令牌唯一 ID（refresh 轮换/盗用检测依据）
    pub jti: String,
    /// refresh 轮换族 ID
    pub fam: String,
    /// 令牌类型：access / refresh
    pub typ: String,
    /// 签发时间（Unix 秒）
    pub iat: i64,
    /// 过期时间（Unix 秒）
    pub exp: i64,
}

/// access 令牌类型常量。
pub const TYPE_ACCESS: &str = "access";
/// refresh 令牌类型常量。
pub const TYPE_REFRESH: &str = "refresh";

/// 签发一枚 JWT。
///
/// # 参数
/// - `secret`：HS256 签名密钥（来自配置）；
/// - `uid`：用户 ID；`family_id`：轮换族；`typ`：access/refresh；`ttl_seconds`：有效期。
fn sign_token(
    secret: &str,
    uid: u64,
    family_id: &str,
    typ: &str,
    ttl_seconds: u64,
) -> Result<String, AppError> {
    let now = chrono::Utc::now().timestamp();
    let claims = Claims {
        sub: uid.to_string(),
        jti: uuid::Uuid::new_v4().to_string(),
        fam: family_id.to_string(),
        typ: typ.to_string(),
        iat: now,
        exp: now + ttl_seconds as i64,
    };
    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| {
        tracing::error!("JWT 签发失败: {e}");
        AppError::internal()
    })
}

/// 签发 access 令牌（默认 2h，`ACCESS_TOKEN_TTL_SECONDS`）。
pub fn sign_access(
    secret: &str,
    uid: u64,
    family_id: &str,
    ttl_seconds: u64,
) -> Result<String, AppError> {
    sign_token(secret, uid, family_id, TYPE_ACCESS, ttl_seconds)
}

/// 签发 refresh 令牌（登录场景；默认 30d，`REFRESH_TOKEN_TTL_SECONDS`）。
#[allow(dead_code)]
pub fn sign_refresh(
    secret: &str,
    uid: u64,
    family_id: &str,
    ttl_seconds: u64,
) -> Result<String, AppError> {
    sign_token(secret, uid, family_id, TYPE_REFRESH, ttl_seconds)
}

/// 以指定 jti 签发 refresh 令牌（轮换时 jti 已在 Redis 登记，须与载荷一致）。
pub fn sign_refresh_with_jti(
    secret: &str,
    uid: u64,
    family_id: &str,
    jti: &str,
    ttl_seconds: u64,
) -> Result<String, AppError> {
    let now = chrono::Utc::now().timestamp();
    let claims = Claims {
        sub: uid.to_string(),
        jti: jti.to_string(),
        fam: family_id.to_string(),
        typ: TYPE_REFRESH.to_string(),
        iat: now,
        exp: now + ttl_seconds as i64,
    };
    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| {
        tracing::error!("JWT 签发失败: {e}");
        AppError::internal()
    })
}

/// 校验 JWT 并要求指定令牌类型（access / refresh 不可混用）。
///
/// # 错误
/// - 过期 → 1002（客户端据此走刷新/重新登录流程）；
/// - 签名非法、载荷缺失、类型不符 → 1001。
pub fn verify(token: &str, secret: &str, expected_typ: &str) -> Result<Claims, AppError> {
    let mut validation = Validation::new(Algorithm::HS256);
    // 自定义字段必须存在（sub/jti/fam/typ），exp 默认强制校验
    validation.required_spec_claims = ["exp", "sub", "jti", "fam", "typ"]
        .into_iter()
        .map(|s| s.to_string())
        .collect();
    // 轻微时钟偏差容忍 30 秒
    validation.leeway = 30;

    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map_err(|e| match e.kind() {
        jsonwebtoken::errors::ErrorKind::ExpiredSignature => AppError::token_expired(),
        _ => AppError::unauthorized(),
    })?;

    if data.claims.typ != expected_typ {
        return Err(AppError::unauthorized());
    }
    Ok(data.claims)
}
