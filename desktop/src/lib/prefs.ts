// 全局用户偏好（跨账号）：记住密码、已阅读并同意等
import { secretGet, secretSave } from './keyring';

const PREFS_KEY = 'iris.prefs';

export interface UserPrefs {
  rememberPassword: boolean; // 记住密码（默认 true）
  agreedTerms: boolean;      // 已阅读并同意协议（默认 false）
}

const DEFAULTS: UserPrefs = {
  rememberPassword: true,
  agreedTerms: false,
};

/** 读取全局偏好 */
export async function loadPrefs(): Promise<UserPrefs> {
  const raw = await secretGet(PREFS_KEY);
  if (!raw) return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

/** 保存全局偏好 */
export async function savePrefs(prefs: Partial<UserPrefs>): Promise<void> {
  const current = await loadPrefs();
  await secretSave(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
}
