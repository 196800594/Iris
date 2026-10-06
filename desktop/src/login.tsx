// 登录窗口入口：直接渲染 Login，不跑 boot（登录流程由 Login 内部处理）
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Login } from './pages/Login';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Login />
  </React.StrictMode>,
);
