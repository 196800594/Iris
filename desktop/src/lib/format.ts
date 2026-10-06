// 展示层工具函数
import type { HistoryMsg, LastMsg, MediaContent } from '../types/api';

/** 毫秒时间戳 → HH:MM / 昨天 / MM-DD / YYYY-MM-DD */
export function formatTime(ms: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (sameDay) return hm;
  if (isYesterday) return `昨天 ${hm}`;
  if (d.getFullYear() === now.getFullYear())
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 解析媒体消息 content；非合法 JSON 返回 null */
export function parseMedia(content: string): MediaContent | null {
  try {
    const v = JSON.parse(content) as MediaContent;
    if (v && typeof v.file_id === 'string') return v;
    return null;
  } catch {
    return null;
  }
}

/** 会话列表最后消息预览文本 */
export function lastMsgPreview(m: LastMsg | HistoryMsg | null | undefined): string {
  if (!m) return '';
  switch (m.msg_type) {
    case 1:
      return m.content;
    case 2:
      return '[图片]';
    case 3:
      return `[文件] ${parseMedia(m.content)?.name ?? ''}`;
    case 4:
      // 群系统消息 content 为 JSON，优先取 text 字段
      try {
        const v = JSON.parse(m.content) as { text?: string };
        return v.text ?? '[系统消息]';
      } catch {
        return '[系统消息]';
      }
    default:
      return '';
  }
}

/** 文件大小人类可读 */
export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** UUID v4（消息幂等键 client_msg_id） */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // 兜底（老旧 WebView）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
