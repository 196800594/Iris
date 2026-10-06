//! REST 服务（7200，前缀 /api/v1）。
//!
//! 路由段：/healthz（健康检查）+ /api/v1（auth / users，W3 起继续挂 contacts 等）。
//! 每个请求经 request_id 中间件（x-request-id 响应头 + 日志 span 关联）。

use std::net::SocketAddr;
use std::sync::Arc;

use axum::extract::State;
use axum::http::{HeaderValue, Method};
use axum::routing::get;
use axum::{Json, Router};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use crate::AppState;

/// /api/v1 业务路由集合（auth/users/contacts/conversations/groups/files）。
fn api_routes(state: &Arc<AppState>) -> Router<Arc<AppState>> {
    // multipart 上传 body 上限 = 普通文件上限 + 1MiB 表单边界开销（计划书 6.7）
    let upload_limit = state.cfg.file_max_bytes + crate::files::MULTIPART_HEADROOM;
    crate::auth::router()
        .merge(crate::users::router())
        .merge(crate::contacts::router())
        .merge(crate::conversations::router())
        .merge(crate::groups::router())
        .merge(crate::files::router(upload_limit))
}

/// 组装 REST 路由。
///
/// - `/healthz`：健康检查（无需鉴权，返回 DB/Redis 连通状态）；
/// - `/api/v1/...`：业务接口（auth 公开、users 需 Bearer access）；
/// - CORS：development 放开 `*`；production 按 `CORS_ORIGINS` 白名单收敛（计划书 6.7）；
/// - Trace + request_id：每请求一行 tracing 日志与 x-request-id 响应头。
pub fn build_router(state: Arc<AppState>) -> Router {
    let cors = build_cors(&state.cfg.cors_origins, state.cfg.is_dev());

    Router::new()
        .route("/healthz", get(healthz))
        .nest("/api/v1", api_routes(&state))
        .with_state(state)
        // request_id 先于 trace 执行（Layer 后加的先执行），保证 span 带 rid
        .layer(axum::middleware::from_fn(crate::middleware::request_id))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
}

/// REST 服务主循环：监听 `LOGIC_HTTP_ADDR`，优雅停机。
///
/// 使用 `into_make_service_with_connect_info` 注入对端地址，
/// 供鉴权接口 IP 限流（auth::extract_ip 的兜底来源）。
pub async fn serve(state: Arc<AppState>) -> std::io::Result<()> {
    let addr = state.cfg.logic_http_addr.clone();
    let app = build_router(state);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(crate::shutdown_signal())
    .await
}

/// 健康检查：DB 执行 `SELECT 1`、Redis 执行 `PING`，任一失败返回 503。
///
/// 容器 HEALTHCHECK（compose）与部署探活都依赖本接口。
async fn healthz(State(state): State<Arc<AppState>>) -> impl axum::response::IntoResponse {
    // DB 连通性
    let db_ok = sqlx::query("SELECT 1").execute(&state.pool).await.is_ok();
    // Redis 连通性
    let mut redis = state.redis.clone();
    let redis_ok: bool = redis::cmd("PING")
        .query_async::<String>(&mut redis)
        .await
        .is_ok();

    let status = if db_ok && redis_ok { "ok" } else { "degraded" };
    tracing::debug!(db_ok, redis_ok, "healthz");
    (
        if db_ok && redis_ok {
            axum::http::StatusCode::OK
        } else {
            axum::http::StatusCode::SERVICE_UNAVAILABLE
        },
        Json(serde_json::json!({
            "status": status,
            "service": "im-logic",
            "version": env!("CARGO_PKG_VERSION"),
            "db": db_ok,
            "redis": redis_ok,
        })),
    )
}

/// 构建 CORS 层：development 放开全部来源；production 解析白名单。
fn build_cors(cors_origins: &str, is_dev: bool) -> CorsLayer {
    if is_dev || cors_origins.trim() == "*" {
        // 开发模式：放开（仅本机调试用，生产严禁）
        CorsLayer::permissive()
    } else {
        // 生产：逗号分隔白名单
        let origins: Vec<HeaderValue> = cors_origins
            .split(',')
            .filter_map(|s| s.trim().parse().ok())
            .collect();
        let mut layer = CorsLayer::new().allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::PUT,
            Method::DELETE,
        ]);
        if origins.is_empty() {
            tracing::warn!("CORS_ORIGINS 白名单为空，生产环境将拒绝所有跨域请求");
        } else {
            layer = layer.allow_origin(origins);
        }
        layer
    }
}
