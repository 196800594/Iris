# im-common —— 公共库

被 im-gateway / im-logic 依赖的公共能力 crate（不独立运行）。

## 提供哪些公共能力

| 模块 | 能力 |
|---|---|
| `config` | `Config::from_env()` 环境变量配置加载；`mysql_url()` 连接串拼装；`is_dev()` 环境判断 |
| `error` | `AppError` 统一业务错误（计划书 5.3 分段错误码）+ HTTP 状态映射 + `ApiResult` 别名 |
| `id` | sonyflake 雪花 ID：`init(node_id)` / `next_id()`；machine-id 取 LOGIC_NODE_ID（或主机名）哈希 |
| `log` | tracing 初始化：`init(rust_log, log_format)`，支持 text/json 双格式 |
| `redis_keys` | 全部 Redis 键构造函数与 TTL 常量——键名格式唯一出处，改键名只改这里 |

## 如何被其他 crate 引用

```toml
# 该 crate 的 Cargo.toml
[dependencies]
im-common = { path = "../im-common" }
```

```rust
// 二进制入口的标准开场（先 dotenvy 后 Config）
dotenvy::dotenv().ok();
let cfg = im_common::config::Config::from_env();
im_common::log::init(&cfg.rust_log, &cfg.log_format);
im_common::id::init(&cfg.logic_node_id); // 仅 im-logic 需要
```

## 边界（禁止越过）

- **不放业务逻辑**：不含任何 auth/message/group 业务函数；
- **不连业务库**：不依赖 sqlx、不持有 MySQL 连接（Redis 仅提供键名构造，不持有连接）；
- **不定义协议**：proto 生成类型在 im-proto，这里不引用。
