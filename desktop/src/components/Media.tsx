// 图片/文件消息渲染：签名 URL 懒换发；图片缩略图 + 灯箱看原图；文件卡片下载
import { useEffect, useState } from 'react';
import { signedFile } from '../lib/fileurl';
import { humanSize } from '../lib/format';
import type { MediaContent } from '../types/api';

function useSigned(fileId: string | undefined) {
  const [s, setS] = useState<{ url: string; thumb: string | null } | null>(null);
  useEffect(() => {
    let alive = true;
    setS(null);
    if (fileId) void signedFile(fileId).then((v) => alive && v && setS({ url: v.url, thumb: v.thumb }));
    return () => {
      alive = false;
    };
  }, [fileId]);
  return s;
}

/** 浏览器内触发下载（签名 URL → blob → a[download]，兼容 Tauri webview） */
async function download(url: string, name: string): Promise<void> {
  const resp = await fetch(url);
  const blob = await resp.blob();
  const obj = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = obj;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(obj), 60_000);
}

/** 图片消息：缩略图，点击灯箱看原图 */
export function ImageMessage({ media }: { media: MediaContent }) {
  const s = useSigned(media.file_id);
  const [open, setOpen] = useState(false);
  return (
    <span className="media-image">
      {s ? (
        <img
          className="thumb"
          src={s.thumb ?? s.url}
          alt={media.name}
          onClick={() => setOpen(true)}
          title="点击查看原图"
        />
      ) : (
        <span className="media-loading">图片加载中…</span>
      )}
      {open && s && (
        <span className="lightbox" onClick={() => setOpen(false)}>
          <img src={s.url} alt={media.name} />
        </span>
      )}
    </span>
  );
}

/** 文件消息：卡片（图标/名称/大小/下载） */
export function FileMessage({ media }: { media: MediaContent }) {
  const s = useSigned(media.file_id);
  const [busy, setBusy] = useState(false);
  const ext = media.name.includes('.') ? media.name.split('.').pop()!.toUpperCase() : 'FILE';
  return (
    <span className="file-card">
      <span className="file-icon">{ext.slice(0, 4)}</span>
      <span className="file-meta">
        <span className="file-name" title={media.name}>
          {media.name}
        </span>
        <span className="file-size">
          {humanSize(media.size)}
          {media.width ? ` · ${media.width}×${media.height}` : ''}
        </span>
      </span>
      <button
        type="button"
        className="file-download"
        disabled={!s || busy}
        onClick={() => {
          if (!s) return;
          setBusy(true);
          void download(s.url, media.name).finally(() => setBusy(false));
        }}
      >
        {busy ? '…' : '下载'}
      </button>
    </span>
  );
}
