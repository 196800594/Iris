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

## 文件模块（files，W13，计划书 6.7）

| 方法与路径 | 鉴权 | 说明 |
|---|---|---|
| `POST /api/v1/files/upload` | Bearer | multipart 表单：字段 `file`（必填）+ `kind`（可选 `image`/`file`/`avatar`，缺省按 MIME 自动判别）。图片/头像解码取宽高并生成 **200px 宽 JPEG 缩略图**。返回 `file_id/kind/name/size/mime/width/height/url/thumb_url` |
| `GET /api/v1/files/{id}?expires=&sig=[&thumb=1]` | HMAC query 签名 | 下载（query 鉴权便于 `<img>` 引用）；图片 inline、其他 attachment（中文名 RFC 5987 编码） |
| `GET /api/v1/files/{id}/sign` | Bearer | 按 file_id 换发一对新短期签名 URL（历史消息渲染用，签名默认 5 分钟过期） |

要点：

- 签名 `sig = HMAC-SHA256(SIGNED_URL_SECRET, "{file_id}.{expires}")`（小写 hex）；
- 大小：图片 ≤ `IMAGE_MAX_BYTES`(20MiB)，其他 ≤ `FILE_MAX_BYTES`(100MiB)，超限 4002；
- MIME 白名单：图片 jpeg/png/gif/webp/bmp；文件 pdf/zip/txt/Office 新旧格式，其余 4001；
  扩展名由服务端按 MIME 规范化，不信任客户端后缀；
- 存储路径与原始文件名无关：`{STORAGE_ROOT}/yyyy/mm/dd/{雪花ID}.{ext}`，
  缩略图 `{id}_thumb.jpg`；[`files::Storage`] trait 已抽象，二期新增 OSS/S3 业务代码不变；
- 媒体消息：WS `message.send` 的 `msg_type=2/3` 时 content 必须是引用 JSON
  `{file_id,name,size,mime,width?,height?}`，服务端校验文件存在、**上传者为本人**、类型匹配，
  否则 2003；头像（kind=3）不作消息发送。
