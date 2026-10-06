// 综合搜索窗口：搜索用户并添加好友（对标 QQ「加好友/群」综合搜索）
import { useMemo, useState } from 'react';
import { api, ApiError } from '../lib/rest';
import { useChat } from '../store/chat';
import { useAuth } from '../store/auth';
import type { MeInfo } from '../types/api';
import { Avatar } from '../components/Avatar';
import { WindowShell } from './WindowShell';
import { emitChatRefresh } from '../lib/window';

type Tab = 'all' | 'users' | 'groups';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'users', label: '用户' },
  { key: 'groups', label: '群聊' },
];

export function AddFriendWindow() {
  const [q, setQ] = useState('');
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [results, setResults] = useState<MeInfo[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState('');
  const [applying, setApplying] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [done, setDone] = useState<Set<string>>(new Set());
  const friends = useChat((s) => s.friends);
  const me = useAuth((s) => s.me);
  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);

  const search = async () => {
    const kw = q.trim();
    if (!kw || searching) return;
    setSearching(true);
    setSearched(false);
    setApplying(null);
    try {
      const r = await api.searchUsers(kw);
      setResults(r.users);
      setKeyword(kw);
      setSearched(true);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const sendApply = async (uid: string) => {
    setBusy(uid);
    try {
      await api.applyFriend(uid, greeting.trim() || `你好，我是 ${me?.nickname ?? ''}`.trim());
      setDone((d) => new Set(d).add(uid));
      setApplying(null);
      setGreeting('');
      void emitChatRefresh();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const showUsers = tab !== 'groups';

  return (
    <WindowShell title="综合搜索" variant="plain">
      <div className="search-win">
        {/* 搜索栏 */}
        <div className="search-win-bar">
          <div className="search-win-input">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              autoFocus
              placeholder="输入搜索关键词"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void search()}
            />
          </div>
          <button type="button" className="search-win-btn" disabled={searching || !q.trim()} onClick={() => void search()}>
            {searching ? '搜索中' : '搜索'}
          </button>
        </div>

        {/* Tabs */}
        <div className="search-win-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={tab === t.key ? 'active' : ''}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 结果区 */}
        <div className="search-win-results">
          {!searched && (
            <div className="search-win-hint">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.3" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <p>输入用户名、昵称或邮箱，查找你认识的人</p>
            </div>
          )}

          {searched && showUsers && results.length === 0 && (
            <div className="search-win-empty">未找到与「{keyword}」相关的用户</div>
          )}

          {searched && showUsers &&
            results.map((u) => {
              const isFriend = friendIds.has(u.id);
              const applied = done.has(u.id);
              return (
                <div className="user-result-row" key={u.id}>
                  <Avatar fileId={u.avatar_file_id} name={u.nickname} size={48} round />
                  <div className="user-result-main">
                    <div className="user-result-name">{u.nickname}</div>
                    <div className="user-result-sub">@{u.username}</div>
                    {u.signature && <div className="user-result-desc">{u.signature}</div>}
                  </div>
                  <div className="user-result-action">
                    {isFriend ? (
                      <span className="result-tag">已是好友</span>
                    ) : applied ? (
                      <span className="result-tag applied">已申请</span>
                    ) : applying === u.id ? (
                      <span className="apply-inline">
                        <input
                          autoFocus
                          placeholder="验证附言"
                          value={greeting}
                          maxLength={50}
                          onChange={(e) => setGreeting(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && void sendApply(u.id)}
                        />
                        <button type="button" className="mini-btn primary" disabled={busy === u.id} onClick={() => void sendApply(u.id)}>
                          发送
                        </button>
                        <button type="button" className="mini-btn" onClick={() => setApplying(null)}>
                          取消
                        </button>
                      </span>
                    ) : (
                      <button type="button" className="result-add-btn" onClick={() => { setApplying(u.id); setGreeting(`你好，我是 ${me?.nickname ?? ''}`); }}>
                        加好友
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {searched && tab === 'groups' && (
            <div className="search-win-empty">
              <p>群聊搜索即将开放</p>
              <span>你可以通过「创建群聊」邀请好友建群</span>
            </div>
          )}
        </div>
      </div>
    </WindowShell>
  );
}
