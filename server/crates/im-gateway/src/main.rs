//! # im-gateway —— Iris WebSocket 网关
//!
//! 职责边界（技术文档 4.1）：持有客户端长连接，做 ticket 鉴权、心跳保活、
//! 单连接限流、帧转发与通知下发；**不连 MySQL、不做任何业务判断**。
//!
//! 启动流程：
//! 1. `healthcheck` 子命令 → 自检 WS 监听端口 TCP 可连（容器 HEALTHCHECK 用）；
//! 2. 加载配置 → 初始化日志；
//! 3. 连接 Redis（ticket 核销 / presence 键）；
//! 4. 建立 GatewayLink 双向流（`link::start_link`，断线指数退避重连）；
//! 5. 启动 axum WS 服务（`/ws?ticket=...` + `/healthz`），优雅停机。

mod hub;
mod link;
mod ws;

use std::sync::Arc;

use im_common::config::Config;
use redis::aio::MultiplexedConnection;

use crate::hub::Hub;

/// 全局共享状态：配置、Redis 连接、连接注册表、上行 gRPC 通道。
pub struct AppState {
    /// 环境变量配置
    pub cfg: Config,
    /// Redis 多路复用连接（ticket GETDEL / presence 写入）
    pub redis: MultiplexedConnection,
    /// 网关节点唯一标识（GATEWAY_NODE_ID，留空取主机名）
    pub node_id: String,
    /// 连接注册表与上行通道
    pub hub: Hub,
}

#[tokio::main]
async fn main() {
    // healthcheck 子命令：容器 HEALTHCHECK 自检监听端口 TCP 可达
    let mut args = std::env::args().skip(1);
    if args.next().as_deref() == Some("healthcheck") {
        std::process::exit(healthcheck());
    }

    // 仅本机 cargo run 时读取 .env；容器内由 compose 注入环境变量（无 .env 自动跳过）
    dotenvy::dotenv().ok();
    let cfg = Config::from_env();
    im_common::log::init(&cfg.rust_log, &cfg.log_format);

    // 网关节点标识：留空取主机名（多实例必须显式配置互不相同）
    let node_id = if cfg.gateway_node_id.is_empty() {
        std::env::var("COMPUTERNAME")
            .or_else(|_| std::env::var("HOSTNAME"))
            .unwrap_or_else(|_| "gateway-unknown".into())
    } else {
        cfg.gateway_node_id.clone()
    };

    // Redis：ticket 核销（GETDEL）与 presence 键写入
    let redis_client = redis::Client::open(cfg.redis_url.as_str()).expect("REDIS_URL 非法");
    let redis = redis_client
        .get_multiplexed_tokio_connection()
        .await
        .expect("Redis 连接失败");

    let state = Arc::new(AppState {
        cfg,
        redis,
        node_id,
        hub: Hub::new(),
    });

    // gRPC 双向流：与 logic 维持一条长流，断线指数退避重连（1→30s）
    tokio::spawn(link::start_link(state.clone()));

    // axum 路由：/ws 建连（ticket 鉴权） + /healthz 健康检查
    let app = axum::Router::new()
        .route("/ws", axum::routing::get(ws::ws_handler))
        .route("/healthz", axum::routing::get(healthz))
        .with_state(state.clone());

    let addr = state.cfg.gateway_ws_addr.clone();
    tracing::info!("ws listening on {addr} node={}", state.node_id);

    // 优雅停机：SIGTERM/ctrl_c 后 axum 停止接入新连接，在途请求排空后退出
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|e| panic!("绑定 {addr} 失败: {e}"));
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("axum serve 异常退出");
}

/// `/healthz`：网关自检（无状态服务只报活）。
async fn healthz() -> impl axum::response::IntoResponse {
    axum::Json(serde_json::json!({
        "status": "ok",
        "service": "im-gateway",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

/// healthcheck 子命令：TCP 连通 WS 监听端口；0=健康 / 1=不可达。
fn healthcheck() -> i32 {
    let addr = std::env::var("GATEWAY_WS_ADDR").unwrap_or_else(|_| "0.0.0.0:7100".into());
    // 0.0.0.0 不能作为拨号目标，替换为回环
    let target = addr.replacen("0.0.0.0", "127.0.0.1", 1);
    match std::net::TcpStream::connect(&target) {
        Ok(_) => {
            tracing::info!("healthcheck ok: {target}");
            0
        }
        Err(e) => {
            tracing::error!("healthcheck failed: {target}: {e}");
            1
        }
    }
}

/// 优雅停机信号：ctrl_c（Windows/开发）或 SIGTERM（Linux 容器）。
async fn shutdown_signal() {
    let ctrl_c = tokio::signal::ctrl_c();
    #[cfg(unix)]
    {
        let mut term = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("安装 SIGTERM 处理失败");
        tokio::select! {
            _ = ctrl_c => {},
            _ = term.recv() => {},
        }
    }
    #[cfg(not(unix))]
    {
        ctrl_c.await.expect("ctrl_c 监听失败");
    }
    tracing::info!("收到停机信号，开始优雅退出");
}
