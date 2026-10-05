//! 环境变量配置加载。
//!
//! 纪律（技术文档 9 节）：一切环境相关参数只能来自环境变量；代码不硬编码密码/地址/密钥。
//! 变量清单与逐行中文注释见 `server/.env.example`（三处必须同步：example、本结构体、compose）。
//!
//! 读取策略：二进制入口先 `dotenvy::dotenv()`（仅本机 cargo run 生效；
//! 容器内环境变量由 compose 注入，无 .env 文件时自动跳过），随后 `Config::from_env()`。
//! 注意：dotenvy 遇到无法解析的行会中止该行之后的全部加载，入口必须显式告警不能静默吞错。
//! 必填项缺失 → fail-fast panic（启动期尽早暴露配置错误）。

use std::env;

/// 服务端公共配置（gateway/logic 共用超集；各自只读取相关字段）。
#[derive(Debug, Clone)]
pub struct Config {
    // ---- 基础运行 ----
    /// 运行环境：development / production（验证码日志、CORS、万能验证码开关等行为差异）
    pub app_env: String,
    /// tracing 日志级别过滤（如 `info`、`im_gateway=debug,info`）
    pub rust_log: String,
    /// 日志格式：text / json
    pub log_format: String,

    // ---- 监听地址 ----
    /// im-logic REST 监听地址（默认 0.0.0.0:7200）
    pub logic_http_addr: String,
    /// im-logic gRPC 监听地址（默认 0.0.0.0:7201）
    pub logic_grpc_addr: String,
    /// im-gateway WebSocket 监听地址（默认 0.0.0.0:7100）
    pub gateway_ws_addr: String,
    /// gateway 回连 logic 的 gRPC endpoint（http://127.0.0.1:7201）
    pub logic_grpc_endpoint: String,
    /// 网关节点唯一标识；留空运行时取主机名
    pub gateway_node_id: String,
    /// logic 节点标识（雪花 machine-id 来源）；留空取主机名哈希
    pub logic_node_id: String,
    /// CORS 允许来源（逗号分隔；development 允许 *）
    pub cors_origins: String,

    // ---- MySQL ----
    /// MySQL 主机（本机 127.0.0.1 / 容器内 mysql）
    pub mysql_host: String,
    /// MySQL 端口
    pub mysql_port: u16,
    /// 库名（iris）
    pub mysql_database: String,
    /// 用户名（iris）
    pub mysql_user: String,
    /// 密码（秘密，仅环境变量）
    pub mysql_password: String,
    /// 连接池上限
    pub mysql_pool_max: u32,

    // ---- Redis ----
    /// Redis 连接 URL（redis://host:6379/0）
    pub redis_url: String,

    // ---- JWT / 鉴权（W2 使用） ----
    /// JWT HS256 签名密钥（≥32 字节）
    pub jwt_secret: String,
    /// access 令牌有效期（秒，默认 7200）
    pub access_token_ttl_seconds: u64,
    /// refresh 令牌有效期（秒，默认 30 天）
    pub refresh_token_ttl_seconds: u64,
    /// WS 一次性 ticket 有效期（秒，默认 30）
    pub ws_ticket_ttl_seconds: u64,
    /// 鉴权类接口每 IP 每分钟请求上限（登录/发码/注册/重置，默认 10）
    pub auth_rate_limit_per_minute: u32,

    // ---- WS 连接参数 ----
    /// WS 静默超时（秒，无任何帧即断开，默认 90）
    pub ws_heartbeat_timeout_seconds: u64,
    /// 单连接每分钟上行帧数上限（超限断开，默认 120）
    pub ws_rate_limit_per_minute: u32,
    /// 单帧最大字节数（默认 1 MiB）
    pub ws_max_frame_bytes: usize,

    // ---- 邮件 SMTP（W2 使用） ----
    /// 是否真实发信；false 时验证码打日志
    pub smtp_enabled: bool,
    /// SMTP 服务商地址（smtp.qq.com 等）
    pub smtp_host: String,
    /// SMTP 端口（465 隐式 TLS / 587 STARTTLS）
    pub smtp_port: u16,
    /// SMTP 账号（完整邮箱地址）
    pub smtp_user: String,
    /// SMTP 授权码（秘密）
    pub smtp_password: String,
    /// 发件人（`Iris <you@qq.com>`）
    pub smtp_from: String,
    /// 验证码有效期（秒，默认 300）
    pub email_code_ttl_seconds: u64,
    /// 同邮箱重发冷却（秒，默认 60）
    pub email_code_resend_cooldown_seconds: u64,
    /// 开发万能验证码（仅 development 生效；空=不启用）
    pub email_dev_code: String,

    // ---- 文件存储（W6 使用） ----
    /// 上传根目录（容器内 /data/uploads）
    pub storage_root: String,
    /// 对外基础 URL（拼签名下载地址）
    pub public_base_url: String,
    /// 签名 URL HMAC 密钥（秘密）
    pub signed_url_secret: String,
    /// 签名 URL 有效期（秒）
    pub signed_url_ttl_seconds: u64,
    /// 图片大小上限（字节）
    pub image_max_bytes: usize,
    /// 普通文件大小上限（字节）
    pub file_max_bytes: usize,
}

impl Config {
    /// 从环境变量加载全部配置；必填缺失时 panic（启动 fail-fast）。
    ///
    /// # Panics
    /// 必填变量缺失或格式非法时 panic，错误信息含变量名，便于排障。
    pub fn from_env() -> Self {
        Self {
            // ---- 基础运行 ----
            app_env: req("APP_ENV"),
            rust_log: opt("RUST_LOG").unwrap_or_else(|| "info".into()),
            log_format: opt("LOG_FORMAT").unwrap_or_else(|| "text".into()),

            // ---- 监听地址 ----
            logic_http_addr: req("LOGIC_HTTP_ADDR"),
            logic_grpc_addr: req("LOGIC_GRPC_ADDR"),
            gateway_ws_addr: req("GATEWAY_WS_ADDR"),
            logic_grpc_endpoint: req("LOGIC_GRPC_ENDPOINT"),
            gateway_node_id: opt("GATEWAY_NODE_ID").unwrap_or_default(),
            logic_node_id: opt("LOGIC_NODE_ID").unwrap_or_default(),
            cors_origins: opt("CORS_ORIGINS").unwrap_or_else(|| "*".into()),

            // ---- MySQL ----
            mysql_host: req("MYSQL_HOST"),
            mysql_port: parse_req("MYSQL_PORT"),
            mysql_database: req("MYSQL_DATABASE"),
            mysql_user: req("MYSQL_USER"),
            mysql_password: req("MYSQL_PASSWORD"),
            mysql_pool_max: opt("MYSQL_POOL_MAX")
                .map(|v| v.parse().expect("MYSQL_POOL_MAX 必须是数字"))
                .unwrap_or(10),

            // ---- Redis ----
            redis_url: req("REDIS_URL"),

            // ---- JWT / 鉴权 ----
            jwt_secret: req("JWT_SECRET"),
            access_token_ttl_seconds: opt("ACCESS_TOKEN_TTL_SECONDS")
                .map(|v| v.parse().expect("ACCESS_TOKEN_TTL_SECONDS 必须是数字"))
                .unwrap_or(7200),
            refresh_token_ttl_seconds: opt("REFRESH_TOKEN_TTL_SECONDS")
                .map(|v| v.parse().expect("REFRESH_TOKEN_TTL_SECONDS 必须是数字"))
                .unwrap_or(2_592_000),
            ws_ticket_ttl_seconds: opt("WS_TICKET_TTL_SECONDS")
                .map(|v| v.parse().expect("WS_TICKET_TTL_SECONDS 必须是数字"))
                .unwrap_or(30),
            auth_rate_limit_per_minute: opt("AUTH_RATE_LIMIT_PER_MINUTE")
                .map(|v| v.parse().expect("AUTH_RATE_LIMIT_PER_MINUTE 必须是数字"))
                .unwrap_or(10),

            // ---- WS 连接参数 ----
            ws_heartbeat_timeout_seconds: opt("WS_HEARTBEAT_TIMEOUT_SECONDS")
                .map(|v| v.parse().expect("WS_HEARTBEAT_TIMEOUT_SECONDS 必须是数字"))
                .unwrap_or(90),
            ws_rate_limit_per_minute: opt("WS_RATE_LIMIT_PER_MINUTE")
                .map(|v| v.parse().expect("WS_RATE_LIMIT_PER_MINUTE 必须是数字"))
                .unwrap_or(120),
            ws_max_frame_bytes: opt("WS_MAX_FRAME_BYTES")
                .map(|v| v.parse().expect("WS_MAX_FRAME_BYTES 必须是数字"))
                .unwrap_or(1_048_576),

            // ---- 邮件 SMTP ----
            smtp_enabled: opt("SMTP_ENABLED")
                .map(|v| v == "true" || v == "1")
                .unwrap_or(false),
            smtp_host: opt("SMTP_HOST").unwrap_or_default(),
            smtp_port: opt("SMTP_PORT")
                .map(|v| v.parse().expect("SMTP_PORT 必须是数字"))
                .unwrap_or(465),
            smtp_user: opt("SMTP_USER").unwrap_or_default(),
            smtp_password: opt("SMTP_PASSWORD").unwrap_or_default(),
            smtp_from: opt("SMTP_FROM").unwrap_or_default(),
            email_code_ttl_seconds: opt("EMAIL_CODE_TTL_SECONDS")
                .map(|v| v.parse().expect("EMAIL_CODE_TTL_SECONDS 必须是数字"))
                .unwrap_or(300),
            email_code_resend_cooldown_seconds: opt("EMAIL_CODE_RESEND_COOLDOWN_SECONDS")
                .map(|v| {
                    v.parse()
                        .expect("EMAIL_CODE_RESEND_COOLDOWN_SECONDS 必须是数字")
                })
                .unwrap_or(60),
            email_dev_code: opt("EMAIL_DEV_CODE").unwrap_or_default(),

            // ---- 文件存储 ----
            storage_root: opt("STORAGE_ROOT").unwrap_or_else(|| "./data/uploads".into()),
            public_base_url: opt("PUBLIC_BASE_URL").unwrap_or_default(),
            signed_url_secret: req("SIGNED_URL_SECRET"),
            signed_url_ttl_seconds: opt("SIGNED_URL_TTL_SECONDS")
                .map(|v| v.parse().expect("SIGNED_URL_TTL_SECONDS 必须是数字"))
                .unwrap_or(300),
            image_max_bytes: opt("IMAGE_MAX_BYTES")
                .map(|v| v.parse().expect("IMAGE_MAX_BYTES 必须是数字"))
                .unwrap_or(20 * 1024 * 1024),
            file_max_bytes: opt("FILE_MAX_BYTES")
                .map(|v| v.parse().expect("FILE_MAX_BYTES 必须是数字"))
                .unwrap_or(100 * 1024 * 1024),
        }
    }

    /// 拼装 MySQL 连接串（应用统一从这里取，各处不再自行拼接）。
    pub fn mysql_url(&self) -> String {
        format!(
            "mysql://{}:{}@{}:{}/{}",
            self.mysql_user,
            self.mysql_password,
            self.mysql_host,
            self.mysql_port,
            self.mysql_database
        )
    }

    /// 是否开发环境（CORS 放开、验证码日志、万能验证码生效）。
    pub fn is_dev(&self) -> bool {
        self.app_env == "development"
    }
}

/// 读取必填变量，缺失时 panic（消息带变量名，启动期 fail-fast）。
fn req(key: &str) -> String {
    env::var(key).unwrap_or_else(|_| panic!("缺少必需环境变量 {key}（对照 .env.example 配置）"))
}

/// 读取可选变量（未设置返回 None）。
fn opt(key: &str) -> Option<String> {
    env::var(key).ok().filter(|v| !v.is_empty())
}

/// 读取必填数字变量。
fn parse_req<T: std::str::FromStr>(key: &str) -> T {
    req(key)
        .parse()
        .unwrap_or_else(|_| panic!("环境变量 {key} 格式非法"))
}
