//! refresh 令牌族的 Redis 存储：签发、轮换、吊销、盗用检测（计划书 6.1）。
//!
//! 数据结构（im-common/redis_keys.rs）：
//! - `refresh:fam:{family_id}`（HASH）：`uid` 字段 = 属主；
//!   `jti:{jti}` 字段 = 令牌状态（active / rotated / revoked）；
//! - `refresh:user:{uid}`（SET）：该用户全部 family_id（重置密码时整族吊销用）。
//!
//! 轮换语义：refresh 时旧 jti 标记 `rotated` 并登记新 jti；
//! 若已 rotated/revoked 的 jti 再次出现 → 判定盗用 → 整族吊销 + ForceKick。
//! 已轮换记录不可删除，否则"复用旧令牌"无法被识别。

use redis::AsyncCommands;
use tracing::warn;

use crate::AppState;
use im_common::error::AppError;
use im_common::redis_keys;

/// 令牌族操作结果。
pub enum RotateOutcome {
    /// 正常轮换成功：new_jti 已登记为 active，调用方用它签发新 refresh 令牌
    Rotated {
        /// 属主 uid（与请求令牌一致）
        uid: u64,
        /// 轮换族 ID（沿用）
        family_id: String,
        /// 新登记的 jti（签发新 refresh 令牌时写入载荷）
        new_jti: String,
    },
    /// 检测到盗用（旧令牌被复用）：该族已整族吊销且已 ForceKick，调用方返回 1001
    Stolen,
}

/// 为刚登录的用户创建一个新的 refresh 族（写入属主并加入用户集合）。
pub async fn issue_family(state: &AppState, uid: u64) -> Result<String, AppError> {
    let family_id = uuid::Uuid::new_v4().to_string();
    let fam_key = redis_keys::refresh_family(&family_id);
    let user_key = redis_keys::refresh_user(uid);
    let ttl = state.cfg.refresh_token_ttl_seconds as i64;

    let mut redis = state.redis.clone();
    let _: Result<(), _> = redis
        .hset::<_, _, _, ()>(&fam_key, redis_keys::REFRESH_FIELD_UID, uid.to_string())
        .await;
    let _: Result<(), _> = redis.expire(&fam_key, ttl).await;
    let _: Result<(), _> = redis.sadd::<_, _, ()>(&user_key, &family_id).await;
    let _: Result<(), _> = redis.expire(&user_key, ttl).await;
    Ok(family_id)
}

/// 在指定族内登记一枚新 refresh jti（active）；`prev_jti` 非空时将其标记为 rotated。
async fn register_jti(
    state: &AppState,
    family_id: &str,
    prev_jti: Option<&str>,
    new_jti: &str,
    uid: u64,
) -> Result<(), AppError> {
    let fam_key = redis_keys::refresh_family(family_id);
    let ttl = state.cfg.refresh_token_ttl_seconds as i64;
    let mut redis = state.redis.clone();

    // 新 jti 入册；旧 jti 标记 rotated（保留记录用于盗用检测，不可删除）
    let _: Result<(), _> = redis
        .hset::<_, _, _, ()>(
            &fam_key,
            format!("jti:{new_jti}"),
            redis_keys::REFRESH_STATE_ACTIVE,
        )
        .await;
    if let Some(prev) = prev_jti {
        let _: Result<(), _> = redis
            .hset::<_, _, _, ()>(
                &fam_key,
                format!("jti:{prev}"),
                redis_keys::REFRESH_STATE_ROTATED,
            )
            .await;
    }
    // 双键续期：族与用户集合随最新令牌续命（滑动窗口）
    let _: Result<(), _> = redis.expire(&fam_key, ttl).await;
    let _: Result<(), _> = redis.expire(redis_keys::refresh_user(uid), ttl).await;
    Ok(())
}

/// 登录场景：为新族登记首枚 jti（无旧令牌可轮换）。
pub async fn register_login_jti(
    state: &AppState,
    family_id: &str,
    new_jti: &str,
    uid: u64,
) -> Result<(), AppError> {
    register_jti(state, family_id, None, new_jti, uid).await
}

/// refresh 轮换入口：校验 jti 存活状态并完成轮换登记。
///
/// # 错误
/// - 族不存在 / jti 未知 → 1001（令牌已被吊销或过期清除，需重新登录）；
/// - Redis 故障 → 5000。
pub async fn rotate(
    state: &AppState,
    uid: u64,
    family_id: &str,
    jti: &str,
) -> Result<RotateOutcome, AppError> {
    let fam_key = redis_keys::refresh_family(family_id);
    let mut redis = state.redis.clone();

    let field = format!("jti:{jti}");
    let status: Option<String> = redis.hget(&fam_key, &field).await.map_err(|e| {
        tracing::error!("refresh 族读取 Redis 错误: {e}");
        AppError::internal()
    })?;

    match status.as_deref() {
        // 在用 → 正常轮换：生成并登记新 jti
        Some(s) if s == redis_keys::REFRESH_STATE_ACTIVE => {
            let new_jti = uuid::Uuid::new_v4().to_string();
            register_jti(state, family_id, Some(jti), &new_jti, uid).await?;
            Ok(RotateOutcome::Rotated {
                uid,
                family_id: family_id.to_string(),
                new_jti,
            })
        }
        // 已轮换/已吊销的令牌再次出现 → 盗用：整族吊销 + 强制下线（计划书 5.4）
        Some(s)
            if s == redis_keys::REFRESH_STATE_ROTATED || s == redis_keys::REFRESH_STATE_REVOKED =>
        {
            warn!(
                uid,
                family_id, "refresh token reuse detected, revoking family"
            );
            revoke_family(state, family_id).await;
            crate::force_kick(state, uid, "登录状态异常，请重新登录").await;
            Ok(RotateOutcome::Stolen)
        }
        // 族不存在（含 uid 字段都没了）或未知状态
        _ => Err(AppError::unauthorized()),
    }
}

/// 吊销一个 refresh 族（登出/盗用）：DEL 族 Hash + SREM 用户集合。幂等。
pub async fn revoke_family(state: &AppState, family_id: &str) {
    let fam_key = redis_keys::refresh_family(family_id);
    let mut redis = state.redis.clone();
    // 先取属主，便于同步清理用户集合
    let uid: Option<String> = match redis.hget(&fam_key, redis_keys::REFRESH_FIELD_UID).await {
        Ok(v) => v,
        Err(e) => {
            tracing::error!("refresh 族属主读取 Redis 错误: {e}");
            None
        }
    };
    let _: Result<(), _> = redis.del(&fam_key).await;
    if let Some(uid) = uid.and_then(|s| s.parse::<u64>().ok()) {
        let _: Result<(), _> = redis
            .srem::<_, _, ()>(redis_keys::refresh_user(uid), family_id)
            .await;
    }
}

/// 吊销某用户全部 refresh 族（重置密码后"其他设备强制重新登录"，计划书 6.1）。
///
/// 逐族删除；族数量 = 用户登录过的设备数（正常个位数），逐个 DEL 可接受。
pub async fn revoke_all_user(state: &AppState, uid: u64) {
    let user_key = redis_keys::refresh_user(uid);
    let mut redis = state.redis.clone();
    let families: Vec<String> = match redis.smembers(&user_key).await {
        Ok(v) => v,
        Err(e) => {
            tracing::error!("refresh 用户集合读取 Redis 错误: {e}");
            return;
        }
    };
    for family_id in families {
        let _: Result<(), _> = redis
            .del::<_, ()>(redis_keys::refresh_family(&family_id))
            .await;
    }
    let _: Result<(), _> = redis.del(&user_key).await;
}
