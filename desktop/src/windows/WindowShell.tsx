// 新窗口通用外壳
// - gradient：浅蓝渐变 + 居中内容（简单表单窗口）
// - plain：纯白 + 自定义标题栏（复杂多栏窗口）
import { TitleBar } from '../components/TitleBar';
import { close } from '../lib/window';

interface Props {
  title?: string;
  children: React.ReactNode;
  variant?: 'gradient' | 'plain';
}

export function WindowShell({ title, children, variant = 'gradient' }: Props) {
  if (variant === 'plain') {
    return (
      <div className="app-shell win-shell-plain">
        <div className="win-titlebar" data-tauri-drag-region>
          <span className="win-titlebar-text">{title ?? ''}</span>
          <button
            type="button"
            className="win-titlebar-close"
            data-tauri-no-drag
            title="关闭"
            onClick={() => void close()}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <line x1="3" y1="3" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="11" y1="3" x2="3" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="win-body-plain">{children}</div>
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ background: 'linear-gradient(160deg, #e8f4fd 0%, #f7fbff 45%, #ffffff 100%)' }}>
      <TitleBar qq />
      <div className="window-body" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 20px',
        overflow: 'auto',
      }}>
        {title && (
          <div className="window-title animate-fade" style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#1a1a1a',
            marginBottom: 20,
            textAlign: 'center',
          }}>
            {title}
          </div>
        )}
        <div className="window-content animate-rise" style={{
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
