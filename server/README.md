# Iris 服务端（server/）

Rust 微服务端 Cargo workspace：**im-gateway**（WebSocket 网关）+ **im-logic**
（业务逻辑）两个二进制，共享 **im-proto**（契约）与 **im-common**（公共库）。

本 README 是服务端的**完整使用手册**：环境变量怎么配、本机/容器两种方式怎么跑、
迁移与种子数据纪律、常见问题排查。协议与版本基线见 `../plan/` 两份文档。

## 目录

- [架构与端口](#架构与端口)
- [先决条件](#先决条件)
- [环境变量配置（.env）](#环境变量配置env)
- [启动方式一：基础设施容器 + 本机 cargo（日常开发）](#方式一基础设施容器--本机-cargo日常开发推荐)
- [启动方式二：全容器 compose（贴近生产）](#方式二全容器-compose贴近生产)
- [数据库迁移与种子数据](#数据库迁移与种子数据)
- [常用命令](#常用命令)
- [排错手册](#排错手册)

## 架构与端口

| 服务/组件 | 端口 | 说明 |
|---|---|---|
| im-gateway | 7100 (WS) | 客户端长连接；ticket 鉴权、心跳、转发；无状态 |
| im-logic | 7200 (REST) / 7201 (gRPC) | 全部业务 + `/healthz`；启动自动执行数据库迁移 |
| MySQL 8.4 | 3306 | 持久化（开发期映射到宿主机 127.0.0.1） |
| Redis 7.4 | 6379 | 缓存/在线状态/幂等（AOF 持久化） |
| Caddy 2.8 | 80/443 | **仅生产**（`--profile edge`）；开发/测试模式不使用 |

```
桌面端 ──WS 7100──► gateway ──gRPC 双向流 7201──► logic ──► mysql / redis
桌面端 ──REST 7200───────────────────────────────► logic
```

## 先决条件

| 依赖 | 要求 | 说明 |
|---|---|---|
| Docker Desktop | 任意近期版本 | 起 MySQL/Redis 及全栈容器 |
| Rust | 由 `rust-toolchain.toml` 自动钉定 **1.99.0** stable | 首次构建 rustup 自动下载该工具链；**无需安装 protoc**（构建依赖 protoc-bin-vendored 自带） |
| 操作系统 | Windows / Linux / macOS 均可 | 本仓库开发环境为 Windows + PowerShell |

验证环境：

```powershell
docker --version      # Docker 版本
cd server; cargo --version   # 显示 1.99.0 即正确
```

## 环境变量配置（.env）

### 第一步：创建 .env

```powershell
Copy-Item .env.example .env
```

`.env` 已被 `.gitignore` 忽略，**禁止提交**；`.env.example` 是带逐行注释的模板，
可安全入库。变量总表同时收录于技术文档第 9 节。

### 第二步：必改项（开发环境）

| 变量 | 必改原因 | 示例 |
|---|---|---|
| `MYSQL_PASSWORD` / `MYSQL_ROOT_PASSWORD` | 模板默认值是 `changeme-*`，本地也建议换掉 | `MYSQL_PASSWORD=dev-local-123456` |
| `JWT_SECRET` | JWT HS256 签名密钥，**至少 32 字节**，默认值仅供启动自测 | 见下方生成命令 |
| `SIGNED_URL_SECRET` | 文件下载签名密钥，生产须随机 32 字节以上 | 同上 |

生成强随机密钥（任选其一）：

```powershell
# PowerShell（输出 64 位十六进制 = 32 字节）
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })

# Git Bash / Linux / macOS
openssl rand -hex 32
```

### 第三步：理解"本机跑"与"容器跑"的变量差异

同一份 `.env` 同时服务两种模式。**容器模式下，compose 会用 `environment:` 段
强制覆盖以下 4 项拓扑变量**（指向容器服务名），你 `.env` 里写的值只在
**本机 cargo 直跑**时生效：

| 变量 | 本机 cargo 直跑（.env 的值生效） | 容器内（compose 自动覆盖） |
|---|---|---|
| `MYSQL_HOST` | `127.0.0.1`（连 dev compose 映射到宿主机的端口） | `mysql` |
| `REDIS_URL` | `redis://127.0.0.1:6379/0` | `redis://redis:6379/0` |
| `LOGIC_GRPC_ENDPOINT` | `http://127.0.0.1:7201` | `http://logic:7201` |
| `STORAGE_ROOT` | `./data/uploads` | `/data/uploads` |

因此**模板默认值就是为本机开发调好的**，容器部署不用改它们；秘密类变量
（`JWT_SECRET`、SMTP 授权码等）两种模式共用同一份值。

> 环境变量通道唯一性纪律：容器的一切配置只能经 docker-compose 注入
> （业务参数/秘密走 `env_file: [.env]`，容器拓扑走 `environment:` 覆盖）。
> 禁止 `docker run -e`、禁止挂载 `.env`、禁止把秘密烘进镜像。

### 全量变量参考（按用途分组）

**基础运行**

| 变量 | 默认 | 说明 |
|---|---|---|
| `APP_ENV` | `development` | `development`：CORS 放开、`EMAIL_DEV_CODE` 生效；`production`：严格校验 |
| `RUST_LOG` | `info` | tracing 过滤语法，如 `im_gateway=debug,info` |
| `LOG_FORMAT` | `text` | `text` 本机可读；`json` 生产采集 |
| `TZ` | `Asia/Shanghai` | 时区 |

**监听地址与拓扑**

| 变量 | 默认 | 说明 |
|---|---|---|
| `LOGIC_HTTP_ADDR` | `0.0.0.0:7200` | REST 监听地址 |
| `LOGIC_GRPC_ADDR` | `0.0.0.0:7201` | gRPC 监听地址（供 gateway 回连） |
| `GATEWAY_WS_ADDR` | `0.0.0.0:7100` | WebSocket 监听地址 |
| `LOGIC_GRPC_ENDPOINT` | `http://127.0.0.1:7201` | gateway 回连 logic 的地址（见上表容器差异） |
| `GATEWAY_NODE_ID` | 空 | 网关节点唯一标识；多实例必须互不相同，留空取主机名 |
| `LOGIC_NODE_ID` | 空 | logic 节点标识（雪花 ID machine-id 来源）；同一台机器跑多个 logic 必须显式区分 |
| `CORS_ORIGINS` | `*` | 允许的跨域来源，逗号分隔；production 必须收敛为白名单 |

**MySQL**

| 变量 | 默认 | 说明 |
|---|---|---|
| `MYSQL_HOST` / `MYSQL_PORT` | `127.0.0.1` / `3306` | 应用据此拼装连接串 |
| `MYSQL_DATABASE` / `MYSQL_USER` | `iris` / `iris` | 库名与用户（compose 初始化用同名） |
| `MYSQL_PASSWORD` | `changeme-*` | 应用账号密码，**必改** |
| `DATABASE_URL` | 由上面拼装 | 仅给 sqlx-cli 等本机工具用；应用不读它 |
| `MYSQL_POOL_MAX` | `10` | 连接池上限 |
| `MYSQL_ROOT_PASSWORD` | `changeme-*` | 仅 compose 初始化 root 用，应用不读取 |

**Redis**

| 变量 | 默认 | 说明 |
|---|---|---|
| `REDIS_URL` | `redis://127.0.0.1:6379/0` | 容器内被覆盖为 `redis://redis:6379/0` |

**JWT / 鉴权**

| 变量 | 默认 | 说明 |
|---|---|---|
| `JWT_SECRET` | dev 占位 | HS256 签名密钥，≥32 字节，**必改** |
| `ACCESS_TOKEN_TTL_SECONDS` | `7200` | access 令牌 2 小时 |
| `REFRESH_TOKEN_TTL_SECONDS` | `2592000` | refresh 令牌 30 天 |
| `WS_TICKET_TTL_SECONDS` | `30` | WS 一次性 ticket 有效期 |

**邮件 SMTP**（lettre 0.11 直连第三方邮箱服务商，不自带邮件服务器）

| 变量 | 默认 | 说明 |
|---|---|---|
| `SMTP_ENABLED` | `false` | 开发期 `false`：验证码只写日志不真发；生产必须 `true` |
| `SMTP_HOST` | `smtp.qq.com` | QQ：`smtp.qq.com`；163：`smtp.163.com`；阿里云推：`smtpdm.aliyun.com` |
| `SMTP_PORT` | `465` | 465 隐式 TLS（推荐，25 端口普遍被封）；587 STARTTLS 备选 |
| `SMTP_USER` | 空 | 完整邮箱地址，如 `yourname@qq.com` |
| `SMTP_PASSWORD` | 空 | **SMTP 授权码**（邮箱网页设置里生成），不是邮箱登录密码 |
| `SMTP_FROM` | `Iris <yourname@qq.com>` | 发件人；一般要求与 `SMTP_USER` 同账号同域 |
| `EMAIL_CODE_TTL_SECONDS` | `300` | 验证码有效期 |
| `EMAIL_CODE_RESEND_COOLDOWN_SECONDS` | `60` | 同邮箱两次发码最小间隔 |
| `EMAIL_DEV_CODE` | 空 | 开发兜底万能验证码，**仅 `APP_ENV=development` 生效**，production 强制忽略；留空=不启用 |

**文件存储**

| 变量 | 默认 | 说明 |
|---|---|---|
| `STORAGE_ROOT` | `./data/uploads` | 上传根目录（容器内为 `/data/uploads`） |
| `PUBLIC_BASE_URL` | `http://localhost:7200` | 拼 signature 下载地址用；生产填 `https://你的域名` |
| `SIGNED_URL_SECRET` | dev 占位 | 下载签名 HMAC 密钥，生产 ≥32 字节随机，**必改** |
| `SIGNED_URL_TTL_SECONDS` | `300` | 签名 URL 有效期 |
| `IMAGE_MAX_BYTES` / `FILE_MAX_BYTES` | 20 MiB / 100 MiB | 图片/其他文件大小上限 |

**连接与限流**

| 变量 | 默认 | 说明 |
|---|---|---|
| `WS_HEARTBEAT_TIMEOUT_SECONDS` | `90` | WS 静默超时（无任何帧即断开） |
| `WS_RATE_LIMIT_PER_MINUTE` | `120` | 单连接每分钟上行帧数上限 |
| `WS_MAX_FRAME_BYTES` | `1048576` | 单帧上限 1 MiB（文件上传走 HTTP，不受此限） |
| `AUTH_RATE_LIMIT_PER_MINUTE` | `10` | 登录/发码等鉴权接口每 IP 每分钟上限 |

## 方式一：基础设施容器 + 本机 cargo（日常开发，推荐）

```powershell
# 1) 起基础设施 —— 必须叠加 dev 覆盖文件，否则 3306/6379 不映射到宿主机
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mysql redis

# 2) 起 logic（自动执行迁移建表），看到 "迁移完成" 与 "grpc listening on" 即成功
cargo run -p im-logic

# 3) 新终端起 gateway，看到 "ws listening on 0.0.0.0:7100" 与 "gateway link connected" 即成功
cargo run -p im-gateway

# 4) 自测
curl http://127.0.0.1:7200/healthz   # {"status":"ok",...,"db":true,"redis":true}
curl http://127.0.0.1:7100/healthz   # {"status":"ok",...}
```

启动成功的判定与排错见[排错手册](#排错手册)。

## 方式二：全容器 compose（贴近生产）

```powershell
docker compose up -d --build   # 不带 --profile edge：Caddy 不启动（开发模式不使用 Caddy）
docker compose ps              # mysql/redis/logic/gateway 四服务 healthy
docker compose logs -f logic gateway
```

生产化追加项（可选，按需启用 profile）：

```powershell
# 生产边缘反代（自动 HTTPS/WSS）——仅生产使用
docker compose --profile edge up -d
# 每日数据库备份（滚动保留 14 份，写入 backup_data 卷的 /backup）
docker compose --profile backup up -d
# 取出备份文件（示例）：
docker run --rm -v iris_backup_data:/backup -v "${PWD}:/out" alpine cp -r /backup /out
```

## 数据库迁移与种子数据

**迁移唯一方式：sqlx 内置迁移**（规范全文见技术文档 5.6）

- **自动执行**：`cargo run -p im-logic` 启动时自动执行 `migrations/` 下全部未应用
  脚本（生产同此，**不手工跑 SQL**）；`_sqlx_migrations` 表记录版本 + checksum；
- **手动排错**（仅本机）：
  `cargo install sqlx-cli --no-default-features --features mysql,rustls`
  然后 `cargo sqlx migrate run --source migrations`；
- **纪律**：`migrations/` up-only 只追加、旧脚本禁改（改动会 checksum 校验失败）；
  `cargo sqlx prepare` 只是编译期 SQL 校验，不是迁移（W2 起配合 `.sqlx/` 元数据入库）。

**种子数据**：演示用 SQL 一律放 `seeds/`（命名 `YYYYMMDD_描述_seed.sql`），
**永不自动执行**，需要时手工导入：`docker compose exec mysql mysql -uiris -p iris < seeds/xxx.sql`。

## 常用命令

| 目的 | 命令 |
|---|---|
| 格式化 | `cargo fmt --all` |
| Lint（CI 同款） | `cargo clippy --workspace -- -D warnings` |
| 全部测试 | `cargo test --workspace` |
| 编译检查 | `cargo check --workspace` |
| 全栈起停 | `docker compose up -d --build` / `docker compose down` |
| 看日志 | `docker compose logs -f logic gateway` |
| 重新生成 TS proto（W3 起） | `cd ../desktop; pnpm proto`（proto 源在 `crates/im-proto/proto/`） |
| 健康自检（容器 HEALTHCHECK 同款） | `cargo run -p im-logic -- healthcheck`；`cargo run -p im-gateway -- healthcheck` |

## 排错手册

| 现象 | 原因与处理 |
|---|---|
| 本机 cargo 连不上 MySQL（Connection refused 3306） | 忘了叠 dev 覆盖文件：`docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d mysql redis` |
| gateway 反复 `link disconnected` 重连 | logic 没起或 7201 不通；先确认 logic 日志出现 `grpc listening on 0.0.0.0:7201` |
| logic 启动即 panic：数据库迁移失败 | 看 panic 里的 MySQL 错误：账号密码错（`MYSQL_PASSWORD`）、库不存在（等 compose 自动建库）或迁移脚本被改过（checksum 失败） |
| WS 握手一直 401 | ticket 无效/过期（30s 一次性，`GETDEL` 核销）；ticket 由 logic 签发，调试期用 `EMAIL_DEV_CODE` 走通登录后获取 |
| 验证码收不到邮件 | `SMTP_ENABLED=false` 时验证码只在 logic 日志里（搜 `verify code`）；`true` 时检查授权码、465 端口出网、`SMTP_FROM` 与账号一致 |
| 容器内服务互相连不通 | 必须用服务名（`mysql` / `redis` / `logic`），不能用 `127.0.0.1`——compose 拓扑覆盖已处理，勿手工改 `environment` |
| 端口被占用（7100/7200/7201/3306/6379） | `netstat -ano \| findstr :7100` 找进程；或改 `.env` 里对应 `*_ADDR` |
| 种子数据"没生效" | 种子永不自动执行，属正常；手工导入见上节 |
| 工具链下载慢/失败 | rustup 换国内镜像（`RUSTUP_DIST_SERVER` / `RUSTUP_UPDATE_ROOT` 指到清华或中科大镜像） |

启动失败时优先看 logic 日志中的**迁移错误与 panic 信息**（fail-fast 设计：任何
基础设施故障都不带病上线）。更多排错见技术文档第 12 节排错表。
