// 自定义标题栏：可拖拽区域 + 窗口控制按钮（替代原生标题栏，decorations=false）
// 三种形态：
// - 默认（主窗口）：应用名 + 最小化/最大化/关闭
// - compact：仅关闭（旧登录窗用）
// - qq：左侧汉堡菜单 + 右侧关闭（QQ 风格登录窗）
import { useState } from 'react';
import { isTauri } from '../lib/keyring';
import { close, minimize, toggleMaximize } from '../lib/window';

export function TitleBar({
  compact = false,
  qq = false,
}: {
  compact?: boolean;
  qq?: boolean;
}) {
  const showCtrls = isTauri();
  const [hover, setHover] = useState<'' | 'min' | 'max' | 'close'>('');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`title-bar ${compact ? 'compact' : ''} ${qq ? 'qq' : ''}`}
      data-tauri-drag-region
      onDoubleClick={() => void toggleMaximize()}
    >
      {qq ? (
        <div className="title-bar-left" />
      ) : (
        <div className="title-bar-left">
          <span className="title-bar-icon" />
          <span className="title-bar-name">蝶语</span>
        </div>
      )}
      {showCtrls && (
        <div className="title-bar-ctrls" onMouseLeave={() => setHover('')}>
          {qq && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="hamburger-btn"
                title="菜单"
                data-tauri-no-drag
                onClick={() => setMenuOpen((v) => !v)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                  <line x1="3" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {menuOpen && (
                <div className="title-menu right" onMouseDown={(e) => e.preventDefault()}>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void minimize();
                    }}
                  >
                    最小化
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void close();
                    }}
                  >
                    退出
                  </button>
                </div>
              )}
            </div>
          )}
          {!compact && !qq && (
            <>
              <button
                type="button"
                className={`ctrl-btn ${hover === 'min' ? 'hover' : ''}`}
                title="最小化"
                onMouseEnter={() => setHover('min')}
                onClick={() => void minimize()}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1" />
                </svg>
              </button>
              <button
                type="button"
                className={`ctrl-btn ${hover === 'max' ? 'hover' : ''}`}
                title="最大化"
                onMouseEnter={() => setHover('max')}
                onClick={() => void toggleMaximize()}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <rect
                    x="2.5"
                    y="2.5"
                    width="7"
                    height="7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
              </button>
            </>
          )}
          <button
            type="button"
            className={`ctrl-btn close ${hover === 'close' ? 'hover' : ''}`}
            title="关闭"
            onMouseEnter={() => setHover('close')}
            onClick={() => void close()}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <line x1="3" y1="3" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="11" y1="3" x2="3" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
