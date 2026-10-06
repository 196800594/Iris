// 个人资料编辑（QQ NT「编辑资料」卡片风格）：头像 / 昵称 / 个签 / 性别（可保存）
// 生日、国家、省份、地区为预留项（后端暂未开放），以禁用态展示
import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../lib/rest';
import { useAuth } from '../store/auth';
import { Avatar } from './Avatar';

const NICK_MAX = 36;
const SIGN_MAX = 80;

// 性别选项（QQ NT 风格：仅男/女）
const GENDER_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '男' },
  { value: 2, label: '女' },
];

function genderLabel(v: number) {
  return GENDER_OPTIONS.find((o) => o.value === v)?.label ?? '男';
}

export function SelfProfileModal({ onClose }: { onClose: () => void }) {
  const me = useAuth((s) => s.me);
  const refreshMe = useAuth((s) => s.refreshMe);
  const [nickname, setNickname] = useState(me?.nickname ?? '');
  const [signature, setSignature] = useState(me?.signature ?? '');
  const [gender, setGender] = useState<number>(me?.gender ?? 0);
  const [genderOpen, setGenderOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const genderRef = useRef<HTMLDivElement | null>(null);

  // 点击性别下拉外部时收起
  useEffect(() => {
    if (!genderOpen) return;
    const onDown = (e: MouseEvent) => {
      if (genderRef.current && !genderRef.current.contains(e.target as Node)) {
        setGenderOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [genderOpen]);

  useEffect(() => {
    setNickname(me?.nickname ?? '');
    setSignature(me?.signature ?? '');
    setGender(me?.gender ?? 0);
  }, [me]);

  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      await api.patchMe({ nickname: nickname.trim(), signature: signature.trim(), gender });
      await refreshMe();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const up = await api.upload(file, 'avatar');
      // 雪花 ID 保持字符串传输，避免超过 JS 安全整数丢精度
      await api.patchMe({ avatar_file_id: up.file_id });
      await refreshMe();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="profile-mask animate-fade" onClick={onClose}>
      <div className="profile-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="profile-head">
          <span className="profile-head-title">编辑资料</span>
          <button type="button" className="profile-close" onClick={onClose} title="关闭">
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden>
              <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="profile-body">
          {/* 头像 */}
          <button type="button" className="profile-avatar-btn" onClick={() => fileRef.current?.click()} title="点击更换头像">
            <Avatar fileId={me?.avatar_file_id ?? null} name={nickname || '?'} size={88} round />
            <span className="profile-avatar-mask">更换头像</span>
          </button>
          <input
            ref={(el) => {
              fileRef.current = el;
            }}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
            hidden
            onChange={(e) => void pickAvatar(e.target.files?.[0])}
          />

          {/* 昵称 */}
          <div className="pf-field">
            <span className="pf-label">昵称</span>
            <input
              className="pf-input"
              value={nickname}
              maxLength={NICK_MAX}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="设置昵称"
            />
            <span className="pf-counter">{nickname.length}/{NICK_MAX}</span>
          </div>

          {/* 个签 */}
          <div className="pf-field">
            <span className="pf-label">个签</span>
            <input
              className="pf-input"
              value={signature}
              maxLength={SIGN_MAX}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="编辑个签，展示我的独特态度"
            />
            <span className="pf-counter">{signature.length}/{SIGN_MAX}</span>
          </div>

          {/* 性别（QQ NT 自定义下拉） */}
          <div className={`pf-field pf-picker${genderOpen ? ' open' : ''}`} ref={genderRef}>
            <span className="pf-label">性别</span>
            <button
              type="button"
              className="pf-picker-btn"
              onClick={() => setGenderOpen((v) => !v)}
            >
              {genderLabel(gender)}
            </button>
            <svg className="pf-chevron pf-chevron-rotate" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {genderOpen && (
              <div className="pf-popover animate-pf-pop">
                {GENDER_OPTIONS.map((o) => {
                  const active = gender === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      className={`pf-option${active ? ' active' : ''}`}
                      onClick={() => {
                        setGender(o.value);
                        setGenderOpen(false);
                      }}
                    >
                      <span>{o.label}</span>
                      {active && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 生日（预留，后端未开放） */}
          <div className="pf-field disabled" title="即将开放">
            <span className="pf-label">生日</span>
            <input className="pf-input" value="" placeholder="请选择" disabled readOnly />
          </div>

          {/* 国家（预留） */}
          <div className="pf-field disabled" title="即将开放">
            <span className="pf-label">国家</span>
            <input className="pf-input" value="" placeholder="请选择" disabled readOnly />
            <svg className="pf-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* 省份 / 地区（预留） */}
          <div className="pf-field-row2">
            <div className="pf-field disabled flex1" title="即将开放">
              <span className="pf-label">省份</span>
              <input className="pf-input" value="" placeholder="请选择" disabled readOnly />
              <svg className="pf-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="pf-field disabled flex1" title="即将开放">
              <span className="pf-label">地区</span>
              <input className="pf-input" value="" placeholder="请选择" disabled readOnly />
              <svg className="pf-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {err && <div className="pf-err animate-shake">{err}</div>}
        </div>

        {/* 底部操作 */}
        <div className="profile-foot">
          <button
            type="button"
            className="pf-btn primary"
            disabled={busy || !nickname.trim()}
            onClick={() => void save()}
          >
            {busy ? '保存中…' : '保存'}
          </button>
          <button type="button" className="pf-btn" disabled={busy} onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
