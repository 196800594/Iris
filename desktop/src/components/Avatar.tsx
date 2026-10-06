// 头像：avatar_file_id → 签名 URL；无头像取昵称首字符色块
import { useEffect, useState } from 'react';
import { signedFile } from '../lib/fileurl';

interface Props {
  fileId: string | null | undefined;
  name: string;
  size?: number;
  round?: boolean;
  /** 显式访问令牌（登录页多账号：用该账号自己的 token 换签名；默认用全局会话令牌） */
  token?: string;
}

const COLORS = ['#5b8def', '#36b37e', '#ff8b00', '#6554c0', '#de350b', '#00b8d9'];

export function Avatar({ fileId, name, size = 40, round = false, token }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    setFailed(false);
    if (fileId) {
      void signedFile(fileId, token).then((s) => {
        if (alive) setUrl(s?.url ?? null);
      });
    }
    return () => {
      alive = false;
    };
  }, [fileId, token]);

  const ch = (name || '?').trim().charAt(0).toUpperCase();
  const bg = COLORS[(name || '?').charCodeAt(0) % COLORS.length];
  const radius = round ? '50%' : '6px';

  // 签名 URL 失效（过期/404/403）时回退到昵称首字符色块，避免裂图
  if (url && !failed) {
    return (
      <img
        className={`avatar ${round ? 'round' : ''}`}
        src={url}
        alt={name}
        style={{ width: size, height: size, borderRadius: radius }}
        draggable={false}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className={`avatar avatar-fallback ${round ? 'round' : ''}`}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42, borderRadius: radius }}
    >
      {ch}
    </span>
  );
}
