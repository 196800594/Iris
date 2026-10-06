// 本地 SQLite 缓存（Rust 端 rusqlite 实现，前端只调 invoke）：
// - msg_cache：按 (conv_id, seq) 幂等落库，conv.sync 游标取本地最大 seq 做差量；
// - kv：预留的键值表（如本地偏好）。
// 仅在 Tauri 环境启用；浏览器纯前端调试时全部降级为空操作。
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from './keyring';
import type { HistoryMsg } from '../types/api';

let ready = false;

/** 打开/建库，应用启动登录成功后调用一次 */
export async function initCache(): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke('db_init');
    ready = true;
    console.log('[db] 数据库初始化成功');
  } catch (e) {
    console.warn('[db] initCache 失败，降级为无缓存模式:', e);
    ready = false;
  }
}

/** 批量幂等写入消息 */
export async function cacheMessages(convId: string, msgs: HistoryMsg[]): Promise<void> {
  if (!ready || msgs.length === 0) return;
  const valid = msgs.filter((m) => m.seq > 0);
  if (valid.length === 0) return;
  try {
    await invoke('db_cache_messages', {
      convId,
      msgs: valid.map((m) => [m.seq, JSON.stringify(m)]),
    });
  } catch (e) {
    console.warn('[db] cacheMessages 失败:', e);
  }
}

/** 读取本地缓存消息（seq 升序） */
export async function getCachedMessages(convId: string): Promise<HistoryMsg[]> {
  if (!ready) return [];
  try {
    const rows = await invoke<string[]>('db_get_messages', { convId });
    return rows.map((r) => JSON.parse(r) as HistoryMsg);
  } catch (e) {
    console.warn('[db] getCachedMessages 失败:', e);
    return [];
  }
}

/** 本地已知最大 seq（conv.sync 差量游标；无缓存返回 0） */
export async function cachedMaxSeq(convId: string): Promise<number> {
  if (!ready) return 0;
  try {
    return await invoke<number>('db_cached_max_seq', { convId });
  } catch (e) {
    console.warn('[db] cachedMaxSeq 失败:', e);
    return 0;
  }
}
