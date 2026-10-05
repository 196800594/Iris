//! WebSocket 接入处理（技术文档 4.1）。
//!
//! 建连流程：`/ws?ticket=xxx` → Redis `GETDEL ws:ticket:{t}` 一次性核销 →
//! 失败在握手升级阶段返回 HTTP 401（连接根本不建立）→ 成功绑定 uid/conn_id。
//!
//! 连接循环：协议层 Ping/Pong 心跳（axum 底层自动回 Pong）、90s 静默断开、
//! 单帧 1 MiB 上限、单连接限流；REQUEST 帧经 gRPC 链路转发 logic。

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use axum::extract::ws::{CloseFrame, Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use futures::{SinkExt, StreamExt};
use prost::Message as _;
use redis::AsyncCommands as _;
use tokio::sync::mpsc;

use crate::hub::WsMsg;
use crate::AppState;
use im_common::redis_keys;
use im_proto::{upstream, ClientMsg, Frame, FrameType, Upstream};

/// 下行发送队列容量：单连接背压上限（慢消费者超过即丢弃连接）。
const OUT_BUFFER: usize = 64;
/// presence TTL 续期间隔：30 秒（技术文档 4.1 第 3 条）。
const PRESENCE_REFRESH_INTERVAL: Duration = Duration::from_secs(30);

/// `/ws` 握手入口：ticket 鉴权 → 升级为 WebSocket。
pub async fn ws_handler(
    State(state): State<Arc<AppState>>,
    Query(params): Query<HashMap<String, String>>,
    upgrade: WebSocketUpgrade,
) -> Response {
    // 1) 取 ticket 查询参数
    let Some(ticket) = params.get("ticket").filter(|t| !t.is_empty()) else {
        return (StatusCode::UNAUTHORIZED, "missing ticket").into_response();
    };

    // 2) 一次性核销：GETDEL 原子取出并删除；值即 uid（logic 签发时写入）
    let mut redis = state.redis.clone();
    let key = redis_keys::ws_ticket(ticket);
    let uid: Option<String> = match redis::cmd("GETDEL").arg(&key).query_async(&mut redis).await {
        Ok(v) => v,
        Err(e) => {
            tracing::error!("ticket 核销 Redis 错误: {e}");
            return (StatusCode::INTERNAL_SERVER_ERROR, "internal error").into_response();
        }
    };
    let Some(uid_str) = uid else {
        // ticket 缺失/失效/过期：升级阶段直接 401 拒绝（技术文档 4.1 第 2 条）
        return (StatusCode::UNAUTHORIZED, "invalid ticket").into_response();
    };
    let Ok(uid) = uid_str.parse::<u64>() else {
        return (StatusCode::UNAUTHORIZED, "invalid ticket").into_response();
    };

    // 3) 升级连接
    upgrade.on_upgrade(move |socket| handle_socket(state, uid, socket))
}

/// 已鉴权连接的主循环。
async fn handle_socket(state: Arc<AppState>, uid: u64, socket: WebSocket) {
    let conn_id = state.hub.next_conn_id();
    // 下行队列：hub 路由的帧 / Close 都经此发给客户端
    let (out_tx, mut out_rx) = mpsc::channel::<WsMsg>(OUT_BUFFER);
    let local_conns = state.hub.register(uid, conn_id, out_tx.clone());

    // ---- presence：写在线键 + 首连事件（0→1） ----
    let mut redis = state.redis.clone();
    let conns_key = redis_keys::presence_conns(uid);
    let presence_key = redis_keys::presence(uid);
    let online_count: Result<i64, _> = redis::cmd("INCR")
        .arg(&conns_key)
        .query_async(&mut redis)
        .await;
    if let Ok(n) = online_count {
        // presence:{uid} = node_id，供 logic 查询"用户挂在哪个节点"
        let _: Result<(), _> = redis.set_ex(&presence_key, &state.node_id, 120).await;
        if n == 1 {
            let ev = Upstream {
                body: Some(upstream::Body::PresenceEvent(im_proto::PresenceEvent {
                    uid,
                    online: true,
                })),
            };
            let _ = state.hub.send_upstream(ev).await;
        }
    }
    tracing::info!(uid, conn_id, local_conns, "ws connected");

    // ---- 连接参数 ----
    let heartbeat = Duration::from_secs(state.cfg.ws_heartbeat_timeout_seconds);
    let max_frame = state.cfg.ws_max_frame_bytes;
    let rate_limit = state.cfg.ws_rate_limit_per_minute;

    let (mut sender, mut receiver) = socket.split();
    let mut last_active = Instant::now();
    // 限流：60s 滚动窗口的简化实现（固定窗口），超限返回 1005 并断开
    let mut window_start = Instant::now();
    let mut frames_in_window: u32 = 0;

    loop {
        tokio::select! {
            // ---- 下行：hub 路由来的帧 → 客户端 ----
            out = out_rx.recv() => {
                match out {
                    Some(msg) => {
                        if sender.send(msg).await.is_err() {
                            break; // 客户端已断
                        }
                    }
                    None => break, // 发送端全部关闭（被踢/注销）
                }
            }
            // ---- 上行：客户端帧 ----
            incoming = receiver.next() => {
                let Some(msg) = incoming else { break }; // 客户端关闭
                let Ok(msg) = msg else { break };
                last_active = Instant::now();
                match msg {
                    // 心跳走协议层 Ping；axum 底层自动回 Pong，这里只刷新活跃时间
                    Message::Ping(_) => {}
                    Message::Pong(_) => {}
                    Message::Binary(bytes) => {
                        // 限流：固定 60s 窗口
                        if window_start.elapsed() >= Duration::from_secs(60) {
                            window_start = Instant::now();
                            frames_in_window = 0;
                        }
                        frames_in_window += 1;
                        if frames_in_window > rate_limit {
                            let _ = sender
                                .send(Message::Close(Some(CloseFrame { code: 1008, reason: "rate limited".into() })))
                                .await;
                            tracing::warn!(uid, conn_id, "rate limited, closing");
                            break;
                        }
                        // 单帧上限：超限立即断连（技术文档 5.1）
                        if bytes.len() > max_frame {
                            let _ = sender
                                .send(Message::Close(Some(CloseFrame { code: 1009, reason: "frame too large".into() })))
                                .await;
                            tracing::warn!(uid, conn_id, size = bytes.len(), "frame too large, closing");
                            break;
                        }
                        // 解码统一信封；仅处理 REQUEST（客户端只发请求帧）
                        match Frame::decode(&bytes[..]) {
                            Ok(frame) if frame.frame_type() == FrameType::Request => {
                                let up = Upstream {
                                    body: Some(upstream::Body::ClientMsg(ClientMsg {
                                        uid,
                                        conn_id,
                                        frame: Some(frame),
                                    })),
                                };
                                // gRPC 链路断开时发送失败：丢弃本帧，客户端 5s 未收 ack 自动重发
                                if state.hub.send_upstream(up).await.is_err() {
                                    tracing::warn!(uid, conn_id, "upstream link down, frame dropped");
                                }
                            }
                            Ok(_) => {} // RESPONSE/NOTICE 不应来自客户端，忽略
                            Err(e) => {
                                tracing::warn!(uid, conn_id, "frame decode failed: {e}");
                                let _ = sender
                                    .send(Message::Close(Some(CloseFrame { code: 1002, reason: "bad frame".into() })))
                                    .await;
                                break;
                            }
                        }
                    }
                    Message::Close(_) => break,
                    Message::Text(_) => {
                        // 仅接受二进制 Protobuf 帧，文本帧忽略（技术文档 4.1 第 1 条）
                    }
                }
            }
            // ---- 静默超时：90s 内无任何帧即断开 ----
            _ = tokio::time::sleep_until(tokio::time::Instant::from(last_active) + heartbeat) => {
                tracing::info!(uid, conn_id, "heartbeat timeout, closing");
                break;
            }
            // ---- presence 续期：每 30s 刷新 presence:{uid} 的 120s TTL ----
            _ = tokio::time::sleep(PRESENCE_REFRESH_INTERVAL) => {
                let _: Result<(), _> = redis.expire(&presence_key, 120).await;
            }
        }
    }

    // ---- 清理：注销连接 + 末断事件（1→0） ----
    let remaining = state.hub.unregister(uid, conn_id);
    let _: Result<i64, _> = redis::cmd("DECR")
        .arg(&conns_key)
        .query_async(&mut redis)
        .await;
    if remaining == 0 {
        let _: Result<(), _> = redis.del(&presence_key).await;
        let ev = Upstream {
            body: Some(upstream::Body::PresenceEvent(im_proto::PresenceEvent {
                uid,
                online: false,
            })),
        };
        let _ = state.hub.send_upstream(ev).await;
    }
    tracing::info!(uid, conn_id, remaining, "ws disconnected");
}
