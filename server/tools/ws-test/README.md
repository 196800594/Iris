# ws-test —— Iris WS 联调测试工具

手工 protobuf 编解码的最小 WS 客户端，用于服务端消息管线（W4-5 起）的端到端联调。
独立 Cargo 项目（非 workspace 成员），不依赖 im-proto，保持轻量。

## 构建

```bash
cd server/tools/ws-test
cargo build --release
```

## 用法

先经 REST 拿一次性 ticket（30 秒有效）：

```bash
curl -X POST http://127.0.0.1:7200/api/v1/ws/ticket -H "Authorization: Bearer <access>"
```

然后（ticket 拼进 URL）：

```bash
# 被动收帧 N 秒（第二个客户端观察 push / conv.read / presence.change）
ws-test listen "ws://127.0.0.1:7100/ws?ticket=T" 15

# 发消息：conv=0 且带 --to 表示首次单聊（服务端懒建会话）
ws-test send "ws://..." --to <uid> --content "你好" [--conv <id>] [--client-msg <uuid>] [--type 1]

# 差量同步：拉取 seq > has_seq 的消息
ws-test sync "ws://..." --conv <id> --seq 0 [--batch 200]

# 上报已读水位
ws-test read "ws://..." --conv <id> --seq 5
```

## 输出示例

```
[recv] NOTICE id=0 method=message.ack code=0 msg=""
       ack: client_msg_id="test-xxx" server_msg_id=640... conv=640... seq=1 create_ms=...
[recv] NOTICE id=0 method=message.push code=0 msg=""
       msg: id=... conv=... sender=... type=1 seq=1 ...
       push-sender-nickname: "爱丽丝"
```
