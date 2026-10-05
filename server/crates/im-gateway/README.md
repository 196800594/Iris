# im-gateway —— WebSocket 网关

Iris 客户端长连接持有者。**无状态、不碰业务库（不连 MySQL）**。

## 职责边界

| 做 | 不做 |
|---|---|
| WS 接入与 ticket 一次性核销（GETDEL） | 任何业务校验（好友/成员/幂等都在 logic） |
| 协议层 Ping/Pong 心跳、90s 静默断开 | 落库、发邮件、生成 JWT |
| 单帧 1 MiB 上限、单连接限流（120 帧/分） | 消息定序（seq 全部由 logic 分配） |
| REQUEST 帧 gRPC 转发 logic、下行帧路由 | 查 MySQL（无任何 SQL 依赖） |

## WS 接入与 ticket 流程

```
客户端 ── POST /api/v1/ws/ticket（Bearer access，logic 颁发 30s 一次性 ticket）
客户端 ── GET /ws?ticket=xxx
gateway ── GETDEL ws:ticket:{t} → 取出 uid
   失败：握手升级阶段返回 HTTP 401（连接不建立）
   成功：绑定 uid/conn_id → presence:{uid} = node_id（120s TTL，30s 续期）
```

- 心跳：客户端 30s 发协议层 Ping，axum 自动回 Pong；90s 无任何帧断开；
- 强制下线：logic 下发 `ForceKick` → 本节点该 uid 全部连接收 Close(4001)；
- 单帧超 1 MiB / 限流超限：分别以 close 1009 / 1008 断开。

## 配置项（环境变量，详见 server/.env.example）

`GATEWAY_WS_ADDR`（默认 0.0.0.0:7100）、`LOGIC_GRPC_ENDPOINT`、`GATEWAY_NODE_ID`
（多实例必须互不相同，留空取主机名）、`REDIS_URL`、`WS_HEARTBEAT_TIMEOUT_SECONDS`、
`WS_RATE_LIMIT_PER_MINUTE`、`WS_MAX_FRAME_BYTES`、`RUST_LOG`、`LOG_FORMAT`、`APP_ENV`。

## 启动与健康检查

```powershell
# 在 server/ 目录（需先起好 mysql/redis 与 im-logic）
cargo run -p im-gateway
# 健康检查（容器 HEALTHCHECK 用同一机制）
./target/debug/im-gateway healthcheck
curl http://127.0.0.1:7100/healthz   # {"status":"ok","service":"im-gateway",...}
```

启动成功标志：日志出现 `ws listening on 0.0.0.0:7100 node=...` 与
`gateway link connected node=...`。

## 与 logic 的 gRPC 链路排错

| 现象 | 排查 |
|---|---|
| `connect logic failed` | logic 未启动 / `LOGIC_GRPC_ENDPOINT` 错（本机应为 http://127.0.0.1:7201） |
| 反复 `gateway link retry` | logic gRPC 端口 7201 未监听；防火墙；endpoints 写成 https |
| 连上但收不到 Push | 检查 `GATEWAY_NODE_ID` 是否与 Redis `presence:{uid}` 值一致 |
| 上行无 ack | gRPC 流断开期间帧被丢弃（日志 `upstream link down`），客户端 5s 重发兜底 |

断线重连为指数退避（1s→30s）；每次重连首帧重发 `NodeHello` 重新注册节点。
