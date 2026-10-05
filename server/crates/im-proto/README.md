# im-proto —— 契约 crate

Iris 唯一 Protobuf 契约所在 crate（被依赖，不独立运行）。

## 包与文件划分

- 包名 `iris.v1`，单一源文件 `proto/iris.proto`（一期规模不需要拆分）；
- 文件分三段：
  1. WebSocket 统一信封 `Frame`/`FrameType`/`MsgType`（计划书 5.1）；
  2. C2S 业务 payload：`MessageSendReq`、`ConvSyncReq/Resp`、`ConvReadReq` 及各下行 NOTICE；
  3. S2S 双向流：`service GatewayLink`、`Upstream`（NodeHello/ClientMsg/PresenceEvent）、
     `Downstream`（Push/ForceKick）。

## 如何重新生成代码

- **Rust**：无需手工步骤，`cargo build` 时 `build.rs` 自动生成到 `OUT_DIR`
  （protoc 由 `protoc-bin-vendored` 自带，本机无需安装 protoc）；
- **TypeScript**（W3 桌面端建立后）：在 `desktop/` 目录执行 `pnpm proto`，
  ts-proto 读取 `../server/crates/im-proto/proto/iris.proto` 生成到 `desktop/proto/`。

## 字段演进规则

1. **只加不删**：删除/改名会破坏两端兼容；废弃字段注释标记 `// deprecated` 并保留；
2. **编号永不复用**：新字段一律取最大编号 +1；
3. 枚举值只追加在末尾；proto3 枚举首值固定为 0 占位；
4. 契约变更必须同步：本 README、计划书 5 章、desktop 侧重新生成并跑互通检查。

## 生成物目录

Rust 生成物在 `target/.../out/iris.v1.rs`（由 `src/lib.rs` 的
`tonic::include_proto!` 引入），**禁止手改**；本 crate 手写代码仅 `build.rs`
与 `src/lib.rs` 两个文件。
