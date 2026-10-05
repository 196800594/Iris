# Iris 服务端（server/）

Rust 微服务端 Cargo workspace：**im-gateway**（WebSocket 网关）+ **im-logic**
（业务逻辑）两个二进制，共享 **im-proto**（契约）与 **im-common**（公共库）。

## 架构与端口

| 服务/组件 | 端口 | 说明 |
|---|---|---|
| im-gateway | 7100 (WS) | 客户端长连接；ticket 鉴权、心跳、转发；无状态 |
| im-logic | 7200 (REST) / 7201 (gRPC) | 全部业务 + `/healthz`；启动自动迁移 |
| MySQL 8.4 | 3306 | 持久化（开发期映射到宿主机 127.0.0.1） |
| Redis 7.4 | 6379 | 缓存/在线/幂等（AOF） |
| Caddy 2.8 | 80/443 | **仅生产**（profile=edge）；开发模式不使用 |

```
桌面端 ──WS 7100──► gateway ──gRPC 双向流 7201──► logic ──► mysql / redis
桌面端 ──REST 7200───────────────────────────────► logic
```

## 先决条件

- Docker Desktop（起 MySQL/Redis/全栈容器）
- Rust（`rust-toolchain.toml` 固定 1.85.0；protoc 由构建依赖自带，无需安装）
- PowerShell（Windows 开发环境）

## .env 配置

```powershell
Copy-Item .env.example .env   # 首次；逐行注释见该文件，变量总表见技术文档第 9 节
```

## 两种启动方式

### 方式一：基础设施容器 + 服务本机 cargo 跑（日常开发，推荐）

```powershell
# 1) 起基础设施——必须叠加 dev 覆盖文件，否则 3306/6379 不映射到宿主机
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mysql redis
# 2) 起逻辑服务（自动建表迁移）
cargo run -p im-logic
# 3) 起网关（新终端）
cargo run -p im-gateway
# 4) 自测
curl http://127.0.0.1:7200/healthz
curl http://127.0.0.1:7100/healthz
```

### 方式二：全容器 compose（贴近生产）

```powershell
docker compose up -d --build     # 不含 --profile edge，Caddy 不启动（开发模式不使用 Caddy）
docker compose ps                # 四个服务 healthy
docker compose logs -f logic gateway
```

## 数据库迁移（唯一方式：sqlx 内置迁移，见技术文档 5.6）

- **自动**：`cargo run -p im-logic` 启动时自动执行（生产同此，不手工跑 SQL）；
- **手动**（仅本机排错）：`cargo install sqlx-cli --no-default-features --features mysql,rustls`
  然后 `cargo sqlx migrate run --source migrations`；
- 纪律：`migrations/` up-only 只追加、旧脚本禁改；演示种子放 `seeds/`（永不自动执行）；
  `cargo sqlx prepare` 只是编译期校验（W2 起配合 `.sqlx/` 入库）。

## 常用命令

| 目的 | 命令 |
|---|---|
| 格式化 / Lint | `cargo fmt --all`；`cargo clippy --workspace -- -D warnings` |
| 全部测试 | `cargo test --workspace` |
| 重新生成 TS proto（W3 起） | `cd ../desktop; pnpm proto`（源在本 crate `im-proto/proto/`） |
| 全栈起停 | `docker compose up -d --build` / `docker compose down` |

## 排错

见技术文档 12 节排错表（容器连不上 MySQL 用服务名 `mysql`；本机 cargo 连不上
端口说明忘了叠 dev compose；种子不自动执行属正常）。启动失败先看
`logic` 日志中的迁移错误与 `panic` 信息。
