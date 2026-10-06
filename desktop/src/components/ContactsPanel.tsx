// 联系人面板（QQ NT 风格第二栏）：好友通知入口 + 好友/群聊分段切换
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/rest';
import { useChat } from '../store/chat';
import { Avatar } from './Avatar';
import { BellIcon, ChevronRightIcon } from './Icons';

interface Props {
  filter?: string;
  pendingCount: number;
  onPendingChange: () => void;
}

type Tab = 'friends' | 'groups';

interface RequestItem {
  id: string;
  user: { id: string; nickname: string; username: string; avatar_file_id: string | null };
  greeting: string;
  status: number;
}

export function ContactsPanel({ filter = '', pendingCount, onPendingChange }: Props) {
  const [tab, setTab] = useState<Tab>('friends');
  const [showRequests, setShowRequests] = useState(false);
  const q = filter.trim().toLowerCase();

  return (
    <div className="contacts-panel qqnt-contacts">
      {/* 好友通知入口 */}
      <button type="button" className="notice-row" onClick={() => setShowRequests((v) => !v)}>
        <span className="notice-icon">
          <BellIcon />
          {pendingCount > 0 && <span className="rail-badge">{pendingCount > 99 ? '99+' : pendingCount}</span>}
        </span>
        <span className="notice-label">好友通知</span>
        <ChevronRightIcon className={`notice-chevron ${showRequests ? 'open' : ''}`} />
      </button>
      {showRequests && <Requests onChanged={onPendingChange} />}

      {/* 好友 / 群聊 分段 */}
      <div className="seg-tabs">
        <button type="button" className={tab === 'friends' ? 'active' : ''} onClick={() => setTab('friends')}>
          好友
        </button>
        <button type="button" className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}>
          群聊
        </button>
      </div>
      {tab === 'friends' ? <Friends filter={q} /> : <Groups filter={q} />}
    </div>
  );
}

function Friends({ filter }: { filter: string }) {
  const friends = useChat((s) => s.friends);
  const startDraft = useChat((s) => s.startDraft);
  const list = useMemo(
    () =>
      friends.filter(
        (f) =>
          !filter ||
          f.nickname.toLowerCase().includes(filter) ||
          (f.remark ?? '').toLowerCase().includes(filter) ||
          f.username.toLowerCase().includes(filter),
      ),
    [friends, filter],
  );
  return (
    <div className="friend-list qqnt-list">
      {list.length === 0 && <div className="list-empty">还没有好友</div>}
      {list.map((f) => (
        <button type="button" className="contact-row" key={f.id} onClick={() => startDraft(f.id)}>
          <Avatar fileId={f.avatar_file_id} name={f.remark || f.nickname} size={38} round />
          <div className="contact-main">
            <div className="contact-name">{f.remark || f.nickname}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function Groups({ filter }: { filter: string }) {
  const conversations = useChat((s) => s.conversations);
  const openConversation = useChat((s) => s.openConversation);
  const groups = useMemo(
    () =>
      conversations
        .filter((c) => c.conv_type === 2)
        .filter((c) => !filter || (c.group?.name ?? '群聊').toLowerCase().includes(filter)),
    [conversations, filter],
  );
  return (
    <div className="friend-list qqnt-list">
      {groups.length === 0 && <div className="list-empty">还没有加入任何群聊</div>}
      {groups.map((c) => (
        <button type="button" className="contact-row" key={c.id} onClick={() => void openConversation(c.id)}>
          <Avatar fileId={c.group?.avatar_file_id ?? null} name={c.group?.name ?? '群聊'} size={38} round />
          <div className="contact-main">
            <div className="contact-name">{c.group?.name ?? '群聊'}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function Requests({ onChanged }: { onChanged: () => void }) {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string>('');

  const load = () => {
    void api.listFriendRequests('incoming').then((r) => {
      setItems(r.requests.map((x) => ({ id: x.id, user: x.user, greeting: x.greeting, status: x.status })));
      setLoaded(true);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (id: string, accept: boolean) => {
    setBusy(id);
    try {
      if (accept) await api.acceptFriend(id);
      else await api.rejectFriend(id);
      await Promise.all([useChat.getState().refreshFriends(), useChat.getState().refreshConversations()]);
      load();
      onChanged();
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="requests-panel">
      {!loaded && <div className="list-empty">加载中…</div>}
      {loaded && items.length === 0 && <div className="list-empty">暂无好友通知</div>}
      {items.map((r) => (
        <div className="request-row" key={r.id}>
          <Avatar fileId={r.user.avatar_file_id} name={r.user.nickname} size={38} round />
          <div className="contact-main">
            <div className="contact-name">{r.user.nickname}</div>
            <div className="contact-sub">{r.greeting || '（附言为空）'}</div>
          </div>
          {r.status === 0 ? (
            <span className="row-actions">
              <button type="button" className="mini-btn primary" disabled={busy === r.id} onClick={() => void act(r.id, true)}>
                接受
              </button>
              <button type="button" className="mini-btn" disabled={busy === r.id} onClick={() => void act(r.id, false)}>
                拒绝
              </button>
            </span>
          ) : (
            <span className="tag">{r.status === 1 ? '已接受' : '已拒绝'}</span>
          )}
        </div>
      ))}
    </div>
  );
}
