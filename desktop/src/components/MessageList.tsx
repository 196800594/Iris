// 消息区：历史分页、文本/图片/文件/系统气泡、群聊发送者昵称、自动滚底
import { useEffect, useRef } from 'react';
import { useAuth } from '../store/auth';
import { useChat } from '../store/chat';
import { formatTime, parseMedia } from '../lib/format';
import type { Conversation, HistoryMsg } from '../types/api';
import { Avatar } from './Avatar';
import { FileMessage, ImageMessage } from './Media';

interface Props {
  conv: Conversation;
  /** 新单聊草稿对端（无 conv 时） */
  draftName?: string;
  draftAvatar?: string | null;
}

export function MessageList({ conv, draftName, draftAvatar }: Props) {
  const myId = useAuth((s) => s.me?.id ?? '');
  const messages = useChat((s) => (s.activeConvId ? s.messages[s.activeConvId] : [])) ?? [];
  const hasMore = useChat((s) => (s.activeConvId ? s.hasMore[s.activeConvId] : false));
  const friends = useChat((s) => s.friends);
  const names = useChat((s) => s.names);
  const loadMore = useChat((s) => s.loadMore);
  const boxRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);

  // 新消息后若在底部附近则自动滚到底部
  useEffect(() => {
    const el = boxRef.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const onScroll = () => {
    const el = boxRef.current;
    if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const senderName = (m: HistoryMsg): string => {
    if (m.sender_id === myId) return '我';
    if (conv.conv_type === 1) return conv.peer?.remark || conv.peer?.nickname || '';
    return names[m.sender_id] || friends.find((f) => f.id === m.sender_id)?.nickname || '成员';
  };
  const senderAvatar = (m: HistoryMsg): string | null => {
    if (conv.conv_type === 1) return conv.peer?.avatar_file_id ?? null;
    const f = friends.find((x) => x.id === m.sender_id);
    return f?.avatar_file_id ?? null;
  };

  return (
    <div className="msg-list" ref={boxRef} onScroll={onScroll}>
      {hasMore ? (
        <button type="button" className="load-more" onClick={() => void loadMore()}>
          加载更早消息
        </button>
      ) : (
        <div className="chat-tip">
          {conv.conv_type === 2 ? `群聊「${conv.group?.name ?? ''}」` : `与 ${draftName ?? conv.peer?.nickname ?? ''} 的对话`}
          {draftName ? '' : ' 已开始'}
        </div>
      )}
      {messages.map((m) => {
        const mine = m.sender_id === myId;
        const media = m.msg_type === 2 || m.msg_type === 3 ? parseMedia(m.content) : null;
        if (m.msg_type === 4) {
          // 群系统消息
          let text = m.content;
          try {
            text = (JSON.parse(m.content) as { text?: string }).text ?? m.content;
          } catch {
            /* 原样展示 */
          }
          return (
            <div className="msg-system" key={m.id || m.client_msg_id}>
              <span>{text}</span>
            </div>
          );
        }
        return (
          <div className={`msg-row ${mine ? 'mine' : ''} animate-message-in`} key={m.id || m.client_msg_id}>
            <Avatar
              fileId={mine ? useAuth.getState().me?.avatar_file_id ?? null : senderAvatar(m) ?? draftAvatar ?? null}
              name={senderName(m)}
              size={36}
            />
            <div className="msg-body">
              {conv.conv_type === 2 && !mine && <div className="msg-sender">{senderName(m)}</div>}
              <div className={`bubble bubble-${m.msg_type === 2 ? 'image' : m.msg_type === 3 ? 'file' : 'text'}`}>
                {m.msg_type === 1 && <span className="text-content">{m.content}</span>}
                {m.msg_type === 2 && media && <ImageMessage media={media} />}
                {m.msg_type === 3 && media && <FileMessage media={media} />}
              </div>
            </div>
            <span className="msg-time">{formatTime(m.create_time_ms)}</span>
          </div>
        );
      })}
    </div>
  );
}
