/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** REST 基础地址（默认本机直连 7200；生产可指向 Caddy 同源地址） */
  readonly VITE_API_BASE?: string;
  /** WS 接入完整路径（默认 ws://localhost:7100/ws） */
  readonly VITE_WS_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
