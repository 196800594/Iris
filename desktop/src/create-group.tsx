// 发起群聊窗口入口
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CreateGroupWindow } from './windows/CreateGroupWindow';
import { ChildWindowGate } from './windows/ChildWindowGate';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChildWindowGate>
      <CreateGroupWindow />
    </ChildWindowGate>
  </React.StrictMode>,
);
