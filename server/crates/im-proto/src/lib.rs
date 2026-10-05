//! # im-proto —— Iris 唯一 Protobuf 契约 crate
//!
//! 职责与边界：
//! - 持有唯一契约源 `proto/iris.proto`，构建期生成 Rust 代码（prost 消息 + tonic 客户端/服务端）；
//! - TS 代码由 desktop 侧 `pnpm proto`（ts-proto）从**同一份** proto 生成，两端禁止私改契约；
//! - 本 crate 不含任何业务逻辑，生成的结构体仅供 im-gateway / im-logic 编解码使用。
//!
//! 生成物位于 `OUT_DIR`（target 目录），禁止手改；重新构建即自动重新生成。

// tonic 生成的服务端/客户端方法签名固定为 `Result<_, tonic::Status>`，
// 而 Status 结构体体积（~176B）超过 clippy 默认阈值（128B），属生成代码的固有形态，
// 无法在生成物内修改，故在 crate 级豁免该 lint（仅本 crate 生效）。
#![allow(clippy::result_large_err)]

/// prost/tonic 生成代码所在目录（build.rs 输出）
pub const PACKAGE: &str = "iris.v1";

// 引入 build.rs 生成的全部类型与服务
tonic::include_proto!("iris.v1");

/// 生成代码的模块公开导出：Frame/FrameType/MsgType 与全部 payload、
/// gateway_link_client（gateway 用）/ gateway_link_server（logic 用）。
pub use self::gateway_link_client::GatewayLinkClient;
pub use self::gateway_link_server::GatewayLinkServer;
