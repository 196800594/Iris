# Iris 即时通讯系统

Iris 是一个面向毕业设计的类微信即时通讯系统：Rust 微服务端 + Tauri 桌面端，
一期覆盖账号、好友、单聊、群聊、图片/文件五大能力。

## 架构总览

```
桌面端(Tauri) ──WS 7100──► im-gateway ──gRPC 双向流 7201──► im-logic ──► MySQL 8.4 / Redis 7.4
桌面端(Tauri) ──REST 7200────────────────────────────────► im-logic
                    （生产边缘可选 Caddy 2.8 反代 + TLS，开发模式不使用）
```

| 组件 | 职责 |
|---|---|
| `im-gateway` | 持有客户端长连接：ticket 鉴权、心跳、限流、转发；不碰业务库 |
| `im-logic` | 全部业务逻辑：auth/contacts/groups/message/sync/files，自动执行数据库迁移 |
| `im-proto` | 唯一 Protobuf 契约，构建期生成 Rust 与 TS 代码 |
| `im-common` | 配置加载、错误类型、雪花 ID、日志、Redis 键等公共能力 |
| `desktop`（W3 起） | Tauri 2 + React 18 + TypeScript 5 桌面客户端，交付 Windows MSI |

## 目录导航

```
Iris/
├── server/          # 服务端 Cargo workspace（4 个 crate + 迁移 + compose + 部署）
│   ├── crates/      # im-proto / im-common / im-gateway / im-logic
│   ├── migrations/  # sqlx 迁移脚本（logic 启动自动执行）
│   ├── seeds/       # 演示种子 SQL（仅手工导入，禁止放 migrations/）
│   └── deploy/      # Dockerfile / Caddyfile / 备份脚本
└── desktop/         # 桌面端（W3 初始化）
```

## 快速开始（服务端）

```powershell
cd server
Copy-Item .env.example .env                                   # 1) 准备配置
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mysql redis   # 2) 起基础设施
cargo run -p im-logic                                         # 3) 起逻辑服务（自动建表）
cargo run -p im-gateway                                       #    起网关（新终端）
```

完整说明见 [server/README.md](server/README.md)；环境变量逐行注释见
`server/.env.example`；开发/部署细节见 `plan/` 下两份设计文档。

## 文档索引

| 文档 | 内容 |
|---|---|
| [../plan/即时通讯系统-项目计划书.md](../plan/即时通讯系统-项目计划书.md) | 一期范围、协议设计、核心流程、数据库设计、16 周里程碑 |
| [../plan/微服务技术说明文档.md](../plan/微服务技术说明文档.md) | 版本基线、服务详解、REST 接口清单、`.env` 模板、部署手册 |

## 开发环境要求

- Rust（版本由 `server/rust-toolchain.toml` 固定，无需单独安装 protoc）
- Docker Desktop（MySQL/Redis 与全栈容器）
- Node 20 LTS + pnpm 9（W3 起桌面端需要）
- Windows 10/11（桌面端打包 MSI）
