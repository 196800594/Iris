// 子窗口启动门：恢复令牌（boot）+ 拉取好友列表，完成后再渲染窗口内容
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../store/auth';
import { useChat } from '../store/chat';

export function ChildWindowGate({ children }: { children: ReactNode }) {
  const boot = useAuth((s) => s.boot);
  const me = useAuth((s) => s.me);
  const refreshFriends = useChat((s) => s.refreshFriends);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await boot();
        if (!useAuth.getState().me) throw new Error('未登录或登录已过期');
        await refreshFriends();
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [boot, refreshFriends]);

  if (!ready) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 14 }}>
        正在加载…
      </div>
    );
  }

  if (error || !me) {
    return (
      <div style={{ padding: 28, textAlign: 'center', color: '#c0392b', fontSize: 13 }}>
        启动失败：{error ?? '未登录'}
        <p style={{ color: '#999', marginTop: 8 }}>请关闭窗口后从主界面重新打开</p>
      </div>
    );
  }

  return <>{children}</>;
}
