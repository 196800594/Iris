//! gateway ↔ logic gRPC 双向流客户端（计划书 5.4 / 技术文档 4.1 第 7 条）。
//!
//! - 每个 gateway 实例与 logic 维持**一条** `GatewayLink/Open` 长流；
//! - 首（重）连成功后先发 `NodeHello{node_id}` 注册节点（严格首帧）；
//! - 断线指数退避重连：1s 起步、每次翻倍、封顶 30s；曾稳定连接的会话重连后从 1s 重新起步；
//! - 重连期间上行发送失败由客户端 5s 重发兜底（服务端幂等）。

use std::sync::Arc;
use std::time::Duration;

use crate::AppState;
use futures::stream;
use futures::StreamExt;
use im_proto::gateway_link_client::GatewayLinkClient;
use im_proto::{NodeHello, Upstream};
use tokio_stream::wrappers::ReceiverStream;
use tonic::transport::Endpoint;

/// 单次退避上限：30 秒。
const MAX_BACKOFF_SECS: u64 = 30;

/// 连接 logic 的 gRPC 并常驻维持双向流；进程生命周期内不断重连，永不返回。
pub async fn start_link(state: Arc<AppState>) {
    let mut backoff_secs = 1u64;
    loop {
        // connected=true 表示该次连接曾成功建立（跑过一段），断开后从 1s 重新起步
        let connected = connect_once(&state).await;
        if connected {
            backoff_secs = 1;
            tracing::warn!("gateway link closed, reconnecting in 1s");
        } else {
            tracing::warn!("gateway link retry in {backoff_secs}s");
        }
        tokio::time::sleep(Duration::from_secs(backoff_secs)).await;
        if !connected {
            backoff_secs = (backoff_secs * 2).min(MAX_BACKOFF_SECS);
        }
    }
}

/// 尝试建立一次双向流并处理下行到流断开；返回是否曾成功建立。
async fn connect_once(state: &Arc<AppState>) -> bool {
    let endpoint = match Endpoint::from_shared(state.cfg.logic_grpc_endpoint.clone()) {
        Ok(ep) => ep
            .tcp_nodelay(true)
            // keepalive 探活：30s 空闲 ping，10s 无响应判死（技术文档 10 章 gRPC 链路）
            .http2_keep_alive_interval(Duration::from_secs(30))
            .keep_alive_timeout(Duration::from_secs(10))
            .keep_alive_while_idle(true),
        Err(e) => {
            tracing::error!("LOGIC_GRPC_ENDPOINT 非法: {e}");
            return false;
        }
    };

    let mut client = match GatewayLinkClient::connect(endpoint).await {
        Ok(c) => c,
        Err(e) => {
            tracing::warn!("connect logic failed: {e}");
            return false;
        }
    };

    // 上行流 = once(NodeHello) 链上 hub 上行通道，确保注册帧严格先于任何 ClientMsg。
    // 泵语义：hub.upstream_rx 经 ReceiverStream 接入；连接断开时流终止，重连后重建同一接收端。
    let upstream_rx = match state.hub.take_upstream_rx() {
        Some(rx) => rx,
        None => {
            tracing::error!("upstream rx 已被取走（start_link 不应重入）");
            return false;
        }
    };
    let hello = Upstream {
        body: Some(im_proto::upstream::Body::NodeHello(NodeHello {
            node_id: state.node_id.clone(),
        })),
    };
    let request_stream = stream::once(async move { hello }).chain(ReceiverStream::new(upstream_rx));

    let mut responses = match client.open(request_stream).await {
        Ok(resp) => resp.into_inner(),
        Err(e) => {
            tracing::warn!("open gateway link failed: {e}");
            return false;
        }
    };

    tracing::info!("gateway link connected node={}", state.node_id);

    // 下行处理循环：Push 路由到本节点连接；ForceKick 踢人
    loop {
        match responses.message().await {
            Ok(Some(down)) => match down.body {
                Some(im_proto::downstream::Body::Push(push)) => {
                    if let Some(frame) = push.frame {
                        state.hub.route_push(&push.uids, &frame);
                    }
                }
                Some(im_proto::downstream::Body::ForceKick(kick)) => {
                    state.hub.kick_uid(kick.uid, kick.reason);
                }
                None => {}
            },
            Ok(None) => break, // 服务端正常关流
            Err(e) => {
                tracing::warn!("gateway link broken: {e}");
                break;
            }
        }
    }
    true
}
