// 主窗口顶部栏（QQ NT 风格）：左侧品牌名 + 用户头像/昵称/签名，右侧窗口控制按钮
import { useEffect, useState } from 'react';
import { isTauri } from '../lib/keyring';
import { hideToTray, minimize, onPresenceChanged, toggleMaximize, type Presence } from '../lib/window';
import { useAuth } from '../store/auth';
import { Avatar } from './Avatar';

interface Props {
  onEditProfile: () => void;
}

/** 在线状态展示元数据：圆点颜色 + 文案。 */
const PRESENCE_META: Record<Presence, { color: string; label: string }> = {
  online: { color: '#22c96b', label: '我在线上' },
  away: { color: '#f5a623', label: '离开' },
  busy: { color: '#f63f5c', label: '忙碌' },
  dnd: { color: '#f63f5c', label: '请勿打扰' },
  invisible: { color: '#b5b5b5', label: '隐身' },
};

const PRESENCE_KEY = 'iris.presence';

function readStoredPresence(): Presence {
  const v = localStorage.getItem(PRESENCE_KEY);
  return v && v in PRESENCE_META ? (v as Presence) : 'online';
}

export function MainHeader({ onEditProfile }: Props) {
  const me = useAuth((s) => s.me);
  const showCtrls = isTauri();
  const [hover, setHover] = useState<'' | 'min' | 'max' | 'close'>('');
  const [presence, setPresence] = useState<Presence>(readStoredPresence);

  // 托盘菜单切换在线状态 → 顶栏圆点联动（持久化，下次启动恢复）
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void onPresenceChanged((p) => {
      setPresence(p);
      localStorage.setItem(PRESENCE_KEY, p);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, []);

  const meta = PRESENCE_META[presence];

  return (
    <header className="main-header" data-tauri-drag-region onDoubleClick={() => void toggleMaximize()}>
      <div className="main-header-left">
        <span className="main-header-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.4V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M8.5 9.5h7M8.5 12h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          蝶语
        </span>
        <button type="button" className="main-header-user" data-tauri-no-drag onClick={onEditProfile} title="编辑个人资料">
          <span className="main-header-avatar">
            <Avatar fileId={me?.avatar_file_id ?? null} name={me?.nickname ?? '?'} size={30} round />
            <span
              className="main-header-presence-dot"
              style={{ background: meta.color }}
              title={meta.label}
            />
          </span>
          <span className="main-header-nick">{me?.nickname ?? '…'}</span>
          <span className={`main-header-sign${me?.signature?.trim() ? ' has-sign' : ''}`}>
            {me?.signature?.trim() || '编辑个性签名'}
          </span>
        </button>
      </div>
      {showCtrls && (
        <div className="title-bar-ctrls" onMouseLeave={() => setHover('')}>
          <button
            type="button"
            className={`ctrl-btn ${hover === 'min' ? 'hover' : ''}`}
            title="最小化"
            onMouseEnter={() => setHover('min')}
            onClick={() => void minimize()}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <button
            type="button"
            className={`ctrl-btn ${hover === 'max' ? 'hover' : ''}`}
            title="最大化"
            onMouseEnter={() => setHover('max')}
            onClick={() => void toggleMaximize()}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <rect x="2.5" y="2.5" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <button
            type="button"
            className={`ctrl-btn close ${hover === 'close' ? 'hover' : ''}`}
            title="关闭到托盘"
            onMouseEnter={() => setHover('close')}
            onClick={() => void hideToTray()}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <line x1="3" y1="3" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="11" y1="3" x2="3" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
}
