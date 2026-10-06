// Protobuf 编解码：生成物由 `pnpm proto` 从 server 同一份 iris.proto 生成（src/types/iris.js）
// uint64（雪花 ID 超过 JS 安全整数）统一经 long.js 以 Long 表示，业务侧一律转 string。
import Long from 'long';
import * as $protobuf from 'protobufjs/minimal';
// pbjs 生成物按 proto package 挂在 iris.v1 命名空间下
import { iris } from '../types/iris.js';

// 必须在首次 decode 前注入 Long 实现，否则 uint64 会降级为 number 丢精度
$protobuf.util.Long = Long as unknown as typeof $protobuf.util.Long;
$protobuf.configure();

const v1 = iris.v1;

export const {
  Frame,
  MessageSendReq,
  ConvSyncReq,
  ConvCursor,
  ConvReadReq,
  MessageAckNotice,
  MessagePush,
  SyncMessage,
  ConvSyncBatchResp,
  ConvReadNotice,
  PresenceChangeNotice,
  GroupEventNotice,
} = v1;

/** protobufjs 消息类的最小类型（encode/decode 静态方法） */
export interface ProtoCtor<T = unknown> {
  encode: (msg: T) => { finish: () => Uint8Array };
  decode: (reader: Uint8Array) => T;
}

/** uint64 字段（Long/number）转字符串 */
export function longStr(v: Long | number | null | undefined): string {
  if (v === null || v === undefined) return '0';
  return typeof v === 'number' ? String(v) : v.toString();
}

/** 字符串 ID 转 Long（上行消息用） */
export function toLong(s: string | number): Long {
  return Long.fromString(String(s));
}

/** 统一帧类型枚举（与 proto FrameType 一致） */
export const FrameType = {
  REQUEST: 1,
  RESPONSE: 2,
  NOTICE: 3,
} as const;

/** 编码一帧信封 */
export function encodeFrame(
  frameType: number,
  method: string,
  payload: Uint8Array,
  id = 0,
): Uint8Array {
  return Frame.encode({ id: toLong(id), frameType, method, payload, code: 0, msg: '' }).finish();
}

/** 解码一帧信封 */
export function decodeFrame(bytes: Uint8Array): {
  id: string;
  frame_type: number;
  method: string;
  payload: Uint8Array;
  code: number;
  msg: string;
} {
  const f = Frame.decode(bytes) as unknown as {
    id: Long;
    frameType?: number;
    frame_type?: number;
    method: string;
    payload: Uint8Array;
    code: number;
    msg: string;
  };
  return {
    id: f.id.toString(),
    // 生成物字段名为 camelCase（frameType），兼容 snake
    frame_type: f.frameType ?? f.frame_type ?? 0,
    method: f.method,
    payload: f.payload ?? new Uint8Array(0),
    code: f.code ?? 0,
    msg: f.msg ?? '',
  };
}

/** 解码任意 payload 消息 */
export function decodePayload<T>(cls: ProtoCtor<T>, bytes: Uint8Array): T {
  return cls.decode(bytes);
}
