// 主窗口根组件：boot 恢复令牌 → enterApp（建缓存/连 WS）→ 渲染 MainLayout
import { Component, useEffect, useState, type ReactNode } from 'react';
import { emit } from '@tauri-apps/api/event';
import { useAuth } from './store/auth';
import { backToLogin, mainWindowReady } from './lib/window';
import { isTauri } from './lib/keyring';
import { MainLayout } from './components/MainLayout';

/** 简单错误边界：捕获子树渲染异常，避免白屏 */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('[MainApp] 渲染异常:', error);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#c0392b', fontFamily: 'sans-serif' }}>
          <h3>界面渲染出错</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {this.state.error.message}
            {'\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export function MainApp() {
  const me = useAuth((s) => s.me);
  const booting = useAuth((s) => s.booting);
  const boot = useAuth((s) => s.boot);
  const enterApp = useAuth((s) => s.enterApp);

  const [bootError, setBootError] = useState<string | null>(null);
  const [bootTimeout, setBootTimeout] = useState(false);

  // 启动：恢复令牌 + 取 me
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await boot();
      } catch (e) {
        if (!cancelled) setBootError(e instanceof Error ? e.message : String(e));
      }
    })();
    const t = setTimeout(() => {
      if (!cancelled) setBootTimeout(true);
    }, 8000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [boot]);

  // boot 完成：已登录 → 通知 Rust 显示主窗并销毁登录窗；未登录 → 返回登录窗
  useEffect(() => {
    if (booting) return;
    if (me) {
      // boot 成功：主窗已加载完毕，销毁登录窗 + 显示主窗
      void mainWindowReady(me.username).catch(() => {});
      void enterApp().catch((e) => console.error('[MainApp] enterApp 失败:', e));
    } else if (isTauri()) {
      // boot 失败（令牌无效/服务端异常）：销毁隐藏的主窗，登录窗继续显示并收到失败通知
      void backToLogin();
      void emit('boot:failed', bootError ?? '登录失败，请重试').catch(() => {});
    }
  }, [booting, me, enterApp, bootError]);

  if (booting) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 800, color: '#07c160' }}>蝶语</div>
        <div style={{ marginTop: 8, color: '#999', fontSize: 14 }}>正在启动…</div>
        {bootError && (
          <div style={{ marginTop: 12, color: '#c0392b', fontSize: 12, maxWidth: 280, textAlign: 'center' }}>
            启动失败：{bootError}
          </div>
        )}
        {bootTimeout && !bootError && (
          <div style={{ marginTop: 12, color: '#e67e22', fontSize: 12, maxWidth: 280, textAlign: 'center' }}>
            启动超时，请检查服务端是否运行
          </div>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {bootError ? (
        <div style={{ padding: 24, color: '#c0392b' }}>
          <h3>启动失败</h3>
          <p>{bootError}</p>
        </div>
      ) : me ? (
        <MainLayout />
      ) : null}
    </ErrorBoundary>
  );
}
