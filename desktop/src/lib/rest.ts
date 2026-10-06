// REST 客户端：Bearer 注入、1002 自动 refresh 重放、业务信封 {code,msg} 解包、multipart 上传
import { V1 } from './config';
import { invoke } from '@tauri-apps/api/core';
import { secretDelete, secretGet, secretSave, secretKeys, isTauri } from './keyring';
import type {
  Conversation,
  Friend,
  FriendRequestItem,
  GroupApplicationItem,
  GroupDetail,
  HistoryMsg,
  MeInfo,
  SignedUrls,
  UploadResp,
} from '../types/api';

/** 业务错误（code/msg 对齐计划书 5.3） */
export class ApiError extends Error {
  code: number;
  constructor(code: number, msg: string) {
    super(msg);
    this.code = code;
  }
}

// 内存中的令牌对（启动时从 keyring 恢复；避免每个请求 await 凭据库）
let accessToken: string | null = null;
let refreshToken: string | null = null;
/** 登出回调（store 注入：令牌不可恢复时切回登录页） */
let onForceLogout: (() => void) | null = null;

export function setForceLogoutHandler(fn: () => void): void {
  onForceLogout = fn;
}

/** 启动时从 keyring 恢复令牌（带重试：Windows 凭据管理器存在跨窗口同步延迟） */
export async function restoreTokens(): Promise<boolean> {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    const access = await secretGet(secretKeys.access);
    const refresh = await secretGet(secretKeys.refresh);
    if (access && refresh) {
      await invoke('debug_log', { message: `restoreTokens: 成功 (第${i + 1}次尝试)` });
      accessToken = access;
      refreshToken = refresh;
      return true;
    }
    await invoke('debug_log', {
      message: `restoreTokens: 第${i + 1}次失败 access=${access ? 'yes' : 'null'} refresh=${refresh ? 'yes' : 'null'}`,
    });
    if (i < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  accessToken = null;
  refreshToken = null;
  return false;
}

/** 保存令牌对（内存 + keyring） */
export async function saveTokens(access: string, refresh: string): Promise<void> {
  accessToken = access;
  refreshToken = refresh;
  const tauri = isTauri();
  await invoke('debug_log', { message: `saveTokens: isTauri=${tauri}, access_len=${access.length}` });
  await secretSave(secretKeys.access, access);
  await secretSave(secretKeys.refresh, refresh);
  await invoke('debug_log', { message: `saveTokens: secretSave 完成` });
}

/** 清除令牌（登出/refresh 失败） */
export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await secretDelete(secretKeys.access);
  await secretDelete(secretKeys.refresh);
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** 获取当前内存中的令牌对（用于存入多账号凭据） */
export function getTokens(): { access: string | null; refresh: string | null } {
  return { access: accessToken, refresh: refreshToken };
}

/** 用 refresh_token 换新令牌对；失败抛错 */
async function doRefresh(): Promise<void> {
  const resp = await fetch(`${V1}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await resp.json();
  if (data.code !== 0) throw new ApiError(data.code, data.msg ?? '刷新令牌失败');
  await saveTokens(data.access_token, data.refresh_token);
}

/** 核心请求：JSON in/out，自动注入 Bearer，1002 单次刷新重放 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: { auth?: boolean; retry?: boolean; token?: string } = {},
): Promise<T> {
  const { auth = true, retry = true, token } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // 显式 token（如登录页多账号头像，各自用各账号令牌）优先于全局令牌
  const bearer = token ?? accessToken;
  if (auth && bearer) headers.Authorization = `Bearer ${bearer}`;

  // 15 秒超时，避免服务端无响应时前端无限挂起
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);

  let resp: Response;
  try {
    resp = await fetch(`${V1}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  const data = (await resp.json().catch(() => ({ code: 5000, msg: '响应解析失败' }))) as Record<
    string,
    unknown
  > & { code?: number; msg?: string };

  // 两类成功体：信封 {code:0,...} 或裸业务对象（login/register/upload/sign 等无 code 字段）
  const bizOk = data.code === undefined || data.code === 0;
  if (data.code === 1002 && auth && retry && refreshToken && !token) {
    // 全局令牌 access 过期：refresh 后原请求重放一次。
    // 注意：显式 token（其它账号）不走全局 refresh，避免串号，直接交由调用方兜底。
    try {
      await doRefresh();
    } catch {
      await clearTokens();
      onForceLogout?.();
      throw new ApiError(1002, '登录已过期，请重新登录');
    }
    return request<T>(method, path, body, { ...opts, retry: false });
  }
  if (!bizOk) {
    if (data.code === 1001 && auth && !token) {
      // 未登录（refresh 也无效）→ 回登录页；显式 token（其它账号）失败不影响全局会话
      await clearTokens();
      onForceLogout?.();
    }
    throw new ApiError(data.code ?? resp.status, data.msg ?? '请求失败');
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// API 集合（与 im-logic 路由表一一对应）
// ---------------------------------------------------------------------------

export const api = {
  // ---- 账号 ----
  emailCode(email: string, purpose: 'register' | 'reset') {
    return request<{ sent: boolean; cooldown_seconds: number }>(
      'POST',
      '/auth/email-code',
      { email, purpose },
      { auth: false },
    );
  },
  register(username: string, nickname: string, email: string, password: string, code: string) {
    return request<{ user_id: string }>('POST', '/auth/register', {
      username,
      nickname,
      email,
      password,
      code,
    }, { auth: false });
  },
  login(account: string, password: string) {
    return request<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
    }>('POST', '/auth/login', { account, password }, { auth: false });
  },
  resetPassword(email: string, code: string, newPassword: string) {
    return request<{ code: number; msg: string }>(
      'POST',
      '/auth/reset-password',
      { email, code, new_password: newPassword },
      { auth: false },
    );
  },
  logout() {
    return request('POST', '/auth/logout', { refresh_token: refreshToken }).finally(() =>
      clearTokens(),
    );
  },
  wsTicket() {
    return request<{ ticket: string; expires_in: number }>('POST', '/ws/ticket');
  },

  // ---- 资料 ----
  me(): Promise<MeInfo & { code?: number }> {
    return request('GET', '/users/me');
  },
  patchMe(patch: {
    nickname?: string;
    // 雪花 ID 超 JS 安全整数，统一字符串传输（服务端兼容数字/字符串）
    avatar_file_id?: string | number | null;
    gender?: number;
    signature?: string;
  }) {
    return request('PATCH', '/users/me', patch);
  },
  searchUsers(q: string, cursor = 0) {
    return request<{ users: MeInfo[]; next_cursor: string | null }>(
      'GET',
      `/users/search?q=${encodeURIComponent(q)}&cursor=${cursor}`,
    );
  },
  getUser(id: string) {
    return request<MeInfo>('GET', `/users/${id}`);
  },

  // ---- 好友 ----
  listFriends() {
    return request<{ friends: Friend[] }>('GET', '/contacts/friends');
  },
  listFriendRequests(direction: 'incoming' | 'outgoing' = 'incoming') {
    return request<{ requests: FriendRequestItem[] }>(
      'GET',
      `/contacts/requests?direction=${direction}`,
    );
  },
  applyFriend(toUid: string, greeting = '') {
    return request('POST', '/contacts/requests', { to_uid: toUid, greeting });
  },
  acceptFriend(id: string) {
    return request('POST', `/contacts/requests/${id}/accept`);
  },
  rejectFriend(id: string) {
    return request('POST', `/contacts/requests/${id}/reject`);
  },
  setRemark(uid: string, remark: string) {
    return request('PUT', `/contacts/friends/${uid}/remark`, { remark });
  },
  deleteFriend(uid: string) {
    return request('DELETE', `/contacts/friends/${uid}`);
  },

  // ---- 会话与历史 ----
  listConversations() {
    return request<{ conversations: Conversation[] }>('GET', '/conversations');
  },
  listMessages(convId: string, beforeSeq?: number, limit = 50) {
    const q = new URLSearchParams({ limit: String(limit) });
    if (beforeSeq !== undefined) q.set('before_seq', String(beforeSeq));
    return request<{ messages: HistoryMsg[]; next_before_seq: number | null; has_more: boolean }>(
      'GET',
      `/conversations/${convId}/messages?${q.toString()}`,
    );
  },

  // ---- 群 ----
  createGroup(name: string, memberIds: string[]) {
    return request<{ group_id: string }>('POST', '/groups', {
      name,
      member_ids: memberIds,
    });
  },
  groupDetail(id: string): Promise<GroupDetail> {
    return request('GET', `/groups/${id}`);
  },
  updateGroup(id: string, patch: { name?: string; announcement?: string }) {
    return request('PATCH', `/groups/${id}`, patch);
  },
  invite(id: string, userIds: string[]) {
    return request('POST', `/groups/${id}/invite`, { user_ids: userIds });
  },
  applyJoinGroup(id: string, message = '') {
    return request('POST', `/groups/${id}/applications`, { message });
  },
  listGroupApplications() {
    return request<{ applications: GroupApplicationItem[] }>('GET', '/groups/applications');
  },
  acceptGroupApplication(id: string) {
    return request('POST', `/groups/applications/${id}/accept`);
  },
  rejectGroupApplication(id: string) {
    return request('POST', `/groups/applications/${id}/reject`);
  },
  addAdmin(groupId: string, userId: string) {
    return request('POST', `/groups/${groupId}/admins`, { user_id: userId });
  },
  removeAdmin(groupId: string, userId: string) {
    return request('DELETE', `/groups/${groupId}/admins/${userId}`);
  },
  transferOwner(groupId: string, newOwnerId: string) {
    return request('POST', `/groups/${groupId}/transfer`, {
      new_owner_id: newOwnerId,
    });
  },
  leaveGroup(id: string) {
    return request('POST', `/groups/${id}/leave`);
  },

  // ---- 文件 ----
  async upload(file: File, kind: 'image' | 'file' | 'avatar'): Promise<UploadResp> {
    const form = new FormData();
    form.append('kind', kind);
    form.append('file', file);
    const resp = await fetch(`${V1}/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      body: form,
    });
    const data = (await resp.json()) as { code?: number; msg?: string } & UploadResp;
    // 上传成功返回裸对象（无 code 字段）；仅显式非零 code 视为错误
    if (typeof data.code === 'number' && data.code !== 0) {
      throw new ApiError(data.code, data.msg ?? '上传失败');
    }
    return data;
  },
  signFile(fileId: string, token?: string): Promise<SignedUrls> {
    return request('GET', `/files/${fileId}/sign`, undefined, token ? { token } : {});
  },
};
