// 窗口控制：Tauri 原生窗口最小化/最大化/关闭（自定义标题栏用）
// 以及微信式双窗口切换：登录窗 ↔ 主窗口
import { isTauri } from './keyring';

const invoke = (name: string, args?: Record<string, unknown>) =>
  import('@tauri-apps/api/core').then((m) => m.invoke(name, args));

/** 获取当前窗口对象 */
async function currentWindow() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  return getCurrentWindow();
}

/** 最小化窗口；非 Tauri 环境静默。 */
export async function minimize() {
  if (!isTauri()) return;
  await invoke('win_minimize');
}

/** 切换最大化；非 Tauri 环境静默。 */
export async function toggleMaximize() {
  if (!isTauri()) return;
  await invoke('win_toggle_maximize');
}

/** 关闭当前窗口（用前端 API 直接 destroy，避免自定义 invoke 自销毁死锁）。非 Tauri 环境静默。 */
export async function close() {
  if (!isTauri()) return;
  try {
    const win = await currentWindow();
    await win.destroy();
  } catch {
    // destroy 失败时回退到 invoke
    try { await invoke('win_close'); } catch { /* ignore */ }
  }
}

/** 隐藏当前窗口到系统托盘（窗口与 WebView 保活，WS 不断线）。非 Tauri 环境静默。 */
export async function hideToTray() {
  if (!isTauri()) return;
  await invoke('win_hide');
}

/** 登录成功后打开主窗口（先隐藏创建）；主窗 boot 完成后再调 mainWindowReady 显示并销毁登录窗。 */
export async function openMainWindow() {
  if (!isTauri()) return;
  await invoke('open_main_window');
}

/** 主窗口前端 boot 完成：销毁登录窗 + 显示主窗。传入账号名用于托盘提示。 */
export async function mainWindowReady(account?: string) {
  if (!isTauri()) return;
  await invoke('main_window_ready', { account: account ?? null });
}

/** 登出后返回登录窗口：显示登录窗并由 Rust 侧异步销毁当前（主）窗口。
 *  不在前端 close()，避免在主窗自己的 invoke 回调里自销毁导致死锁。
 *  非 Tauri 环境静默。 */
export async function backToLogin() {
  if (!isTauri()) return;
  await invoke('back_to_login');
}

/** 返回当前窗口 label（login / main / unknown）。浏览器调试时返回 'browser'。 */
export async function currentLabel(): Promise<string> {
  if (!isTauri()) return 'browser';
  const win = await currentWindow();
  return win.label;
}

/** 打开子窗口（添加好友、发起群聊等）。非 Tauri 环境静默。 */
export async function openChildWindow(
  label: string,
  path: string,
  options: { title: string; width: number; height: number },
) {
  if (!isTauri()) return;
  await invoke('open_child_window', { label, path, ...options });
}

/** 向主窗口发送刷新事件（子窗口操作完成后调用）。 */
export async function emitChatRefresh() {
  if (!isTauri()) return;
  const { emit } = await import('@tauri-apps/api/event');
  await emit('chat:refresh');
}

/** 监听来自子窗口的刷新事件（主窗口调用）。 */
export async function onChatRefresh(callback: () => void) {
  if (!isTauri()) return () => {};
  const { listen } = await import('@tauri-apps/api/event');
  const unlisten = await listen('chat:refresh', callback);
  return unlisten;
}

/** 在线状态（与系统托盘菜单共享）。 */
export type Presence = 'online' | 'away' | 'busy' | 'dnd' | 'invisible';

/** 获取设备信息（持久化 device_id + 主机名），用于服务端单端登录互斥。 */
export async function getDeviceInfo(): Promise<{ device_id: string; device_name: string }> {
  if (!isTauri()) {
    return { device_id: 'browser-' + Math.random().toString(36).slice(2, 10), device_name: 'Browser' };
  }
  return invoke('get_device_info') as Promise<{ device_id: string; device_name: string }>;
}

/** 监听托盘菜单切换的在线状态（Rust 端 emit 'presence:changed'）。 */
export async function onPresenceChanged(callback: (p: Presence) => void) {
  if (!isTauri()) return () => {};
  const { listen } = await import('@tauri-apps/api/event');
  const unlisten = await listen<Presence>('presence:changed', (e) => callback(e.payload));
  return unlisten;
}

