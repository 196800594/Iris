// 聊天数据核心：会话列表、消息收发与本地回声、差量同步、未读与已读水位、在线状态、群事件
import { create } from 'zustand';
import Long from 'long';
import { api } from '../lib/rest';
import { ws } from '../lib/ws';
import {
  ConvReadNotice,
  GroupEventNotice,
  MessagePush,
  PresenceChangeNotice,
  longStr,
} from '../lib/codec';
import { cachedMaxSeq, cacheMessages, getCachedMessages } from '../lib/db';
import { pushNotification } from '../lib/notify';
import { lastMsgPreview, uuid } from '../lib/format';
import type { Conversation, Friend, HistoryMsg } from '../types/api';
import { useAuth } from './auth';

/** 解码后的 SyncMessage（protobufjs camelCase 字段，ID 为 Long） */
interface RawSyncMsg {
  id: Long;
  convId: Long;
  senderId: Long;
  msgType: number;
  content: string;
  seq: Long;
  clientMsgId: string;
  createTimeMs: Long;
}

/** 同步消息 → 桌面 HistoryMsg（雪花 ID 全转 string） */
function toHistory(r: RawSyncMsg): HistoryMsg {
  return {
    id: longStr(r.id),
    conv_id: longStr(r.convId),
    sender_id: longStr(r.senderId),
    msg_type: r.msgType,
    content: r.content ?? '',
    seq: r.seq.toNumber(),
    client_msg_id: r.clientMsgId ?? '',
    create_time_ms: r.createTimeMs.toNumber(),
  };
}

/** 幂等合并：按服务端 id / 本地 client_msg_id 去重后按 (seq, 时间) 排序 */
function mergeMessages(prev: HistoryMsg[], incoming: HistoryMsg[]): HistoryMsg[] {
  const out = [...prev];
  for (const m of incoming) {
    const idx = out.findIndex(
      (x) => (m.id && x.id === m.id) || (m.client_msg_id && x.client_msg_id === m.client_msg_id),
    );
    if (idx >= 0) {
      // ack 回来：用服务端记录替换本地回声
      out[idx] = m;
    } else {
      out.push(m);
    }
  }
  // 本地回声 seq=0 排在最末；已确认消息按 seq 升序
  return out.sort((a, b) => {
    if (a.seq > 0 && b.seq > 0) return a.seq - b.seq;
    if (a.seq > 0) return -1;
    if (b.seq > 0) return 1;
    return a.create_time_ms - b.create_time_ms;
  });
}

interface ChatState {
  conversations: Conversation[];
  friends: Friend[];
  /** 当前打开的已存在会话；与 draftPeerId 互斥 */
  activeConvId: string | null;
  /** 新建单聊的对端 uid（会话懒建，首帧 conv_id=0） */
  draftPeerId: string | null;
  messages: Record<string, HistoryMsg[]>;
  hasMore: Record<string, boolean>;
  presence: Record<string, boolean>;
  /** uid → 昵称（推送快照 / 群详情成员写入；群气泡显示发送者用） */
  names: Record<string, string>;
  bound: boolean;

  reset: () => void;
  bindRealtime: () => void;
  refreshConversations: () => Promise<void>;
  refreshFriends: () => Promise<void>;
  /** 打开已存在会话：缓存→REST→上报已读 */
  openConversation: (convId: string) => Promise<void>;
  /** 从联系人发起新单聊（懒建） */
  startDraft: (peerId: string) => void;
  closeChat: () => void;
  loadMore: () => Promise<void>;
  initialSync: () => Promise<void>;
  sendText: (text: string) => Promise<void>;
  sendFileMessage: (file: File, kind: 'image' | 'file') => Promise<void>;
  /** 批量写入昵称（群详情加载后调用） */
  setNames: (entries: Array<[string, string]>) => void;
}

export const useChat = create<ChatState>((set, get) => {
  /** 更新单个会话字段（不引用替换数组以外的结构） */
  function patchConv(convId: string, patch: Partial<Conversation>): void {
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === convId ? { ...c, ...patch } : c)),
    }));
  }

  /** 把一条新消息并入本地：会话列表 last_msg、未读、消息区、桌面通知 */
  async function ingestMessage(m: HistoryMsg, senderNickname: string): Promise<void> {
    const { activeConvId, conversations } = get();
    const myId = useAuth.getState().me?.id ?? '';
    const conv = conversations.find((c) => c.id === m.conv_id);

    if (senderNickname) {
      set((s) => ({ names: { ...s.names, [m.sender_id]: senderNickname } }));
    }

    set((s) => ({
      messages: {
        ...s.messages,
        [m.conv_id]: mergeMessages(s.messages[m.conv_id] ?? [], [m]),
      },
    }));
    void cacheMessages(m.conv_id, [m]);

    if (!conv) {
      // 新懒建会话（首条单聊）→ 重拉会话列表
      void get().refreshConversations();
    }

    const isActive = activeConvId === m.conv_id;
    const last = {
      msg_type: m.msg_type,
      content: m.content,
      sender_id: m.sender_id,
      create_time_ms: m.create_time_ms,
    };
    if (conv) {
      patchConv(m.conv_id, {
        last_msg: last,
        updated_ms: m.create_time_ms,
        unread: isActive || m.sender_id === myId ? conv.unread : conv.unread + 1,
      });
    }

    if (isActive && m.seq > 0) {
      // 当前会话：立即上报已读水位
      ws.read(m.conv_id, m.seq);
    } else if (m.sender_id !== myId) {
      // 非当前会话且非本人：桌面通知
      const title =
        conv?.group && m.sender_id !== myId
          ? `${conv.group.name} · ${senderNickname || '群成员'}`
          : conv?.peer
            ? conv.peer.remark || conv.peer.nickname || conv.peer.username
            : senderNickname || '新消息';
      void pushNotification(title, lastMsgPreview(last));
    }
  }

  /** WS 通知绑定（仅一次） */
  function bindRealtime(): void {
    if (get().bound) return;
    set({ bound: true });

    // 消息推送
    ws.onNotice('message.push', (payload) => {
      const p = MessagePush.decode(payload) as unknown as {
        message: RawSyncMsg;
        senderNickname: string;
      };
      if (!p.message) return;
      void ingestMessage(toHistory(p.message), p.senderNickname ?? '');
    });

    // 对端已读回执（一期单聊；仅展示用，会话列表无该字段则忽略）
    ws.onNotice('conv.read', (payload) => {
      const r = ConvReadNotice.decode(payload) as unknown as {
        convId: Long;
        userId: Long;
        readSeq: Long;
      };
      void longStr(r.convId);
      void r.readSeq.toNumber();
    });

    // 在线状态
    ws.onNotice('presence.change', (payload) => {
      const r = PresenceChangeNotice.decode(payload) as unknown as {
        userId: Long;
        online: boolean;
      };
      set((s) => ({
        presence: { ...s.presence, [longStr(r.userId)]: !!r.online },
      }));
    });

    // 群事件：会话列表/群信息需要刷新（新群、入群、退群、转让、资料变更）
    ws.onNotice('group.event', (payload) => {
      const r = GroupEventNotice.decode(payload) as unknown as {
        groupId: Long;
        eventType: string;
      };
      console.info('[group.event]', longStr(r.groupId), r.eventType);
      void get().refreshConversations();
    });

    // 重连后重新差量同步
    ws.onReopen = () => {
      void get().initialSync();
    };
  }

  return {
    conversations: [],
    friends: [],
    activeConvId: null,
    draftPeerId: null,
    messages: {},
    hasMore: {},
    presence: {},
    names: {},
    bound: false,

    reset: () =>
      set({
        conversations: [],
        friends: [],
        activeConvId: null,
        draftPeerId: null,
        messages: {},
        hasMore: {},
        presence: {},
        names: {},
        bound: false,
      }),

    bindRealtime,

    refreshConversations: async () => {
      const { conversations } = await api.listConversations();
      set({ conversations });
    },

    refreshFriends: async () => {
      const { friends } = await api.listFriends();
      set({ friends });
    },

    startDraft: (peerId) => set({ activeConvId: null, draftPeerId: peerId }),
    closeChat: () => set({ activeConvId: null, draftPeerId: null }),

    openConversation: async (convId) => {
      set({ activeConvId: convId, draftPeerId: null });
      const state = get();

      // 1) 本地缓存先渲染
      const cached = await getCachedMessages(convId);
      if (cached.length) {
        set((s) => ({ messages: { ...s.messages, [convId]: mergeMessages(s.messages[convId] ?? [], cached) } }));
      }

      // 2) REST 拉最新一页（seq 倒序，最新在前）
      try {
        const page = await api.listMessages(convId, undefined, 50);
        const restMsgs = [...page.messages].reverse();
        set((s) => ({
          messages: { ...s.messages, [convId]: mergeMessages(s.messages[convId] ?? [], restMsgs) },
          hasMore: { ...s.hasMore, [convId]: page.has_more },
        }));
        void cacheMessages(convId, restMsgs);
      } catch (e) {
        console.warn('[chat] 历史消息拉取失败:', e);
        return;
      }

      // 3) 未读清零并上报已读水位（取当前最大 seq）
      const now = get().messages[convId] ?? [];
      const maxSeq = now.reduce((m, x) => Math.max(m, x.seq), 0);
      const conv = state.conversations.find((c) => c.id === convId);
      if (conv?.unread) patchConv(convId, { unread: 0 });
      if (maxSeq > 0) ws.read(convId, maxSeq);
    },

    loadMore: async () => {
      const convId = get().activeConvId;
      if (!convId) return;
      const cur = get().messages[convId] ?? [];
      const beforeSeq = cur.find((m) => m.seq > 0)?.seq;
      if (!beforeSeq) return;
      const page = await api.listMessages(convId, beforeSeq, 50);
      const older = [...page.messages].reverse();
      set((s) => ({
        messages: { ...s.messages, [convId]: mergeMessages(older, s.messages[convId] ?? []) },
        hasMore: { ...s.hasMore, [convId]: page.has_more },
      }));
      void cacheMessages(convId, older);
    },

    initialSync: async () => {
      const convs = get().conversations;
      if (convs.length === 0) {
        await get().refreshConversations();
      }
      const list = get().conversations;
      // 游标优先取内存最大 seq，其次 SQLite；has_more 循环翻页（封顶 20 页防呆）
      for (const conv of list) {
        let cursor =
          get()
            .messages[conv.id]?.reduce((m, x) => Math.max(m, x.seq), 0) ?? 0;
        if (cursor === 0) cursor = await cachedMaxSeq(conv.id);
        for (let page = 0; page < 20; page++) {
          const batch = await ws.sync([{ conv_id: conv.id, has_seq: cursor }], 200);
          const b0 = batch.convs[0];
          if (!b0 || b0.messages.length === 0) break;
          const msgs = (b0.messages as unknown as RawSyncMsg[]).map(toHistory);
          set((s) => ({
            messages: { ...s.messages, [conv.id]: mergeMessages(s.messages[conv.id] ?? [], msgs) },
          }));
          void cacheMessages(conv.id, msgs);
          cursor = msgs.reduce((m, x) => Math.max(m, x.seq), cursor);
          if (!b0.hasMore) break;
        }
      }
      await get().refreshConversations();
    },

    sendText: async (textRaw) => {
      const text = textRaw.trim();
      if (!text) return;
      const { activeConvId, draftPeerId } = get();
      const myId = useAuth.getState().me?.id ?? '';
      const clientMsgId = uuid();
      // 本地回声（seq=0，ack 到达后按 client_msg_id 替换）
      const echo: HistoryMsg = {
        id: '',
        conv_id: activeConvId ?? '',
        sender_id: myId,
        msg_type: 1,
        content: text,
        seq: 0,
        client_msg_id: clientMsgId,
        create_time_ms: Date.now(),
      };

      // 已存在会话：先回声立即渲染；新懒建会话等 ack 落正式 conv_id 再渲染
      if (activeConvId) {
        set((s) => ({
          messages: { ...s.messages, [activeConvId]: mergeMessages(s.messages[activeConvId] ?? [], [echo]) },
        }));
      }

      const ack = await ws.sendMessage({
        client_msg_id: clientMsgId,
        conv_id: activeConvId ?? '0',
        to_uid: draftPeerId ?? '0',
        msg_type: 1,
        content: text,
      });
      const confirmed: HistoryMsg = {
        ...echo,
        id: ack.server_msg_id,
        conv_id: ack.conv_id,
        seq: ack.seq,
        create_time_ms: ack.create_time_ms,
      };

      // 懒建单聊：ack 落正式会话 → 切换并刷新列表
      if (!activeConvId) {
        set((s) => ({
          draftPeerId: null,
          activeConvId: ack.conv_id,
          messages: { ...s.messages, [ack.conv_id]: [confirmed] },
        }));
        ws.read(ack.conv_id, ack.seq);
        void get().refreshConversations();
        return;
      }

      // 用确认结果替换本地回声（mergeMessages 按 client_msg_id 幂等去重）
      set((s) => ({
        messages: { ...s.messages, [activeConvId]: mergeMessages(s.messages[activeConvId] ?? [], [confirmed]) },
      }));
    },

    sendFileMessage: async (file, kind) => {
      const { activeConvId, draftPeerId } = get();
      const up = await api.upload(file, kind);
      const content = JSON.stringify({
        file_id: up.file_id,
        name: up.name,
        size: up.size,
        mime: up.mime,
        width: up.width ?? undefined,
        height: up.height ?? undefined,
      });
      const clientMsgId = uuid();
      const myId = useAuth.getState().me?.id ?? '';
      const echo: HistoryMsg = {
        id: '',
        conv_id: activeConvId ?? '',
        sender_id: myId,
        msg_type: kind === 'image' ? 2 : 3,
        content,
        seq: 0,
        client_msg_id: clientMsgId,
        create_time_ms: Date.now(),
      };
      if (!activeConvId) {
        // 新单聊：等 ack 后再落消息区，避免消息挂到空键
      } else {
        set((s) => ({
          messages: { ...s.messages, [activeConvId]: mergeMessages(s.messages[activeConvId] ?? [], [echo]) },
        }));
      }
      const ack = await ws.sendMessage({
        client_msg_id: clientMsgId,
        conv_id: activeConvId ?? '0',
        to_uid: draftPeerId ?? '0',
        msg_type: kind === 'image' ? 2 : 3,
        content,
      });
      const confirmed: HistoryMsg = {
        ...echo,
        id: ack.server_msg_id,
        conv_id: ack.conv_id,
        seq: ack.seq,
        create_time_ms: ack.create_time_ms,
      };
      if (!activeConvId) {
        set((s) => ({
          draftPeerId: null,
          activeConvId: ack.conv_id,
          messages: { ...s.messages, [ack.conv_id]: [confirmed] },
        }));
        ws.read(ack.conv_id, ack.seq);
        void get().refreshConversations();
      } else {
        set((s) => ({
          messages: { ...s.messages, [activeConvId]: mergeMessages(s.messages[activeConvId] ?? [], [confirmed]) },
        }));
      }
    },

    setNames: (entries) =>
      set((s) => {
        const names = { ...s.names };
        for (const [uid, name] of entries) if (name) names[uid] = name;
        return { names };
      }),
  };
});
