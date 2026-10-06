import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Vite 配置：多 HTML 入口（主窗口 index.html + 登录窗口 login.html + 添加好友 add-friend.html + 发起群聊 create-group.html）
// Tauri 约定固定 1420 端口；忽略 Rust 侧文件变动触发整页刷新
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    target: 'es2021',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        'add-friend': resolve(__dirname, 'add-friend.html'),
        'create-group': resolve(__dirname, 'create-group.html'),
      },
    },
  },
});
