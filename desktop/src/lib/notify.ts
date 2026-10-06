// 系统通知封装（plugin-notification）：非 Tauri 环境静默降级
import { isTauri } from './keyring';

let granted: boolean | null = null;

/** 弹一条桌面通知；权限未授予时先请求一次 */
export async function pushNotification(title: string, body: string): Promise<void> {
  if (!isTauri()) return;
  try {
    const plugin = await import('@tauri-apps/plugin-notification');
    if (granted === null) {
      let has = await plugin.isPermissionGranted();
      if (!has) {
        const p = await plugin.requestPermission();
        has = p === 'granted';
      }
      granted = has;
    }
    if (!granted) return;
    await plugin.sendNotification({ title, body });
  } catch (e) {
    console.warn('[notify] 通知发送失败:', e);
  }
}
