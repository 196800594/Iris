//! # im-logic —— Iris 业务逻辑服务
//!
//! 职责边界（技术文档 5.1）：承担全部业务逻辑——auth / users / contacts /
//! conversations / groups / message / sync / presence / files。
//!
//! 启动引导（顺序不可颠倒）：
//! 1. `healthcheck` 子命令 → 自检 REST 端口 TCP 可连（容器 HEALTHCHECK 用）；
//! 2. 加载配置 → 初始化日志 → 初始化雪花 ID（`LOGIC_NODE_ID`）；
//! 3. 建 MySQL 连接池 → **自动执行 sqlx 迁移**（唯一迁移方式，技术文档 5.6，fail-fast）；
//! 4. 建 Redis 连接；
//! 5. 并发启动 REST(7200) 与 gRPC(7201)，优雅停机。
//!
//! W1 骨架范围：迁移 + 健康检查 + GatewayLink 双向流（ClientMsg 回 5000 占位响应）；
//! auth 等业务模块 W2 起逐周填充（见计划书 13 章里程碑）。

mod grpc;
mod http;

use std::sync::Arc;
use std::time::Duration;

use im_common::config::Config;
use sqlx::mysql::MySqlPoolOptions;

/// logic 全局共享状态：配置、MySQL 池、Redis 连接、网关节点注册表。
pub struct AppState {
    /// 环境变量配置
    pub cfg: Config,
    /// MySQL 连接池（业务库唯一入口）
    pub pool: sqlx::MySqlPool,
    /// Redis 多路复用连接
    pub redis: redis::aio::MultiplexedConnection,
    /// 在线网关节点注册表：node_id → 下行发送通道（流即注册，流断即摘除）
    pub nodes: grpc::NodeRegistry,
}

#[tokio::main]
async fn main() {
    // healthcheck 子命令：容器 HEALTHCHECK 自检 REST 端口 TCP 可达
    let mut args = std::env::args().skip(1);
    if args.next().as_deref() == Some("healthcheck") {
        std::process::exit(healthcheck());
    }

    // 仅本机 cargo run 时读取 .env；容器内由 compose env_file 注入（无 .env 自动跳过）
    dotenvy::dotenv().ok();
    let cfg = Config::from_env();
    im_common::log::init(&cfg.rust_log, &cfg.log_format);
    im_common::id::init(&cfg.logic_node_id);

    // ---- MySQL 池 + 自动迁移（先建表后开端口，fail-fast） ----
    let pool = MySqlPoolOptions::new()
        .max_connections(cfg.mysql_pool_max)
        .acquire_timeout(Duration::from_secs(10))
        .connect(&cfg.mysql_url())
        .await
        .unwrap_or_else(|e| panic!("MySQL 连接失败（{}）: {e}", cfg.mysql_url()));
    run_migrations(&pool).await;

    // ---- Redis ----
    let redis_client = redis::Client::open(cfg.redis_url.as_str()).expect("REDIS_URL 非法");
    let redis = redis_client
        .get_multiplexed_tokio_connection()
        .await
        .expect("Redis 连接失败");

    let state = Arc::new(AppState {
        cfg,
        pool,
        redis,
        nodes: grpc::NodeRegistry::new(),
    });

    // ---- 并发启动 gRPC(7201) 与 REST(7200) ----
    let grpc_task = tokio::spawn(grpc::serve(state.clone()));
    let http_task = tokio::spawn(http::serve(state.clone()));

    tracing::info!(
        "im-logic started: rest={} grpc={}",
        state.cfg.logic_http_addr,
        state.cfg.logic_grpc_addr
    );

    // 任一服务退出即整体退出（fail-fast：正常退出/异常退出都触发进程终止，由容器重启兜底）
    tokio::select! {
        r = grpc_task => r.expect("grpc 任务 panic").expect("gRPC 服务异常退出"),
        r = http_task => r.expect("http 任务 panic").expect("REST 服务异常退出"),
    }
}

/// 执行 sqlx 内置迁移（唯一迁移方式，技术文档 5.6）。
///
/// - 路径相对本 crate 根（`server/crates/im-logic/`）：`../../migrations` = `server/migrations/`；
/// - 迁移脚本编译进二进制，生产容器内无需携带 migrations 目录；
/// - `_sqlx_migrations` 表记录版本 + checksum；失败即 panic（fail-fast，不健康实例不上线）。
async fn run_migrations(pool: &sqlx::MySqlPool) {
    // migrator 由 migrate! 宏编译期嵌入（脚本内容进二进制，容器无需带 migrations 目录）
    let migrator = sqlx::migrate!("../../migrations");
    match migrator.run(pool).await {
        // 首次启动全量建表 / 后续增量应用 / 全部已应用（正常重启）均属成功
        Ok(()) => tracing::info!(
            "迁移完成：共 {} 个迁移脚本已同步",
            migrator.migrations.len()
        ),
        Err(e) => panic!("数据库迁移失败，进程退出：{e}"),
    }
}

/// healthcheck 子命令：TCP 连通 REST 监听端口；0=健康 / 1=不可达。
fn healthcheck() -> i32 {
    let addr = std::env::var("LOGIC_HTTP_ADDR").unwrap_or_else(|_| "0.0.0.0:7200".into());
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
pub async fn shutdown_signal() {
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
