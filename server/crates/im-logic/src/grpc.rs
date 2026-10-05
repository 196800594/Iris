//! GatewayLink gRPC 服务端（7201）：网关节点注册表 + 双向流处理。
//!
//! 流即注册、流断即摘除（计划书 5.4）：
//! - 收到 `NodeHello{node_id}` → 把该流对应的下行通道存入注册表；
//! - `Downstream::Push` 按注册表找到目标节点通道下发；
//! - 流结束/断开 → 从注册表摘除该节点。
//!
//! W1 骨架行为：收到 `ClientMsg` 解出 Frame 后回一条 `RESPONSE code=5000`
//! 占位响应（真实消息管线 W4 起实现）；`PresenceEvent` 记日志。

use std::collections::HashMap;
use std::pin::Pin;
use std::sync::{Arc, Mutex};

use im_proto::gateway_link_server::{GatewayLink, GatewayLinkServer};
use im_proto::{downstream, upstream, Downstream, Frame, FrameType, Push, Upstream};
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;
use tonic::{Request, Response, Status, Streaming};

use crate::AppState;

/// 单个网关节点的下行发送通道（tonic 流的下行写入端）。
type NodeTx = mpsc::Sender<Result<Downstream, Status>>;
/// 在线节点表：node_id → 该节点下行通道。
type NodeMap = HashMap<String, NodeTx>;

/// 在线网关节点注册表：node_id → 该节点下行发送通道。
#[derive(Clone, Default)]
pub struct NodeRegistry {
    inner: Arc<Mutex<NodeMap>>,
}

impl NodeRegistry {
    /// 创建空注册表。
    pub fn new() -> Self {
        Self::default()
    }

    /// 注册节点（NodeHello 到达时）；同 node_id 重复注册覆盖旧通道（旧流将被孤儿化并由 tonic 关闭）。
    pub fn register(&self, node_id: &str, tx: mpsc::Sender<Result<Downstream, Status>>) {
        self.inner
            .lock()
            .expect("节点注册表锁中毒")
            .insert(node_id.to_string(), tx);
        tracing::info!(node_id, "gateway node registered");
    }

    /// 摘除节点（流断开时）；返回是否存在。
    pub fn remove(&self, node_id: &str) -> bool {
        let removed = self
            .inner
            .lock()
            .expect("节点注册表锁中毒")
            .remove(node_id)
            .is_some();
        if removed {
            tracing::info!(node_id, "gateway node removed");
        }
        removed
    }

    /// 向指定节点下发一帧（W2 起被消息管线调用；用户→节点映射届时查 Redis presence 键）。
    pub async fn push_to_node(&self, node_id: &str, frame: Frame, uids: Vec<u64>) {
        let tx = {
            let reg = self.inner.lock().expect("节点注册表锁中毒");
            reg.get(node_id).cloned()
        };
        if let Some(tx) = tx {
            let down = Downstream {
                body: Some(downstream::Body::Push(Push {
                    uids,
                    frame: Some(frame),
                })),
            };
            // 通道满/关闭说明该节点流异常，W2 起由重试与摘除逻辑兜底
            let _ = tx.send(Ok(down)).await;
        } else {
            tracing::warn!(node_id, "push to unknown node");
        }
    }
}

/// GatewayLink 服务实现：持有全局 AppState 以访问节点注册表与业务依赖。
pub struct GatewayLinkSvc {
    /// 全局状态（节点注册表在其中）
    state: Arc<AppState>,
}

impl GatewayLinkSvc {
    /// 创建服务实例（供 axum/tonic 装配）。
    pub fn new(state: Arc<AppState>) -> Self {
        Self { state }
    }
}

#[tonic::async_trait]
impl GatewayLink for GatewayLinkSvc {
    /// Open 双向流的下行响应流类型：mpsc 接收端包装为 BoxStream
    /// （tonic 0.12 生成的 trait 以关联类型约束响应流，必须显式声明）。
    type OpenStream = Pin<Box<dyn futures::Stream<Item = Result<Downstream, Status>> + Send>>;

    /// 双向流：上行逐条处理，下行经 mpsc 通道推给网关。
    ///
    /// 流生命周期：
    /// 1. 建流即创建 (down_tx, down_rx)，down_rx 作为响应流返回给 tonic；
    /// 2. spawn 任务逐条收 Upstream：NodeHello 注册节点（记录 node_id 供断流摘除）、
    ///    ClientMsg 回占位响应、PresenceEvent 记日志；
    /// 3. 上行流结束（网关断连）→ 摘除节点 + 关闭 down_tx。
    async fn open(
        &self,
        request: Request<Streaming<Upstream>>,
    ) -> Result<Response<Self::OpenStream>, Status> {
        let mut upstream = request.into_inner();
        let (down_tx, down_rx) = mpsc::channel::<Result<Downstream, Status>>(1024);

        // 注册表句柄克隆进任务，断流时摘除
        let registry = self.state.nodes.clone();

        tokio::spawn(async move {
            // 该流注册的节点名（NodeHello 到达前为空）
            let mut registered_node: Option<String> = None;

            while let Some(item) = upstream.message().await.transpose() {
                let up = match item {
                    Ok(up) => up,
                    Err(e) => {
                        tracing::warn!("upstream error: {e}");
                        break;
                    }
                };
                match up.body {
                    // ---- 首帧：节点注册 ----
                    Some(upstream::Body::NodeHello(hello)) => {
                        registry.register(&hello.node_id, down_tx.clone());
                        registered_node = Some(hello.node_id);
                    }
                    // ---- 客户端帧转发（W1：占位响应，真实管线 W4 起） ----
                    Some(upstream::Body::ClientMsg(msg)) => {
                        handle_client_msg(&down_tx, msg).await;
                    }
                    // ---- 在线上下线事件（W1：记日志；W2 起驱动 presence.change 推送） ----
                    Some(upstream::Body::PresenceEvent(ev)) => {
                        tracing::info!(uid = ev.uid, online = ev.online, "presence event");
                    }
                    None => {}
                }
            }

            // 流结束：摘除节点，down_tx drop 关闭响应流
            if let Some(node_id) = registered_node {
                registry.remove(&node_id);
            }
        });

        Ok(Response::new(
            Box::pin(ReceiverStream::new(down_rx)) as Self::OpenStream
        ))
    }
}

/// gRPC 服务主循环：监听 `LOGIC_GRPC_ADDR`（0.0.0.0:7201），装配 GatewayLink，
/// 优雅停机与 REST 共用 [`crate::shutdown_signal`]。
///
/// 返回类型与 `http::serve` 统一为 `io::Result<()>`（main 的 select! 两臂类型一致）；
/// tonic 的 transport 错误非 io::Error，此处转译并保留原始信息。
pub async fn serve(state: Arc<AppState>) -> std::io::Result<()> {
    let addr = state.cfg.logic_grpc_addr.clone();
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("grpc listening on {addr}");
    tonic::transport::Server::builder()
        .add_service(GatewayLinkServer::new(GatewayLinkSvc::new(state)))
        .serve_with_incoming_shutdown(
            tokio_stream::wrappers::TcpListenerStream::new(listener),
            crate::shutdown_signal(),
        )
        .await
        .map_err(|e| std::io::Error::other(format!("gRPC 服务异常退出: {e}")))
}

/// 处理一条客户端帧（W1 占位：回 5000 "not implemented"；W4 起按 method 分发到消息管线）。
async fn handle_client_msg(
    down_tx: &mpsc::Sender<Result<Downstream, Status>>,
    msg: im_proto::ClientMsg,
) {
    let Some(frame) = msg.frame else { return };

    // 占位响应：id 原样带回，type=RESPONSE，code=5000（内部错误段），msg 提示未实现
    let resp = Frame {
        id: frame.id,
        frame_type: FrameType::Response as i32,
        method: frame.method.clone(),
        payload: Vec::new(),
        code: 5000,
        msg: "method not implemented yet (W+)".into(),
    };
    let down = Downstream {
        body: Some(downstream::Body::Push(Push {
            uids: vec![msg.uid],
            frame: Some(resp),
        })),
    };
    if let Err(e) = down_tx.send(Ok(down)).await {
        tracing::warn!(uid = msg.uid, "downstream send failed: {e}");
    }
    // 节点连通性调试日志：W1 链路验证输出
    tracing::debug!(
        uid = msg.uid,
        conn = msg.conn_id,
        method = frame.method,
        "client frame received (placeholder handling)"
    );
}
