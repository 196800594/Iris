# im-logic —— 业务逻辑服务

Iris 全部业务逻辑所在：REST(7200) + gRPC(7201)，**启动时自动执行数据库迁移**。

## 端口与职责

| 端口 | 协议 | 内容 |
|---|---|---|
| 7200 | HTTP | `/api/v1/*` REST 接口（技术文档 5.2 清单）、`/healthz` 健康检查 |
| 7201 | gRPC | `GatewayLink/Open` 双向流（供 gateway 回连，节点注册 + 帧转发） |

数据依赖：MySQL（连接池 + 迁移）、Redis（验证码/ticket/幂等/presence）、上传卷（files）。

## 自动迁移行为（技术文档 5.6）

- 启动时 `sqlx::migrate!("../../migrations")` 自动执行（脚本编译进二进制）；
- 迁移未完成**不监听端口**（fail-fast）：连不上库或迁移失败进程直接退出；
- `_sqlx_migrations` 表记录版本 + checksum；多实例启动靠库级锁互斥；
- 生产环境**不手工跑 SQL**；`cargo sqlx migrate run` 仅本机排错用。

## 配置项

全部变量见 `server/.env.example`（逐行注释）。logic 专属：
`LOGIC_HTTP_ADDR`(0.0.0.0:7200)、`LOGIC_GRPC_ADDR`(0.0.0.0:7201)、
`LOGIC_NODE_ID`（雪花 machine-id；同机多实例必须显式互异）、
`MYSQL_*`、`REDIS_URL`、`JWT_*`、`SMTP_*`、`STORAGE_*` 等。

## 启动

```powershell
# 在 server/ 目录（先起 mysql/redis；开发模式需叠加 dev compose 暴露端口）
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mysql redis
cargo run -p im-logic
# 健康检查
curl http://127.0.0.1:7200/healthz   # {"status":"ok","db":true,"redis":true,...}
```

启动成功标志：日志出现 `迁移完成` 与 `im-logic started: rest=... grpc=...`。

## 接口文档索引

REST 全清单见技术文档 5.2 节；WS 方法集见计划书 5.2 节。
常见启动失败：端口占用（7200/7201）、`MYSQL_PASSWORD` 与容器初始化不一致
（改 compose 卷重建或改回密码）、迁移 checksum 不符（迁移脚本已被改动，禁止改旧脚本）。
