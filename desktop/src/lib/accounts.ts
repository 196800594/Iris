// 多账号凭据存储：将多个已登录账号的令牌+资料以 JSON 数组存入 OS 凭据管理器
// 键名 iris.accounts；活动会话令牌仍使用 iris.access / iris.refresh（供 REST 客户端）
import { secretGet, secretSave, secretDelete } from './keyring';

const ACCOUNTS_KEY = 'iris.accounts';

/** 已保存的账号（含令牌与展示资料） */
export interface SavedAccount {
  username: string;          // 登录名（唯一键）
  email: string;
  nickname: string;
  avatar_file_id: string | null;
  avatar_url: string | null; // 头像签名 URL（登录时缓存，选择器无需请求）
  access_token: string;
  refresh_token: string;
  password: string;          // 明文密码（记住密码时存，用于启动自动回填）
  auto_login: boolean;       // 是否勾选了自动登录
  last_used: number;         // 最近使用时间戳（ms）
}

/** 读取全部已保存账号（按最近使用倒序） */
export async function listAccounts(): Promise<SavedAccount[]> {
  const raw = await secretGet(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as SavedAccount[];
    if (!Array.isArray(arr)) return [];
    return arr.sort((a, b) => b.last_used - a.last_used);
  } catch {
    return [];
  }
}

/** 新增或更新一个账号（按 username 去重） */
export async function saveAccount(acc: SavedAccount): Promise<void> {
  const list = await listAccounts();
  const idx = list.findIndex((a) => a.username === acc.username);
  if (idx >= 0) list[idx] = acc;
  else list.push(acc);
  await secretSave(ACCOUNTS_KEY, JSON.stringify(list));
}

/** 删除指定账号 */
export async function removeAccount(username: string): Promise<void> {
  const list = await listAccounts();
  const next = list.filter((a) => a.username !== username);
  if (next.length === 0) {
    await secretDelete(ACCOUNTS_KEY);
  } else {
    await secretSave(ACCOUNTS_KEY, JSON.stringify(next));
  }
}

/** 取最近使用的账号 */
export async function getLastAccount(): Promise<SavedAccount | null> {
  const list = await listAccounts();
  return list[0] ?? null;
}
