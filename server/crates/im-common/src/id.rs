//! sonyflake 雪花 ID 生成（消息/会话/群/文件/用户主键）。
//!
//! machine-id 来源（技术文档 9.1）：`LOGIC_NODE_ID` 哈希；留空取主机名哈希。
//! 同一台机器跑多个 logic 实例必须显式设置互不相同的 `LOGIC_NODE_ID`，
//! 否则雪花 ID 有碰撞风险。10 bit machine 空间（0..=1023），哈希后取模。

use std::sync::OnceLock;

use sonyflake::Sonyflake;

/// 进程级唯一雪花生成器（首次调用初始化，之后零开销读取）。
static SNOWFLAKE: OnceLock<Sonyflake> = OnceLock::new();

/// 初始化全局雪花生成器（仅 im-logic 启动时调用一次）。
///
/// # 参数
/// - `node_id`：LOGIC_NODE_ID 配置值；空串时回退到主机名哈希
pub fn init(node_id: &str) {
    let seed_source = if node_id.is_empty() {
        hostname()
    } else {
        node_id.to_string()
    };
    // FNV-1a 哈希后取模 1024，映射到 sonyflake 的 10 bit machine 空间
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for b in seed_source.as_bytes() {
        hash ^= u64::from(*b);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    let machine_id = (hash % 1024) as u16;

    // sonyflake 0.2 API：machine_id 通过闭包注入（返回 Result<u16, _>）；
    // 不设置会回退到"私网 IP 后 16 位"，容器内可能无私网地址而失败，因此必须显式指定
    SNOWFLAKE
        .set(
            Sonyflake::builder()
                .machine_id(&|| Ok(machine_id))
                .finalize()
                .expect("sonyflake 初始化失败"),
        )
        .ok()
        .expect("雪花生成器重复初始化");
}

/// 生成一个全局趋势递增的 64 位雪花 ID。
///
/// # Panics
/// 未调用 [`init`] 或系统时钟回拨超阈值时 panic（时钟回拨属部署级故障，fail-fast）。
pub fn next_id() -> u64 {
    let sf = SNOWFLAKE
        .get()
        .expect("雪花生成器未初始化（需先调用 id::init）");
    sf.next_id().expect("sonyflake next_id 失败（时钟回拨）")
}

/// 取主机名（取不到时用 "unknown"，多实例必须显式配 LOGIC_NODE_ID 的原因之一）。
fn hostname() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "unknown".into())
}
