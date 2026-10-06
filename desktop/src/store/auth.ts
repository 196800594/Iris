// 账号状态：令牌恢复、登录/注册/登出、ForceKick 联动 WS 与聊天数据
// 双窗口模型：登录窗只负责拿令牌+取 me；主窗口挂载时才 enterApp（建缓存/绑 WS/连 socket）
import { create } from 'zustand';
import { api, clearTokens, restoreTokens, saveTokens, setForceLogoutHandler } from '../lib/rest';
import { ws } from '../lib/ws';
import { initCache } from '../lib/db';
import { backToLogin } from '../lib/window';
import { useChat } from './chat';
import { invoke } from '@tauri-apps/api/core';
import type { MeInfo } from '../types/api';

/** 前端日志输出到 Rust 终端（便于排查） */
async function dlog(msg: string) {
  try { await invoke('debug_log', { message: msg }); } catch { /* ignore */ }
}

interface AuthState {
  me: MeInfo | null;
  booting: boolean;
  online: boolean;
  /** 启动：仅恢复令牌 + 取 me（不启动 WS；主窗口需再调 enterApp） */
  boot: () => Promise<void>;
  /** 主窗口专用：建缓存、绑 WS 事件、拉会话/好友、建连 */
  enterApp: () => Promise<void>;
  login: (account: string, password: string) => Promise<void>;
  /** 用已保存的令牌对直接登录（多账号切换用） */
  loginWithToken: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setOnline: (v: boolean) => void;
}

/** 被踢/令牌失效的统一处理：清状态并返回登录窗 */
async function handleForceLogout() {
  await clearTokens();
  useChat.getState().reset();
  useAuth.setState({ me: null, online: false });
  await backToLogin();
}

/** 主窗口装配：缓存库、WS 事件、连接、会话首刷 */
async function setupAfterLogin(_me: MeInfo): Promise<void> {
  await initCache();
  const chat = useChat.getState();
  chat.bindRealtime();
  ws.onKicked = async (reason) => {
    console.warn('[ws] kicked:', reason);
    await handleForceLogout();
  };
  ws.onStatus = (online) => useAuth.setState({ online });
  await Promise.all([useChat.getState().refreshConversations(), useChat.getState().refreshFriends()]);
  await ws.start();
}

export const useAuth = create<AuthState>((set) => ({
  me: null,
  booting: true,
  online: false,

  setOnline: (v) => set({ online: v }),

  // 仅恢复令牌 + 取 me；WS 留给主窗口的 enterApp
  boot: async () => {
    setForceLogoutHandler(() => {
      void handleForceLogout();
    });
    try {
      const ok = await restoreTokens();
      await dlog(`boot restoreTokens ok=${ok}`);
      if (!ok) {
        set({ booting: false });
        return;
      }
      const me = await api.me();
      await dlog(`boot api.me 成功 user=${me?.username}`);
      set({ me });
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      await dlog(`boot 失败: ${msg}`);
      await clearTokens();
      set({ me: null });
    } finally {
      set({ booting: false });
    }
  },

  // 主窗口挂载后调用
  enterApp: async () => {
    const me = useAuth.getState().me;
    if (!me) return;
    await setupAfterLogin(me);
  },

  login: async (account, password) => {
    const tokens = await api.login(account.trim(), password);
    await dlog(`login 成功, access_token 前20位=${tokens.access_token.slice(0, 20)}`);
    await saveTokens(tokens.access_token, tokens.refresh_token);
    await dlog(`saveTokens 完成`);
    const me = await api.me();
    await dlog(`login api.me 成功 user=${me?.username}`);
    set({ me });
  },

  loginWithToken: async (access, refresh) => {
    await saveTokens(access, refresh);
    const me = await api.me();
    set({ me });
  },

  refreshMe: async () => {
    const me = await api.me();
    set({ me });
  },

  logout: async () => {
    ws.stop();
    try {
      await api.logout();
    } catch {
      await clearTokens();
    }
    useChat.getState().reset();
    set({ me: null, online: false });
    await backToLogin();
  },
}));
