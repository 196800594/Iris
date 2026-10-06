// 主界面（QQ NT 风格）：顶部用户栏 + 白色图标导航栏 + 列表栏（搜索+/弹出菜单）+ 消息区 + 右侧资料抽屉
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../store/auth';
import { useChat } from '../store/chat';
import { api } from '../lib/rest';
import type { Conversation } from '../types/api';
import {
  ChatIcon,
  ContactsIcon,
  PlusIcon,
  MenuIcon,
  ChatPlusIcon,
  PersonAddIcon,
  ChevronRightIcon,
  FavoriteMenuIcon,
  FolderMenuIcon,
  PaletteMenuIcon,
  ChatHistoryMenuIcon,
  UpdateMenuIcon,
  HelpMenuIcon,
  LockMenuIcon,
  SettingsMenuIcon,
  PowerMenuIcon,
} from './Icons';
import { Composer } from './Composer';
import { ContactsPanel } from './ContactsPanel';
import { ConversationList } from './ConversationList';
import { MessageList } from './MessageList';
import { RightPanel } from './RightPanel';
import { SelfProfileModal } from './SelfProfileModal';
import { MainHeader } from './MainHeader';
import { onChatRefresh, openChildWindow } from '../lib/window';

type Rail = 'chats' | 'contacts';

const APP_VERSION = '0.1.0';

export function MainLayout() {
  const logout = useAuth((s) => s.logout);
  const conversations = useChat((s) => s.conversations);
  const activeConvId = useChat((s) => s.activeConvId);
  const draftPeerId = useChat((s) => s.draftPeerId);
  const friends = useChat((s) => s.friends);
  const [rail, setRail] = useState<Rail>('chats');
  const [showRight, setShowRight] = useState(false);
  const [showMe, setShowMe] = useState(false);
  const [query, setQuery] = useState('');
  const [plusOpen, setPlusOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const plusBtnRef = useRef<HTMLButtonElement | null>(null);
  // 弹层使用 fixed 坐标（portal 到 body，避开导航栏/列表面板动画遗留的层叠上下文遮挡）
  const [menuPos, setMenuPos] = useState<{ left: number; bottom: number } | null>(null);
  const [plusPos, setPlusPos] = useState<{ right: number; top: number } | null>(null);

  const toggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    setPlusOpen(false);
    const r = menuBtnRef.current?.getBoundingClientRect();
    // 菜单底边与汉堡按钮底边齐平（同高度）
    setMenuPos(r ? { left: r.right + 4, bottom: window.innerHeight - r.bottom } : null);
    setMenuOpen(true);
  };

  const togglePlus = () => {
    if (plusOpen) {
      setPlusOpen(false);
      return;
    }
    setMenuOpen(false);
    const r = plusBtnRef.current?.getBoundingClientRect();
    setPlusPos(r ? { right: window.innerWidth - r.right, top: r.bottom + 8 } : null);
    setPlusOpen(true);
  };

  // Esc 关闭菜单；窗口尺寸变化时收起（fixed 坐标会失效）
  useEffect(() => {
    if (!menuOpen && !plusOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setPlusOpen(false);
      }
    };
    const onResize = () => {
      setMenuOpen(false);
      setPlusOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen, plusOpen]);

  // 轻量提示条
  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const comingSoon = () => {
    setMenuOpen(false);
    showToast('该功能即将开放，敬请期待');
  };

  // 检查更新：读取 Tauri 应用版本（无更新通道，提示当前版本）
  const checkUpdate = async () => {
    setMenuOpen(false);
    let v = APP_VERSION;
    try {
      const { getVersion } = await import('@tauri-apps/api/app');
      v = await getVersion();
    } catch {
      // 非 Tauri 环境用内置版本号
    }
    showToast(`当前已是最新版本 v${v}`);
  };

  // 切换会话时收起资料栏
  useEffect(() => {
    setShowRight(false);
  }, [activeConvId, draftPeerId]);

  // 登录后（含断线重连后）跑一次差量同步
  useEffect(() => {
    void useChat.getState().initialSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshPending = () => {
    api
      .listFriendRequests('incoming')
      .then((r) => setPendingCount(r.requests.filter((x) => x.status === 0).length))
      .catch(() => {});
  };

  // 未处理好友申请数
  useEffect(() => {
    refreshPending();
    const t = setInterval(refreshPending, 15000);
    return () => clearInterval(t);
  }, []);

  // 监听子窗口刷新事件（添加好友/发起群聊后刷新数据）
  useEffect(() => {
    const unlisten = onChatRefresh(() => {
      void useChat.getState().refreshFriends();
      void useChat.getState().refreshConversations();
      refreshPending();
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

  const totalUnread = useMemo(() => conversations.reduce((n, c) => n + (c.unread || 0), 0), [conversations]);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;
  // 新单聊草稿：用联系人资料合成一个临时会话对象（conv_id=0，首条消息由服务端懒建）
  const draftFriend = draftPeerId ? friends.find((f) => f.id === draftPeerId) : null;
  const displayConv: Conversation | null = activeConv
    ? activeConv
    : draftFriend
      ? {
          id: '',
          conv_type: 1,
          unread: 0,
          last_msg: null,
          peer: {
            id: draftFriend.id,
            username: draftFriend.username,
            nickname: draftFriend.nickname,
            avatar_file_id: draftFriend.avatar_file_id,
            remark: draftFriend.remark ?? '',
          },
          updated_ms: 0,
        }
      : null;

  const title = displayConv
    ? displayConv.conv_type === 2
      ? displayConv.group?.name ?? '群聊'
      : displayConv.peer?.remark || displayConv.peer?.nickname || displayConv.peer?.username || ''
    : '';

  return (
    <div className="app-shell qqnt-shell">
      <MainHeader onEditProfile={() => setShowMe(true)} />
      <div className="layout">
        {/* 左侧白色图标导航栏 */}
        <nav className="rail rail-light">
          <button
            type="button"
            className={`rail-btn ${rail === 'chats' ? 'active' : ''}`}
            title="消息"
            onClick={() => {
              setRail('chats');
              void useChat.getState().refreshConversations();
            }}
          >
            <ChatIcon className="rail-svg" />
            {totalUnread > 0 && <span className="rail-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>}
          </button>
          <button
            type="button"
            className={`rail-btn ${rail === 'contacts' ? 'active' : ''}`}
            title="通讯录"
            onClick={() => {
              setRail('contacts');
              void useChat.getState().refreshFriends();
              refreshPending();
            }}
          >
            <ContactsIcon className="rail-svg" />
            {pendingCount > 0 && <span className="rail-dot" />}
          </button>
          <div className="rail-spacer" />
          <div className="rail-menu-wrap">
            <button
              ref={menuBtnRef}
              type="button"
              className={`rail-btn ${menuOpen ? 'active' : ''}`}
              title="菜单"
              onClick={toggleMenu}
            >
              <MenuIcon className="rail-svg" />
            </button>
          </div>
        </nav>

        {/* 第二栏：搜索 + 列表 */}
        <section className="list-pane">
          <div className="list-pane-head">
            <div className="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={rail === 'chats' ? '搜索' : '搜索'}
              />
              {query && (
                <button type="button" className="search-clear" onClick={() => setQuery('')} title="清除">
                  ×
                </button>
              )}
            </div>
            <div className="plus-wrap">
              <button
                ref={plusBtnRef}
                type="button"
                className={`plus-btn ${plusOpen ? 'active' : ''}`}
                title="更多操作"
                onClick={togglePlus}
              >
                <PlusIcon />
              </button>
            </div>
          </div>
          {rail === 'chats' ? <ConversationList filter={query} /> : <ContactsPanel filter={query} pendingCount={pendingCount} onPendingChange={refreshPending} />}
        </section>

        {/* 第三栏：聊天区 */}
        <section className="chat-pane">
          {displayConv ? (
            <>
              <header className="chat-header">
                <div className="chat-title">{title}</div>
                <button
                  type="button"
                  className={`icon-btn info ${showRight ? 'on' : ''}`}
                  title="会话资料"
                  onClick={() => setShowRight((v) => !v)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="12" cy="8" r="1.2" fill="currentColor" />
                    <path d="M11 11h1v6h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </header>
              <MessageList
                conv={displayConv}
                draftName={draftFriend ? draftFriend.remark || draftFriend.nickname : undefined}
                draftAvatar={draftFriend?.avatar_file_id ?? null}
              />
              <Composer disabled={false} />
            </>
          ) : (
            <div className="chat-empty qqnt-empty">
              <svg className="empty-watermark" width="180" height="180" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.4V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="empty-watermark-text">蝶语</div>
            </div>
          )}
        </section>

        {/* 右侧资料抽屉（覆盖在聊天区上） */}
        {showRight && displayConv?.id && <RightPanel conv={displayConv} onClose={() => setShowRight(false)} />}
      </div>
      {showMe && <SelfProfileModal onClose={() => setShowMe(false)} />}

      {/* 汉堡主菜单（portal 到 body，避免被面板层叠上下文遮挡） */}
      {menuOpen &&
        createPortal(
          <>
            <div className="rail-menu-mask" onClick={() => setMenuOpen(false)} />
            <div
              className="rail-menu rail-menu-lg animate-scale-in"
              style={menuPos ? { position: 'fixed', left: menuPos.left, bottom: menuPos.bottom } : undefined}
            >
              {/* 顶部三宫格：收藏 / 文件 / 调色盘 */}
              <div className="rm-grid">
                <button type="button" className="rm-grid-item" onClick={comingSoon}>
                  <FavoriteMenuIcon />
                  <span>收藏</span>
                </button>
                <button type="button" className="rm-grid-item" onClick={comingSoon}>
                  <FolderMenuIcon />
                  <span>文件</span>
                </button>
                <button type="button" className="rm-grid-item" onClick={comingSoon}>
                  <PaletteMenuIcon />
                  <span>调色盘</span>
                </button>
              </div>
              <div className="rm-divider" />
              <button type="button" className="rm-item" onClick={comingSoon}>
                <ChatHistoryMenuIcon />
                <span>聊天记录管理</span>
              </button>
              <button type="button" className="rm-item" onClick={() => void checkUpdate()}>
                <UpdateMenuIcon />
                <span>检查更新</span>
              </button>
              <button
                type="button"
                className="rm-item"
                onClick={() => {
                  setMenuOpen(false);
                  setShowAbout(true);
                }}
              >
                <HelpMenuIcon />
                <span>帮助</span>
                <ChevronRightIcon className="rm-item-arrow" />
              </button>
              <button type="button" className="rm-item" onClick={comingSoon}>
                <LockMenuIcon />
                <span>锁定</span>
              </button>
              <button type="button" className="rm-item" onClick={comingSoon}>
                <SettingsMenuIcon />
                <span>设置</span>
              </button>
              <button
                type="button"
                className="rm-item"
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
              >
                <PowerMenuIcon />
                <span>退出账号</span>
              </button>
            </div>
          </>,
          document.body,
        )}

      {/* 「+」更多操作菜单 */}
      {plusOpen &&
        createPortal(
          <>
            <div className="rail-menu-mask" onClick={() => setPlusOpen(false)} />
            <div
              className="plus-menu animate-scale-in"
              style={plusPos ? { position: 'fixed', right: plusPos.right, top: plusPos.top } : undefined}
            >
              <button
                type="button"
                onClick={() => {
                  setPlusOpen(false);
                  void openChildWindow('create-group', 'create-group.html', {
                    title: '创建群聊',
                    width: 680,
                    height: 600,
                  });
                }}
              >
                <ChatPlusIcon />
                创建群聊
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlusOpen(false);
                  void openChildWindow('add-friend', 'add-friend.html', {
                    title: '加好友/群',
                    width: 620,
                    height: 560,
                  });
                }}
              >
                <PersonAddIcon />
                加好友/群
              </button>
            </div>
          </>,
          document.body,
        )}

      {/* 关于蝶语（帮助入口） */}
      {showAbout && (
        <div className="modal-mask animate-fade" onClick={() => setShowAbout(false)}>
          <div className="about-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="about-logo">蝶</div>
            <div className="about-name">蝶语 Iris</div>
            <div className="about-ver">桌面端 v{APP_VERSION}</div>
            <p className="about-desc">基于 Tauri + React 的即时通讯桌面端，支持单聊、群聊与好友管理。</p>
            <p className="about-foot">毕业设计作品 · 仅供学习演示</p>
            <button type="button" className="mini-btn primary" onClick={() => setShowAbout(false)}>
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* 轻量提示条 */}
      {toast && <div className="app-toast animate-toast-in">{toast}</div>}
    </div>
  );
}
