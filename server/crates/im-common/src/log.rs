//! tracing 日志初始化（RUST_LOG 过滤 + text/json 双格式）。

use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{fmt, EnvFilter};

/// 初始化全局日志。
///
/// # 参数
/// - `rust_log`：EnvFilter 语法（如 `info`、`im_gateway=debug,info`）
/// - `log_format`：`text`（本机可读）/ `json`（生产采集）
pub fn init(rust_log: &str, log_format: &str) {
    let filter = EnvFilter::try_new(rust_log).unwrap_or_else(|_| EnvFilter::new("info"));

    match log_format {
        // 生产：JSON 结构化，便于容器日志采集
        "json" => {
            tracing_subscriber::registry()
                .with(filter)
                .with(fmt::layer().json())
                .init();
        }
        // 开发默认：紧凑文本
        _ => {
            tracing_subscriber::registry()
                .with(filter)
                .with(fmt::layer().compact())
                .init();
        }
    }
}
