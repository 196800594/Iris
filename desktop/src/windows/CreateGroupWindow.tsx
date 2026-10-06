// 创建群聊窗口（QQ NT 两栏风格）：左栏搜索选择好友，右栏已选成员 + 确定/取消
import { useMemo, useState } from 'react';
import { api, ApiError } from '../lib/rest';
import { useChat } from '../store/chat';
import { Avatar } from '../components/Avatar';
import { WindowShell } from './WindowShell';
import { close, emitChatRefresh } from '../lib/window';

export function CreateGroupWindow() {
  const friends = useChat((s) => s.friends);
  const refreshConversations = useChat((s) => s.refreshConversations);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const filtered = friends.filter(
      (f) =>
        !kw ||
        f.nickname.toLowerCase().includes(kw) ||
        (f.remark ?? '').toLowerCase().includes(kw) ||
        f.username.toLowerCase().includes(kw),
    );
    // 已选好友排在前面
    return [...filtered].sort((a, b) => Number(picked.has(b.id)) - Number(picked.has(a.id)));
  }, [friends, q, picked]);

  const pickedFriends = useMemo(() => friends.filter((f) => picked.has(f.id)), [friends, picked]);

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const create = async () => {
    if (picked.size === 0 || busy) return;
    setBusy(true);
    try {
      await api.createGroup(`${picked.size + 1} 人群聊`, [...picked]);
      await refreshConversations();
      void emitChatRefresh();
      await close();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : (e as Error).message);
      setBusy(false);
    }
  };

  return (
    <WindowShell variant="plain">
      <div className="cg-win">
        {/* 左栏：搜索 + 好友选择 */}
        <div className="cg-left">
          <div className="cg-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              placeholder="搜索"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="cg-section-title">选择好友创建</div>

          <div className="cg-friend-list">
            {list.length === 0 && <div className="cg-empty">没有匹配的好友</div>}
            {list.map((f) => {
              const checked = picked.has(f.id);
              return (
                <button
                  type="button"
                  className={`cg-friend-row ${checked ? 'checked' : ''}`}
                  key={f.id}
                  onClick={() => toggle(f.id)}
                >
                  <span className={`cg-radio ${checked ? 'on' : ''}`}>
                    {checked && (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path d="M2.5 6.2 5 8.5 9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <Avatar fileId={f.avatar_file_id} name={f.remark || f.nickname} size={38} round />
                  <span className="cg-friend-name">{f.remark || f.nickname}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右栏：已选成员 + 操作 */}
        <div className="cg-right">
          <div className="cg-right-title">创建群聊</div>
          <div className="cg-picked-area">
            {pickedFriends.length === 0 ? (
              <div className="cg-picked-hint">选择左侧好友后，将在这里显示</div>
            ) : (
              <div className="cg-picked-grid">
                {pickedFriends.map((f) => (
                  <button
                    type="button"
                    className="cg-picked-item"
                    key={f.id}
                    title="移除"
                    onClick={() => toggle(f.id)}
                  >
                    <Avatar fileId={f.avatar_file_id} name={f.remark || f.nickname} size={46} round />
                    <span className="cg-picked-name">{f.remark || f.nickname}</span>
                    <span className="cg-picked-x">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="cg-footer">
            <span className="cg-count">{picked.size}/{friends.length}</span>
            <button
              type="button"
              className="cg-btn primary"
              disabled={picked.size === 0 || busy}
              onClick={() => void create()}
            >
              {busy ? '创建中…' : '确定'}
            </button>
            <button type="button" className="cg-btn" disabled={busy} onClick={() => void close()}>
              取消
            </button>
          </div>
        </div>
      </div>
    </WindowShell>
  );
}
