// 全局连接配置（计划书 8.4：开发/测试直连 7100/7200；生产经 Caddy 同源，可用 VITE_* 覆盖）

/** REST 基础地址（不带尾斜杠） */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? 'http://localhost:7200').replace(
  /\/+$/,
  '',
);

/** REST API v1 前缀 */
export const V1 = `${API_BASE}/api/v1`;

/** WS 接入完整路径（ticket 以 query 拼接） */
export const WS_URL_BASE = import.meta.env.VITE_WS_BASE ?? 'ws://localhost:7100/ws';
