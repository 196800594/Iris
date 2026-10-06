// 右侧资料栏：单聊=好友资料（备注修改/删除好友）；群聊=群资料（公告/成员/邀请/退群）
import { useEffect, useState } from 'react';
import { api } from '../lib/rest';
import { useAuth } from '../store/auth';
import { useChat } from '../store/chat';
import type { Conversation, GroupDetail } from '../types/api';
import { Avatar } from './Avatar';

interface Props {
  conv: Conversation;
  onClose: () => void;
}

export function RightPanel({ conv, onClose }: Props) {
  return (
    <aside className="right-panel animate-drawer-in">
      <div className="right-head">
        <span>{conv.conv_type === 2 ? '群资料' : '好友资料'}</span>
        <button type="button" className="icon-btn" onClick={onClose} title="关闭">
          ×
        </button>
      </div>
      {conv.conv_type === 2 ? <GroupInfo conv={conv} /> : <PeerInfo conv={conv} />}
    </aside>
  );
}

function PeerInfo({ conv }: { conv: Conversation }) {
  const peer = conv.peer;
  const refreshFriends = useChat((s) => s.refreshFriends);
  const [remark, setRemark] = useState(peer?.remark ?? '');
  if (!peer) return null;

  const saveRemark = async () => {
    await api.setRemark(peer.id, remark.trim());
    await refreshFriends();
    alert('备注已更新');
  };
  const del = async () => {
    if (!confirm(`删除好友「${peer.nickname}」？`)) return;
    await api.deleteFriend(peer.id);
    await refreshFriends();
    await useChat.getState().refreshConversations();
  };

  return (
    <div className="profile-card">
      <div className="profile-top">
        <Avatar fileId={peer.avatar_file_id} name={peer.nickname} size={64} />
        <div>
          <div className="profile-name">{peer.remark || peer.nickname}</div>
          <div className="friend-sub">@{peer.username}</div>
        </div>
      </div>
      <label className="field-label" htmlFor="remark-input">
        备注名
      </label>
      <div className="search-row">
        <input id="remark-input" value={remark} maxLength={32} onChange={(e) => setRemark(e.target.value)} />
        <button type="button" className="mini-btn" onClick={() => void saveRemark()}>
          保存
        </button>
      </div>
      <button type="button" className="mini-btn danger block" onClick={() => void del()}>
        删除好友
      </button>
    </div>
  );
}

function GroupInfo({ conv }: { conv: Conversation }) {
  // 群资料接口用 group_id，而非会话行 id（群会话两者不同）
  const gid = conv.group?.id ?? conv.id;
  const friends = useChat((s) => s.friends);
  const refreshConversations = useChat((s) => s.refreshConversations);
  const myId = useAuth((s) => s.me?.id);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  // 群主可编辑的群名/公告（编辑态）
  const [editName, setEditName] = useState('');
  const [editAnnounce, setEditAnnounce] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setDetail(null);
    setLoadErr('');
    api
      .groupDetail(gid)
      .then((d) => {
        if (!alive) return;
        setDetail(d);
        useChat
          .getState()
          .setNames(d.members.map((m) => [m.user_id, m.nickname]));
      })
      .catch((e: unknown) => {
        if (alive) setLoadErr(e instanceof Error ? e.message : '群资料加载失败');
      });
    return () => {
      alive = false;
    };
  }, [gid]);

  if (loadErr) return <div className="hint">群资料加载失败：{loadErr}</div>;
  if (!detail) return <div className="hint">加载中…</div>;

  const memberIds = new Set(detail.members.map((m) => m.user_id));
  const invitable = friends.filter((f) => !memberIds.has(f.id));

  const invite = async () => {
    if (picked.size === 0 || busy) return;
    setBusy(true);
    try {
      await api.invite(gid, [...picked]);
      setDetail(await api.groupDetail(gid));
      setPicked(new Set());
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!confirm(`退出群聊「${detail.name}」？`)) return;
    await api.leaveGroup(gid);
    await refreshConversations();
  };

  const roleLabel = (role: number) => (role === 1 ? '群主' : role === 2 ? '管理员' : '');

  // 我是群主（role=1）才可改群名/公告/邀请
  const isOwner = detail.owner_id === myId;

  const startEditProfile = () => {
    setEditName(detail!.name);
    setEditAnnounce(detail!.announcement ?? '');
  };
  const saveProfile = async () => {
    const name = editName.trim();
    if (saving) return;
    if (!name) {
      alert('群名不能为空');
      return;
    }
    setSaving(true);
    try {
      await api.updateGroup(gid, { name, announcement: editAnnounce.trim() });
      setDetail(await api.groupDetail(gid));
      await refreshConversations();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-card">
      <div className="profile-top">
        <Avatar fileId={detail.avatar_file_id} name={detail.name} size={64} />
        <div>
          <div className="profile-name">
            {detail.name}
            {isOwner && (
              <button
                type="button"
                className="mini-btn"
                style={{ marginLeft: 8 }}
                onClick={startEditProfile}
              >
                编辑
              </button>
            )}
          </div>
          <div className="friend-sub">
            {detail.member_count}/{detail.max_members} 人
          </div>
        </div>
      </div>
      {isOwner && (editName !== '' || saving) && (
        <div className="announce">
          <div className="field-label">群名称</div>
          <input
            value={editName}
            maxLength={64}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="群名称（1-64 字）"
          />
          <div className="field-label" style={{ marginTop: 8 }}>
            群公告
          </div>
          <textarea
            value={editAnnounce}
            maxLength={500}
            rows={3}
            onChange={(e) => setEditAnnounce(e.target.value)}
            placeholder="群公告（最长 500 字）"
          />
          <div className="search-row" style={{ marginTop: 6 }}>
            <button
              type="button"
              className="mini-btn primary"
              disabled={saving}
              onClick={() => void saveProfile()}
            >
              {saving ? '保存中…' : '保存'}
            </button>
            <button
              type="button"
              className="mini-btn"
              disabled={saving}
              onClick={() => {
                setEditName('');
                setEditAnnounce('');
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
      {detail.announcement && (
        <div className="announce">
          <div className="field-label">群公告</div>
          <div className="announce-body">{detail.announcement}</div>
        </div>
      )}
      <div className="field-label">群成员</div>
      <div className="member-list">
        {detail.members.map((m) => (
          <div className="member-row" key={m.user_id}>
            <Avatar fileId={m.avatar_file_id} name={m.nickname} size={32} />
            <span className="member-name">
              {m.nickname}
              {roleLabel(m.role) && <em className="role-tag">{roleLabel(m.role)}</em>}
            </span>
          </div>
        ))}
      </div>
      {invitable.length > 0 && (
        <>
          <div className="field-label">邀请好友入群</div>
          <div className="member-list">
            {invitable.map((f) => (
              <label className="member-row pick" key={f.id}>
                <input type="checkbox" checked={picked.has(f.id)} onChange={() => setPicked((p) => toggleSet(p, f.id))} />
                <Avatar fileId={f.avatar_file_id} name={f.nickname} size={28} />
                <span className="member-name">{f.remark || f.nickname}</span>
              </label>
            ))}
          </div>
          <button type="button" className="mini-btn primary block" disabled={picked.size === 0 || busy} onClick={() => void invite()}>
            {busy ? '邀请中…' : `邀请入群（${picked.size}）`}
          </button>
        </>
      )}
      <button type="button" className="mini-btn danger block" onClick={() => void leave()}>
        退出群聊
      </button>
    </div>
  );
}

/** 小工具：复制 Set 后增删（避免上面的三元写法歧义） */
function toggleSet(prev: Set<string>, id: string): Set<string> {
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
