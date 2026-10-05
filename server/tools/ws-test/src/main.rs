//! ws-test —— Iris WS 联调测试工具（手工 protobuf 编解码，tokio-tungstenite 客户端）。
//!
//! 用法（先经 REST 拿 ticket：POST /api/v1/ws/ticket，Bearer access）：
//! ```text
//! ws-test listen  "ws://127.0.0.1:7100/ws?ticket=T" 10          # 连接并被动收帧 10 秒
//! ws-test send    "ws://..." --to 123 --content "hi" [--conv 0] [--client-msg UUID] [--type 1]
//! ws-test sync    "ws://..." --conv 456 --seq 0 [--batch 200]
//! ws-test read    "ws://..." --conv 456 --seq 5
//! ```
//! 收到的帧（RESPONSE / NOTICE=ack / push / conv.read / presence.change）均解析打印。

use std::process::exit;

use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::Message;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 3 {
        eprintln!("用法: ws-test <listen|send|sync|read> <ws-url> [参数...]");
        exit(2);
    }
    let cmd = args[1].clone();
    let url = args[2].clone();
    let rest = &args[3..];

    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("tokio runtime");
    rt.block_on(async move {
        match cmd.as_str() {
            "listen" => {
                let secs: u64 = rest.first().and_then(|s| s.parse().ok()).unwrap_or(10);
                run_listen(&url, secs).await;
            }
            "send" => run_send(&url, rest).await,
            "sync" => run_sync(&url, rest).await,
            "read" => run_read(&url, rest).await,
            other => {
                eprintln!("未知命令: {other}");
                exit(2);
            }
        }
    });
}

// ---------------------------------------------------------------------------
// 连接与收发
// ---------------------------------------------------------------------------

/// 建立 WS 连接（URL 带 ticket）。
async fn dial(
    url: &str,
) -> tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>> {
    let request = url
        .into_client_request()
        .expect("WS URL 非法（应为 ws://host/ws?ticket=xxx）");
    let (ws, _resp) = tokio_tungstenite::connect_async(request)
        .await
        .expect("WS 建连失败（ticket 是否有效/一次性？）");
    println!("[ws] connected: {url}");
    ws
}

/// 被动收帧 duration 秒，逐帧解析打印；到时主动关闭。
async fn run_listen(url: &str, secs: u64) {
    let mut ws = dial(url).await;
    let deadline = tokio::time::Instant::now() + std::time::Duration::from_secs(secs);
    loop {
        let timeout = tokio::time::sleep_until(deadline);
        tokio::select! {
            _ = timeout => break,
            item = ws.next() => match item {
                Some(Ok(Message::Binary(b))) => decode_frame(&b),
                Some(Ok(Message::Text(t))) => println!("[ws] TEXT: {t}"),
                Some(Ok(Message::Close(cf))) => {
                    println!("[ws] CLOSE: {cf:?}");
                    break;
                }
                Some(Ok(_)) => {}
                Some(Err(e)) => {
                    println!("[ws] ERR: {e}");
                    break;
                }
                None => break,
            },
        }
    }
    let _ = ws.close(None).await;
    println!("[ws] done");
}

/// 发一帧并收 8 秒响应（ack / push / 错误 RESPONSE）。
async fn run_send(url: &str, args: &[String]) {
    let to_uid = flag(args, "--to").and_then(|v| v.parse().ok()).unwrap_or(0);
    let conv_id = flag(args, "--conv").and_then(|v| v.parse().ok()).unwrap_or(0);
    let msg_type: u64 = flag(args, "--type").and_then(|v| v.parse().ok()).unwrap_or(1);
    let content = flag(args, "--content").unwrap_or_default();
    let client_msg_id = flag(args, "--client-msg")
        .unwrap_or_else(|| format!("test-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));

    let mut payload = vec![];
    put_str(&mut payload, 1, &client_msg_id);
    put_varint(&mut payload, 2, conv_id);
    put_varint(&mut payload, 3, msg_type);
    put_str(&mut payload, 4, &content);
    put_varint(&mut payload, 5, to_uid);

    println!("[send] client_msg_id={client_msg_id} conv={conv_id} to={to_uid} type={msg_type} content={content:?}");
    send_frame(url, "message.send", &payload, 8).await;
}

/// conv.sync：拉取游标之后的差量。
async fn run_sync(url: &str, args: &[String]) {
    let conv_id = flag(args, "--conv").and_then(|v| v.parse().ok()).unwrap_or(0);
    let has_seq = flag(args, "--seq").and_then(|v| v.parse().ok()).unwrap_or(0);
    let batch: u64 = flag(args, "--batch").and_then(|v| v.parse().ok()).unwrap_or(200);

    let mut cursor = vec![];
    put_varint(&mut cursor, 1, conv_id);
    put_varint(&mut cursor, 2, has_seq);
    let mut payload = vec![];
    put_bytes(&mut payload, 1, &cursor);
    put_varint(&mut payload, 2, batch);

    println!("[sync] conv={conv_id} has_seq={has_seq} batch={batch}");
    send_frame(url, "conv.sync", &payload, 8).await;
}

/// conv.read：上报已读水位。
async fn run_read(url: &str, args: &[String]) {
    let conv_id = flag(args, "--conv").and_then(|v| v.parse().ok()).unwrap_or(0);
    let read_seq = flag(args, "--seq").and_then(|v| v.parse().ok()).unwrap_or(0);

    let mut payload = vec![];
    put_varint(&mut payload, 1, conv_id);
    put_varint(&mut payload, 2, read_seq);

    println!("[read] conv={conv_id} read_seq={read_seq}");
    send_frame(url, "conv.read", &payload, 8).await;
}

/// 建连 → 发一帧 REQUEST → 收 duration 秒响应 → 关闭。
async fn send_frame(url: &str, method: &str, payload: &[u8], listen_secs: u64) {
    let mut ws = dial(url).await;
    let mut frame = vec![];
    put_varint(&mut frame, 1, 1); // id = 1
    put_varint(&mut frame, 2, 1); // frame_type = REQUEST
    put_str(&mut frame, 3, method);
    put_bytes(&mut frame, 4, payload);
    ws.send(Message::Binary(frame.into()))
        .await
        .expect("发送失败");

    let deadline = tokio::time::Instant::now() + std::time::Duration::from_secs(listen_secs);
    loop {
        tokio::select! {
            _ = tokio::time::sleep_until(deadline) => break,
            item = ws.next() => match item {
                Some(Ok(Message::Binary(b))) => decode_frame(&b),
                Some(Ok(Message::Close(cf))) => {
                    println!("[ws] CLOSE: {cf:?}");
                    break;
                }
                Some(Ok(_)) => {}
                Some(Err(e)) => {
                    println!("[ws] ERR: {e}");
                    break;
                }
                None => break,
            },
        }
    }
    let _ = ws.close(None).await;
}

// ---------------------------------------------------------------------------
// protobuf 编码（proto3 wire format 最小实现）
// ---------------------------------------------------------------------------

/// 写 varint（LEB128）。
fn put_varint(buf: &mut Vec<u8>, field: u64, value: u64) {
    let tag = (field << 3) | 0;
    write_varint_raw(buf, tag);
    write_varint_raw(buf, value);
}

/// 写 length-delimited 字段（string/bytes/message）。
fn put_bytes(buf: &mut Vec<u8>, field: u64, data: &[u8]) {
    let tag = (field << 3) | 2;
    write_varint_raw(buf, tag);
    write_varint_raw(buf, data.len() as u64);
    buf.extend_from_slice(data);
}

fn put_str(buf: &mut Vec<u8>, field: u64, s: &str) {
    put_bytes(buf, field, s.as_bytes());
}

fn write_varint_raw(buf: &mut Vec<u8>, mut v: u64) {
    loop {
        let b = (v & 0x7f) as u8;
        v >>= 7;
        if v == 0 {
            buf.push(b);
            break;
        }
        buf.push(b | 0x80);
    }
}

fn flag<'a>(args: &'a [String], name: &str) -> Option<String> {
    args.iter()
        .position(|a| a == name)
        .and_then(|i| args.get(i + 1))
        .cloned()
}

// ---------------------------------------------------------------------------
// protobuf 解码（按字段号解析打印）
// ---------------------------------------------------------------------------

/// 字段值：变长整数 / 长度界定字节。
#[derive(Debug, Clone)]
enum Val {
    V(u64),
    B(Vec<u8>),
}

/// 通用解析：返回 (field_number, value) 列表（wire type 0/2）。
fn parse_fields(data: &[u8]) -> Vec<(u64, Val)> {
    let mut out = vec![];
    let mut i = 0usize;
    while i < data.len() {
        let (tag, ni) = read_varint(data, i);
        i = ni;
        let field = tag >> 3;
        let wire = tag & 7;
        match wire {
            0 => {
                let (v, ni) = read_varint(data, i);
                i = ni;
                out.push((field, Val::V(v)));
            }
            2 => {
                let (len, ni) = read_varint(data, i);
                i = ni;
                let len = len as usize;
                if i + len > data.len() {
                    break;
                }
                out.push((field, Val::B(data[i..i + len].to_vec())));
                i += len;
            }
            _ => break, // 一期帧只用 0/2
        }
    }
    out
}

fn read_varint(data: &[u8], mut i: usize) -> (u64, usize) {
    let mut v = 0u64;
    let mut shift = 0;
    while i < data.len() {
        let b = data[i];
        i += 1;
        v |= ((b & 0x7f) as u64) << shift;
        if b & 0x80 == 0 {
            break;
        }
        shift += 7;
    }
    (v, i)
}

fn fvarint(fields: &[(u64, Val)], field: u64) -> Option<u64> {
    fields.iter().find(|(f, _)| *f == field).and_then(|(_, v)| match v {
        Val::V(n) => Some(*n),
        _ => None,
    })
}

fn fbytes(fields: &[(u64, Val)], field: u64) -> Option<&Vec<u8>> {
    fields.iter().find(|(f, _)| *f == field).and_then(|(_, v)| match v {
        Val::B(b) => Some(b),
        _ => None,
    })
}

fn fstr(fields: &[(u64, Val)], field: u64) -> String {
    fbytes(fields, field)
        .and_then(|b| String::from_utf8(b.clone()).ok())
        .unwrap_or_default()
}

/// 解析并打印一帧（Frame 信封 + 按 method 解 payload）。
fn decode_frame(b: &[u8]) {
    let f = parse_fields(b);
    let id = fvarint(&f, 1).unwrap_or(0);
    let frame_type = fvarint(&f, 2).unwrap_or(0);
    let method = fstr(&f, 3);
    let code = fvarint(&f, 5).unwrap_or(0);
    let msg = fstr(&f, 6);
    let kind = match frame_type {
        1 => "REQUEST",
        2 => "RESPONSE",
        3 => "NOTICE",
        _ => "?",
    };
    println!("[recv] {kind} id={id} method={method} code={code} msg={msg:?}");

    let Some(payload) = fbytes(&f, 4) else { return };
    if code != 0 && payload.is_empty() {
        return; // 错误响应无业务体
    }
    match method.as_str() {
        "message.ack" => {
            let p = parse_fields(payload);
            println!(
                "       ack: client_msg_id={:?} server_msg_id={} conv={} seq={} create_ms={}",
                fstr(&p, 1),
                fvarint(&p, 2).unwrap_or(0),
                fvarint(&p, 3).unwrap_or(0),
                fvarint(&p, 4).unwrap_or(0),
                fvarint(&p, 5).unwrap_or(0)
            );
        }
        "message.push" => print_message_push(payload),
        "conv.read" => {
            let p = parse_fields(payload);
            println!(
                "       read-notice: conv={} user={} read_seq={}",
                fvarint(&p, 1).unwrap_or(0),
                fvarint(&p, 2).unwrap_or(0),
                fvarint(&p, 3).unwrap_or(0)
            );
        }
        "presence.change" => {
            let p = parse_fields(payload);
            println!(
                "       presence: user={} online={}",
                fvarint(&p, 1).unwrap_or(0),
                fvarint(&p, 2).unwrap_or(0) != 0
            );
        }
        "conv.sync" => {
            let p = parse_fields(payload);
            for (_, v) in p.iter() {
                if let Val::B(conv) = v {
                    let c = parse_fields(conv);
                    let conv_id = fvarint(&c, 1).unwrap_or(0);
                    let has_more = fvarint(&c, 3).unwrap_or(0) != 0;
                    let mut msgs = vec![];
                    for (_, mv) in c.iter() {
                        if let Val::B(m) = mv {
                            // SyncMessage.seq 是字段 6 的 varint（Val::V），用 fvarint 判别有效消息
                            if fvarint(&parse_fields(m), 6).is_some() {
                                msgs.push(m.clone());
                            }
                        }
                    }
                    println!("       sync: conv={conv_id} n={} has_more={has_more}", msgs.len());
                    for m in msgs {
                        print_sync_message(&m, "         ");
                    }
                }
            }
        }
        _ => {
            println!("       payload({} bytes): {payload:?}", payload.len());
        }
    }
}

/// 解析 MessagePush{1: SyncMessage, 2: sender_nickname}。
fn print_message_push(payload: &[u8]) {
    let p = parse_fields(payload);
    let nickname = fstr(&p, 2);
    if let Some(m) = fbytes(&p, 1) {
        print_sync_message(m, "       ");
        println!("       push-sender-nickname: {nickname:?}");
    }
}

/// 解析 SyncMessage（8 个字段）。
fn print_sync_message(data: &[u8], indent: &str) {
    let p = parse_fields(data);
    println!(
        "{indent}msg: id={} conv={} sender={} type={} seq={} client_msg_id={:?} create_ms={} content={:?}",
        fvarint(&p, 1).unwrap_or(0),
        fvarint(&p, 2).unwrap_or(0),
        fvarint(&p, 3).unwrap_or(0),
        fvarint(&p, 4).unwrap_or(0),
        fvarint(&p, 6).unwrap_or(0),
        fstr(&p, 7),
        fvarint(&p, 8).unwrap_or(0),
        fstr(&p, 5),
    );
}
