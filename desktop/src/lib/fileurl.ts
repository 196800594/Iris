// 签名下载 URL 缓存：媒体 content 只存 file_id，展示时经 /files/{id}/sign 换发
// 服务端 TTL=300s，客户端按 240s 提前换发；thumb_url 共用同一次签名结果。
import { api } from './rest';

interface Signed {
  url: string;
  thumb: string | null;
  exp: number;
}

const cache = new Map<string, Signed>();
const inflight = new Map<string, Promise<Signed | null>>();

/** 取（或换发）某文件的签名 URL；失败返回 null 由组件显示占位。
 *  token 可选：登录页多账号场景传入该账号自己的访问令牌（签名 URL 本身无账号差异，缓存按 fileId 共享）。 */
export async function signedFile(fileId: string, token?: string): Promise<Signed | null> {
  const now = Date.now();
  const hit = cache.get(fileId);
  if (hit && hit.exp > now) return hit;
  const inflightKey = token ? `${fileId}@${token.slice(-8)}` : fileId;
  const going = inflight.get(inflightKey);
  if (going) return going;
  const job = api
    .signFile(fileId, token)
    .then((r) => {
      const s: Signed = { url: r.url, thumb: r.thumb_url, exp: now + 240_000 };
      cache.set(fileId, s);
      inflight.delete(inflightKey);
      return s;
    })
    .catch(() => {
      inflight.delete(inflightKey);
      return null;
    });
  inflight.set(inflightKey, job);
  return job;
}
