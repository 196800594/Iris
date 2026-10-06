// 令牌存储（计划书 8.3：Tauri 下走 OS 凭据管理器；普通浏览器调试时降级 localStorage）
import { invoke } from '@tauri-apps/api/core';

/**
 * 检测当前是否运行在 Tauri 原生环境。
 * Tauri 2 不再从 @tauri-apps/api/core 导出 isTauri，改用内部标记位判断。
 */
export function isTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as any).__TAURI_INTERNALS__
  );
}

/** keyring 条目键名（与 src-tauri/src/lib.rs 的用法对应） */
export const secretKeys = {
  access: 'iris.access',
  refresh: 'iris.refresh',
} as const;

/** 读取秘密；不存在返回 null */
export async function secretGet(key: string): Promise<string | null> {
  if (isTauri()) {
    const v = await invoke<string | null>('get_secret', { key });
    return v ?? null;
  }
  return localStorage.getItem(`secret:${key}`);
}

/** 写入秘密 */
export async function secretSave(key: string, value: string): Promise<void> {
  if (isTauri()) {
    await invoke('save_secret', { key, value });
  } else {
    localStorage.setItem(`secret:${key}`, value);
  }
}

/** 删除秘密 */
export async function secretDelete(key: string): Promise<void> {
  if (isTauri()) {
    await invoke('delete_secret', { key });
  } else {
    localStorage.removeItem(`secret:${key}`);
  }
}
