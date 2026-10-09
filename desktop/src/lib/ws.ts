// WS 客户端（计划书 5.1/5.2）：
// - ticket 一次性握手；二进制帧 Frame 信封，RESPONSE/NOTICE 分流；
// - message.send 的成功回执是 NOTICE=message.ack（按 client_msg_id 关联）；
// - 断线指数退避（1→30s）自动重连，重连后换发新 ticket，成功后回调重新 sync；
// - close 4001 = ForceKick（吊销/重置密码），停止重连并登出。
import { api } from './rest';
import { WS_URL_BASE } from './config';
import {
  ConvCursor,
  ConvReadReq,
  ConvSyncBatchResp,
  ConvSyncReq,
  FrameType,
  MessageAckNotice,
  MessageSendReq,
  decodeFrame,
  decodePayload,
  encodeFrame,
  longStr,
  toLong,
} from './codec';
import Long from 'long';
import { iris } from '../types/iris.js';

/** message.ack 结果（雪花 ID 转 string） */
export interface AckResult {
  client_msg_id: string;
  server_msg_id: string;
  conv_id: string;
  seq: number;
  create_time_ms: number;
}

type ResponseCb = (payload: Uint8Array, err: Error | null) => void;
type NoticeHandler = (payload: Uint8Array, frameMethod: string) => void;

class IrisSocket {
  private ws: WebSocket | null = null;
  private nextId = 1;
  /** 主动关闭标志（登出）→ 不重连 */
  private manualClose = false;
  /** 正在连接中（start 幂等守卫） */
  private connecting = false;
  /** 当前退避毫秒 */
  private backoff = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** message.send 的 ack 等待者：client_msg_id → resolve/reject */
  private ackWaiters = new Map<string, [(a: AckResult) => void, (e: Error) => void]>();
  /** RESPONSE 一次性等待者：请求 id → 回调 */
  private responseOnce = new Map<number, ResponseCb>();
  /** 请求 id → client_msg_id（错误 RESPONSE 回查 ack 拒绝用） */
  private reqClientMsg = new Map<number, string>();
  private noticeHandlers = new Map<string, Set<NoticeHandler>>();
  /** open 前的待发帧（二进制），onopen 冲刷 */
  private outQueue: Uint8Array[] = [];
  /** 重连成功回调（store 重新跑 conv.sync） */
  onReopen: (() => void) | null = null;
  /** ForceKick 回调（store 登出） */
  onKicked: ((reason: string) => void) | null = null;
  /** 连接状态变化回调（UI 展示连接状态） */
  onStatus: ((online: boolean) => void) | null = null;

  /** 建立连接（登录成功后调用）。幂等：已连接/连接中直接返回，避免 StrictMode 双跑导致重复连被踢 */
  async start(): Promise<void> {
    if (this.ws || this.connecting) return;
    this.connecting = true;
    this.manualClose = false;
    try {
      await this.open();
    } finally {
      this.connecting = false;
    }
  }

  /** 主动关闭（登出） */
  stop(): void {
    this.manualClose = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.responseOnce.clear();
    this.failAllAcks(new Error('连接已关闭'));
  }

  private async open(): Promise<void> {
    const { ticket } = await api.wsTicket();
    const sock = new WebSocket(`${WS_URL_BASE}?ticket=${encodeURIComponent(ticket)}`);
    sock.binaryType = 'arraybuffer';
    this.ws = sock;

    sock.onopen = () => {
      this.backoff = 1000;
      this.onStatus?.(true);
      // 冲刷连接建立期间排队的帧
      const q = this.outQueue;
      this.outQueue = [];
      for (const f of q) sock.send(f);
      this.onReopen?.(); // 重连后重新差量同步
    };
    sock.onmessage = (ev) => {
      const frame = decodeFrame(new Uint8Array(ev.data as ArrayBuffer));
      this.dispatch(frame);
    };
    sock.onclose = (ev) => {
      if (this.ws !== sock) return; // 旧连接残影
      this.onStatus?.(false);
      if (this.manualClose) return;
      if (ev.code === 4001) {
        // ForceKick：refresh 整族吊销/重置密码/异设备登录，不重连
        this.stop();
        const reason = ev.reason ? String(ev.reason) : '账号在其他设备登录或凭证已失效';
        this.onKicked?.(reason);
        return;
      }
      // 指数退避 1→2→4→8→15→30s
      this.reconnectTimer = setTimeout(() => {
        void this.open().catch((e) => console.error('[ws] 重连失败，将继续退避:', e));
      }, this.backoff);
      this.backoff = Math.min(this.backoff * 2, 30_000);
    };
  }

  private dispatch(frame: ReturnType<typeof decodeFrame>): void {
    if (frame.frame_type === FrameType.RESPONSE) {
      const cb = this.responseOnce.get(Number(frame.id));
      if (cb) {
        this.responseOnce.delete(Number(frame.id));
        if (frame.code !== 0) {
          cb(new Uint8Array(0), new Error(frame.msg || `错误码 ${frame.code}`));
        } else {
          cb(frame.payload, null);
        }
        return;
      }
      // 无主错误 RESPONSE（message.send 失败）→ 按请求 id 回查并拒绝 ack
      if (frame.code !== 0) {
        const cid = this.reqClientMsg.get(Number(frame.id));
        if (cid) {
          this.reqClientMsg.delete(Number(frame.id));
          this.ackWaiters.get(cid)?.[1](new Error(frame.msg || `错误码 ${frame.code}`));
          this.ackWaiters.delete(cid);
        }
      }
      return;
    }
    if (frame.frame_type !== FrameType.NOTICE) return;

    if (frame.method === 'message.ack') {
      const a = decodePayload(MessageAckNotice, frame.payload) as unknown as {
        clientMsgId: string;
        serverMsgId: Long;
        convId: Long;
        seq: Long;
        createTimeMs: Long;
      };
      const waiter = this.ackWaiters.get(a.clientMsgId);
      if (waiter) {
        this.ackWaiters.delete(a.clientMsgId);
        waiter[0]({
          client_msg_id: a.clientMsgId,
          server_msg_id: longStr(a.serverMsgId),
          conv_id: longStr(a.convId),
          seq: a.seq.toNumber(),
          create_time_ms: a.createTimeMs.toNumber(),
        });
      }
      return;
    }
    this.noticeHandlers.get(frame.method)?.forEach((h) => h(frame.payload, frame.method));
  }

  private failAllAcks(e: Error): void {
    for (const [, pair] of this.ackWaiters) pair[1](e);
    this.ackWaiters.clear();
    this.reqClientMsg.clear();
  }

  /** 订阅通知，返回取消函数 */
  onNotice(method: string, h: NoticeHandler): () => void {
    let set = this.noticeHandlers.get(method);
    if (!set) {
      set = new Set();
      this.noticeHandlers.set(method, set);
    }
    set.add(h);
    return () => set!.delete(h);
  }

  /** 发送消息（NOTICE=message.ack 关联），超时 15 秒 */
  sendMessage(req: {
    client_msg_id: string;
    conv_id: string;
    to_uid: string;
    msg_type: number;
    content: string;
  }): Promise<AckResult> {
    return new Promise<AckResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.ackWaiters.delete(req.client_msg_id);
        reject(new Error('消息发送超时'));
      }, 15_000);
      this.ackWaiters.set(req.client_msg_id, [
        (a) => {
          clearTimeout(timer);
          resolve(a);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        },
      ]);
      const payload = MessageSendReq.encode({
        clientMsgId: req.client_msg_id,
        convId: toLong(req.conv_id),
        msgType: req.msg_type,
        content: req.content,
        toUid: toLong(req.to_uid),
      }).finish();
      const id = this.sendFrame('message.send', payload);
      this.reqClientMsg.set(id, req.client_msg_id);
    });
  }

  /** 差量同步（RESPONSE 承载 ConvSyncBatchResp） */
  async sync(cursors: { conv_id: string; has_seq: number }[], batchSize = 200) {
    const cursorObjs = cursors.map((c) =>
      ConvCursor.create({ convId: toLong(c.conv_id), hasSeq: c.has_seq }),
    ) as iris.v1.IConvCursor[];
    const payload = ConvSyncReq.encode({ cursors: cursorObjs, batchSize }).finish();
    const bytes = await this.request('conv.sync', payload);
    return decodePayload(ConvSyncBatchResp, bytes) as unknown as {
      convs: Array<{
        convId: Long;
        hasMore: boolean;
        messages: Array<Record<string, unknown>>;
      }>;
    };
  }

  /** 上报已读水位（无应答体，失败静默——下次打开会话会再次上报） */
  read(convId: string, readSeq: number): void {
    const payload = ConvReadReq.encode({
      convId: toLong(convId),
      readSeq,
    }).finish();
    this.sendFrame('conv.read', payload);
  }

  /** REQUEST/RESPONSE 请求-应答 */
  private request(method: string, payload: Uint8Array): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timer = setTimeout(() => {
        this.responseOnce.delete(id);
        reject(new Error(`${method} 超时`));
      }, 15_000);
      this.responseOnce.set(id, (p, err) => {
        clearTimeout(timer);
        if (err) reject(err);
        else resolve(p);
      });
      const frame = encodeFrame(FrameType.REQUEST, method, payload, id);
      this.ws?.send(frame);
    });
  }

  /** 编码并发出 REQUEST 帧；连接未就绪则排队，返回帧 id */
  private sendFrame(method: string, payload: Uint8Array): number {
    const id = this.nextId++;
    const frame = encodeFrame(FrameType.REQUEST, method, payload, id);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    } else if (!this.manualClose) {
      this.outQueue.push(frame);
    }
    return id;
  }
}

/** 全局单例 */
export const ws = new IrisSocket();
