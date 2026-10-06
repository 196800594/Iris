// 会话列表（第二栏）：头像、名称、最后消息预览、时间、未读红点
import { useMemo } from 'react';
import { useChat } from '../store/chat';
import { formatTime, lastMsgPreview } from '../lib/format';
import type { Conversation } from '../types/api';
import { Avatar } from './Avatar';

function convName(c: Conversation): string {
  if (c.conv_type === 2) return c.group?.name ?? '群聊';
  return c.peer?.remark || c.peer?.nickname || c.peer?.username || '…';
}

export function ConversationList({ filter = '' }: { filter?: string }) {
  const conversations = useChat((s) => s.conversations);
  const activeConvId = useChat((s) => s.activeConvId);
  const openConversation = useChat((s) => s.openConversation);
  const presence = useChat((s) => s.presence);

  const q = filter.trim().toLowerCase();
  const sorted = useMemo(
    () =>
      [...conversations]
        .sort((a, b) => b.updated_ms - a.updated_ms)
        .filter((c) => !q || convName(c).toLowerCase().includes(q)),
    [conversations, q],
  );

  return (
    <div className="conv-list">
      {sorted.length === 0 && <div className="list-empty">还没有会话，去「联系人」添加好友开始聊天吧</div>}
      {sorted.map((c) => {
        const active = c.id === activeConvId;
        const online = c.peer ? presence[c.peer.id] : undefined;
        return (
          <button
            type="button"
            key={c.id}
            className={`conv-item ${active ? 'active' : ''}`}
            onClick={() => void openConversation(c.id)}
          >
            <span className="conv-avatar">
              <Avatar
                fileId={c.conv_type === 2 ? c.group?.avatar_file_id ?? null : c.peer?.avatar_file_id ?? null}
                name={convName(c)}
                size={44}
              />
              {c.conv_type === 1 && online && <span className="online-dot" title="在线" />}
            </span>
            <span className="conv-main">
              <span className="conv-line1">
                <span className="conv-name">{convName(c)}</span>
                <span className="conv-time">
                  {c.last_msg ? formatTime(c.last_msg.create_time_ms) : ''}
                </span>
              </span>
              <span className="conv-line2">
                <span className="conv-preview">{c.last_msg ? lastMsgPreview(c.last_msg) : ''}</span>
                {c.unread > 0 && <span className="unread-badge animate-pulse-badge">{c.unread > 99 ? '99+' : c.unread}</span>}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
