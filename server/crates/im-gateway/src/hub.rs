//! 连接注册表与上行通道：本节点内 uid → 连接 的路由中枢。
//!
//! - 下行路由：logic 的 `Push{uids, frame}` 按 uid 找到本节点连接并投递；
//! - 上行汇聚：所有连接的 REQUEST 帧经统一 mpsc 交给 gRPC 链路（link）转发；
//! - 连接计数变化触发 `PresenceEvent`（0→1 首连 / 1→0 末断）。

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use prost::Message as _;
use tokio::sync::mpsc;

/// axum WebSocket 消息类型别名。
pub type WsMsg = axum::extract::ws::Message;

/// 连接注册表 + 上行通道。
pub struct Hub {
    /// conn_id 自增器（进程内唯一）
    conn_seq: AtomicU64,
    /// uid → (conn_id → 下行发送端)；只含挂在本节点的连接
    conns: Mutex<HashMap<u64, HashMap<u64, mpsc::Sender<WsMsg>>>>,
    /// 上行到 gRPC 链路的统一通道（ClientMsg / PresenceEvent）
    upstream_tx: mpsc::Sender<Upstream>,
    /// 上行通道接收端（仅 link::start_link 取用一次，重连复用）
    upstream_rx: Mutex<Option<mpsc::Receiver<Upstream>>>,
}

use im_proto::Upstream;

impl Hub {
    /// 创建注册表；上行通道容量 4096（背压上限，超出意味着 logic 过载，
    /// 转发失败由客户端 5s 重发兜底，服务端全程幂等）。
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel(4096);
        Self {
            conn_seq: AtomicU64::new(1),
            conns: Mutex::new(HashMap::new()),
            upstream_tx: tx,
            upstream_rx: Mutex::new(Some(rx)),
        }
    }

    /// 分配进程内唯一 conn_id。
    pub fn next_conn_id(&self) -> u64 {
        self.conn_seq.fetch_add(1, Ordering::Relaxed)
    }

    /// 注册连接；返回该 uid 当前的连接总数（供 0→1 首连判断）。
    pub fn register(&self, uid: u64, conn_id: u64, tx: mpsc::Sender<WsMsg>) -> usize {
        let mut conns = self.conns.lock().expect("连接表锁中毒");
        conns.entry(uid).or_default().insert(conn_id, tx);
        conns.get(&uid).map_or(0, |m| m.len())
    }

    /// 注销连接；返回该 uid 剩余连接数（0 表示末断）。
    pub fn unregister(&self, uid: u64, conn_id: u64) -> usize {
        let mut conns = self.conns.lock().expect("连接表锁中毒");
        if let Some(set) = conns.get_mut(&uid) {
            set.remove(&conn_id);
            if set.is_empty() {
                conns.remove(&uid);
            }
        }
        conns.get(&uid).map_or(0, |m| m.len())
    }

    /// 下行路由：把一帧投递给目标 uid 在本节点的全部连接；无连接的 uid 静默跳过
    /// （离线用户由重连后 conv.sync 兜底，见计划书 6.3）。
    pub fn route_push(&self, uids: &[u64], frame: &im_proto::Frame) {
        // 每个目标连接一份独立编码字节（编码一次、克隆字节，避免重复序列化）
        let bytes = frame.encode_to_vec();
        let conns = self.conns.lock().expect("连接表锁中毒");
        for uid in uids {
            if let Some(set) = conns.get(uid) {
                for tx in set.values() {
                    // 发送失败说明连接正在断开，忽略；注销由连接任务自行清理
                    let _ = tx.try_send(WsMsg::Binary(bytes.clone().into()));
                }
            }
        }
    }

    /// 强制下线：向目标 uid 全部连接发送 Close(4001) 并从注册表摘除。
    /// 4001 为网关自定义 close 码（票据态失效），与业务错误码 1001 区分（技术文档 4.1）。
    pub fn kick_uid(&self, uid: u64, reason: String) {
        let removed = {
            let mut conns = self.conns.lock().expect("连接表锁中毒");
            conns.remove(&uid)
        };
        if let Some(set) = removed {
            tracing::info!(uid, conns = set.len(), reason, "force kick");
            for tx in set.into_values() {
                let _ = tx.try_send(WsMsg::Close(Some(axum::extract::ws::CloseFrame {
                    code: 4001,
                    reason: reason.clone().into(),
                })));
            }
        }
    }

    /// 上行一条消息到 gRPC 链路；链路断开期间返回错误（客户端重发兜底）。
    pub async fn send_upstream(
        &self,
        item: Upstream,
    ) -> Result<(), mpsc::error::SendError<Upstream>> {
        self.upstream_tx.send(item).await
    }

    /// 取走上行通道接收端（仅 start_link 调用一次；之后重连复用同一接收端）。
    pub fn take_upstream_rx(&self) -> Option<mpsc::Receiver<Upstream>> {
        self.upstream_rx.lock().expect("hub 锁中毒").take()
    }
}
