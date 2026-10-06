// 输入区：Enter 发送 / Shift+Enter 换行；图片≤20MiB、其他文件≤100MiB 前端拦截（服务端二次校验）
import { useRef, useState } from 'react';
import { useChat } from '../store/chat';
import { ApiError } from '../lib/rest';
import { humanSize } from '../lib/format';
import { FileIcon, ImageIcon, SendIcon } from './Icons';

const IMAGE_MAX = 20 * 1024 * 1024;
const FILE_MAX = 100 * 1024 * 1024;

export function Composer({ disabled }: { disabled: boolean }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sendText = useChat((s) => s.sendText);
  const sendFileMessage = useChat((s) => s.sendFileMessage);

  const doSendText = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setErr('');
    setText('');
    try {
      await sendText(t);
    } catch (e) {
      setErr((e as Error).message);
      setText(t);
    } finally {
      setBusy(false);
    }
  };

  const pickFile = async (file: File | undefined, kind: 'image' | 'file') => {
    if (!file) return;
    const limit = kind === 'image' ? IMAGE_MAX : FILE_MAX;
    if (file.size > limit) {
      setErr(`${kind === 'image' ? '图片' : '文件'}不能超过 ${humanSize(limit)}`);
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await sendFileMessage(file, kind);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="composer">
      {err && <div className="composer-err">{err}</div>}
      <div className="composer-tools">
        <button
          type="button"
          className="tool-btn"
          title="发送图片（≤20MB，jpg/png/gif/webp/bmp）"
          disabled={disabled || busy}
          onClick={() => imgRef.current?.click()}
        >
          <ImageIcon />
        </button>
        <button
          type="button"
          className="tool-btn"
          title="发送文件（≤100MB）"
          disabled={disabled || busy}
          onClick={() => fileRef.current?.click()}
        >
          <FileIcon />
        </button>
      </div>
      <div className="composer-row">
        <input
          ref={imgRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
          hidden
          onChange={(e) => void pickFile(e.target.files?.[0], 'image')}
        />
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={(e) => void pickFile(e.target.files?.[0], 'file')}
        />
        <textarea
          className="composer-input"
          placeholder={disabled ? '请先选择会话' : '输入消息，Enter 发送，Shift+Enter 换行'}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void doSendText();
            }
          }}
          rows={1}
        />
        <button
          type="button"
          className="composer-send"
          disabled={disabled || busy || !text.trim()}
          onClick={() => void doSendText()}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
