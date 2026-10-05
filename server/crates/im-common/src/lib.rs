//! # im-common —— Iris 公共库
//!
//! 提供四个服务二进制共享的公共能力：
//! - [`config`]：环境变量配置加载（dotenvy 仅由二进制入口调用一次）；
//! - [`error`]：统一错误类型与 HTTP 状态映射（计划书 5.3）；
//! - [`id`]：sonyflake 雪花 ID 生成（LOGIC_NODE_ID 作为 machine-id 来源）；
//! - [`log`]：tracing 日志初始化（RUST_LOG / LOG_FORMAT）；
//! - [`redis_keys`]：全部 Redis 键的构造函数与 TTL 常量（键名格式唯一出处）。
//!
//! 边界约束：**不放业务逻辑、不连 MySQL、不持有业务状态**；
//! 其他 crate 通过 `im_common::xxx` 引用。

pub mod config;
pub mod error;
pub mod id;
pub mod log;
pub mod redis_keys;
