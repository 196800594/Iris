// 添加好友窗口入口
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AddFriendWindow } from './windows/AddFriendWindow';
import { ChildWindowGate } from './windows/ChildWindowGate';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChildWindowGate>
      <AddFriendWindow />
    </ChildWindowGate>
  </React.StrictMode>,
);
