// 蝶语登录窗：账号选择器（已存账号）+ 登录/注册/重置表单
// - 记住密码：将账号令牌+资料存入 OS 凭据管理器，支持多账号
// - 下次启动：若有已存账号，显示账号选择器，点「进入蝶语」直接登录
// - 切换账号：列出所有已存账号，可切换或删除
// - 校验：失焦校验单字段；提交校验全部；错误显示在输入框下方（带警告图标）
import { useEffect, useState } from 'react';
import { api, ApiError, getTokens } from '../lib/rest';
import { useAuth } from '../store/auth';
import { Avatar } from '../components/Avatar';
import { TitleBar } from '../components/TitleBar';
import { openMainWindow } from '../lib/window';
import {
  listAccounts,
  saveAccount,
  removeAccount,
  type SavedAccount,
} from '../lib/accounts';
import { loadPrefs, savePrefs } from '../lib/prefs';
import { signedFile } from '../lib/fileurl';
import irisAvatar from '../assets/iris-avatar.jpg';

type Mode = 'login' | 'register' | 'reset';
type View = 'picker' | 'form';

type FieldName = 'account' | 'password' | 'username' | 'nickname' | 'email' | 'code' | 'newPassword';

// 密码强度：8-16 位，且至少包含数字、字母、符号中的 2 种
function passwordTypes(pwd: string): number {
  let n = 0;
  if (/[0-9]/.test(pwd)) n++;
  if (/[A-Za-z]/.test(pwd)) n++;
  if (/[^A-Za-z0-9]/.test(pwd)) n++;
  return n;
}

function validateField(name: FieldName, value: string): string {
  const v = value;
  switch (name) {
    case 'account':
      return v.trim() ? '' : '账号不能为空';
    case 'password':
      if (!v) return '密码不能为空';
      if (v.length < 8 || v.length > 16) return '密码由 8-16 位组成';
      if (passwordTypes(v) < 2) return '至少含有 2 种以上数字、字母或符号';
      return '';
    case 'newPassword':
      if (!v) return '新密码不能为空';
      if (v.length < 8 || v.length > 16) return '密码由 8-16 位组成';
      if (passwordTypes(v) < 2) return '至少含有 2 种以上数字、字母或符号';
      return '';
    case 'username':
      if (!v.trim()) return '用户名不可以为空';
      if (v.length < 4 || v.length > 32) return '用户名长度须为 4-32 位';
      if (!/^[A-Za-z0-9_]+$/.test(v)) return '用户名只能包含字母、数字、下划线';
      return '';
    case 'nickname':
      if (!v.trim()) return '昵称不能为空';
      if (v.length > 32) return '昵称长度不能超过 32 位';
      return '';
    case 'email':
      if (!v.trim()) return '邮箱不能为空';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '邮箱格式不正确';
      return '';
    case 'code':
      if (!v.trim()) return '验证码不能为空';
      if (v.length < 4 || v.length > 8) return '验证码格式不正确';
      return '';
  }
}

function WarnIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" className="warn-icon" aria-hidden>
      <circle cx="6.5" cy="6.5" r="6" fill="none" stroke="#ff6b35" strokeWidth="1.2" />
      <line x1="6.5" y1="3.5" x2="6.5" y2="7" stroke="#ff6b35" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="6.5" cy="9" r="0.9" fill="#ff6b35" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="#999" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="#999" strokeWidth="1.6" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 3l18 18" stroke="#999" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10.6 10.6a3 3 0 004.2 4.2" stroke="#999" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.9 5.1A10.6 10.6 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.6A17 17 0 002 12s3.5 7 10 7a10.6 10.6 0 004.5-1" stroke="#999" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Login() {
  const login = useAuth((s) => s.login);
  const loginWithToken = useAuth((s) => s.loginWithToken);

  const [mode, setMode] = useState<Mode>('login');
  const [view, setView] = useState<View>('form'); // picker = 已存账号选择；form = 输入账号密码
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<SavedAccount | null>(null);
  const [showList, setShowList] = useState(false);

  const [err, setErr] = useState('');
  const [errors, setErrors] = useState<Record<FieldName, string>>({} as Record<FieldName, string>);
  const [busy, setBusy] = useState(false);

  const [account, setAccount] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [rememberPwd, setRememberPwd] = useState(true);
  const [agreed, setAgreed] = useState(false);
  // 表单模式下的账号检测（输入账号失焦时，若已保存则显示用户头像/昵称）
  const [detectedAccount, setDetectedAccount] = useState<SavedAccount | null>(null);

  // 启动时加载已存账号：自动登录→选择器；记住密码→预填账号密码；否则空表单
  useEffect(() => {
    void (async () => {
      // 加载全局偏好
      const prefs = await loadPrefs();
      setRememberPwd(prefs.rememberPassword);
      setAgreed(prefs.agreedTerms);

      const list = await listAccounts();
      if (list.length === 0) return;
      const last = list[0];
      setSavedAccounts(list);
      setActiveAccount(last);
      if (last.auto_login) {
        setView('picker');
      } else if (last.password && prefs.rememberPassword) {
        // 记住密码：回填账号密码，用户点登录
        setAccount(last.username);
        setPassword(last.password);
        setRememberPwd(true);
        setView('form');
      }
    })();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const changeMode = (m: Mode) => {
    setMode(m);
    setErr('');
    setErrors({} as Record<FieldName, string>);
  };

  const onBlur = (name: FieldName) => (e: React.FocusEvent<HTMLInputElement>) => {
    setErrors((prev) => ({ ...prev, [name]: validateField(name, e.target.value) }));
    // 登录模式下，账号失焦时检测是否为已保存账号，若是则显示用户头像/昵称
    if (mode === 'login' && name === 'account') {
      const val = e.target.value.trim();
      if (!val) {
        setDetectedAccount(null);
        return;
      }
      const found = savedAccounts.find((a) => a.username === val);
      setDetectedAccount(found ?? null);
    }
  };

  const clearErr = (name: FieldName) => () => {
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
  };

  const validateAll = (): boolean => {
    const next: Record<FieldName, string> = {} as Record<FieldName, string>;
    if (mode === 'login') {
      next.account = validateField('account', account);
      next.password = validateField('password', password);
    } else if (mode === 'register') {
      next.username = validateField('username', username);
      next.nickname = validateField('nickname', nickname);
      next.email = validateField('email', email);
      next.code = validateField('code', code);
      next.password = validateField('password', password);
    } else {
      next.email = validateField('email', email);
      next.code = validateField('code', code);
      next.newPassword = validateField('newPassword', newPassword);
    }
    setErrors(next);
    return Object.values(next).every((m) => !m);
  };

  const sendCode = async (purpose: 'register' | 'reset') => {
    if (!email.trim()) {
      setErrors((p) => ({ ...p, email: '邮箱不能为空' }));
      return;
    }
    setErr('');
    try {
      const r = await api.emailCode(email.trim(), purpose);
      setCooldown(r.cooldown_seconds ?? 60);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : (e as Error).message);
    }
  };

  const submit = async () => {
    if (!validateAll()) return;
    if (!agreed) {
      setErr('请先阅读并同意服务协议与隐私政策');
      return;
    }
    setErr('');
    setBusy(true);
    try {
      // 保存全局偏好
      await savePrefs({ rememberPassword: rememberPwd, agreedTerms: agreed });

      if (mode === 'login') {
        await login(account, password);
        // 记住密码：将账号密码+令牌+资料存入多账号凭据
        if (rememberPwd) {
          const info = useAuth.getState().me;
          const tokens = getTokens();
          if (info && tokens.access && tokens.refresh) {
            // 获取头像签名 URL（选择器界面未登录，需提前缓存）
            let avatarUrl: string | null = null;
            if (info.avatar_file_id) {
              const s = await signedFile(info.avatar_file_id);
              avatarUrl = s?.url ?? null;
            }
            await saveAccount({
              username: info.username,
              email: info.email,
              nickname: info.nickname,
              avatar_file_id: info.avatar_file_id ? String(info.avatar_file_id) : null,
              avatar_url: avatarUrl,
              access_token: tokens.access,
              refresh_token: tokens.refresh,
              password,
              auto_login: autoLogin,
              last_used: Date.now(),
            });
          }
        } else {
          // 未记住密码：清除该账号的已存记录
          await removeAccount(account.trim());
        }
        await openMainWindow();
        // 登录窗由 Rust 侧异步销毁（open_main_window 内部延迟 150ms destroy）
      } else if (mode === 'register') {
        await api.register(username.trim(), nickname.trim(), email.trim(), password, code.trim());
        // 注册成功：提示并回到登录页（不自动登录）
        setErr('注册成功，请使用新账号登录');
        setAccount(username.trim());
        setUsername('');
        setNickname('');
        setEmail('');
        setCode('');
        setPassword('');
        changeMode('login');
      } else {
        await api.resetPassword(email.trim(), code.trim(), newPassword);
        setErr('密码已重置，请用新密码登录');
        setAccount(email.trim());
        changeMode('login');
      }
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // 进入蝶语：用已选账号的令牌直接登录
  const enterWithAccount = async (acc: SavedAccount) => {
    setErr('');
    setBusy(true);
    try {
      // 从已存账号取令牌（注意：当前活动令牌在 iris.access，这里需要恢复该账号的令牌）
      // 由于 saveAccount 时未存令牌，需重新登录；若已存令牌则直接用
      if (acc.access_token && acc.refresh_token) {
        await loginWithToken(acc.access_token, acc.refresh_token);
      } else {
        // 没有令牌（旧数据），回退到登录表单
        setView('form');
        setAccount(acc.username);
        setErr('请重新输入密码登录');
        return;
      }
      // 更新最近使用时间与最新令牌（可能经 refresh 换新）
      const fresh = getTokens();
      await saveAccount({
        ...acc,
        access_token: fresh.access ?? acc.access_token,
        refresh_token: fresh.refresh ?? acc.refresh_token,
        last_used: Date.now(),
      });
      await openMainWindow();
      // 登录窗由 Rust 侧异步销毁
    } catch (e) {
      // 令牌失效，删除该账号并回登录表单
      await removeAccount(acc.username);
      const list = (await listAccounts()).filter((a) => a.username !== acc.username);
      setSavedAccounts(list);
      setActiveAccount(list[0] ?? null);
      setView(list.length > 0 ? 'picker' : 'form');
      setErr('登录已过期，请重新登录');
    } finally {
      setBusy(false);
    }
  };

  // 删除已存账号
  const deleteAccount = async (acc: SavedAccount) => {
    await removeAccount(acc.username);
    const list = await listAccounts();
    setSavedAccounts(list);
    if (activeAccount?.username === acc.username) {
      setActiveAccount(list[0] ?? null);
    }
    if (list.length === 0) setView('form');
  };

  // 切换账号：从列表选择
  const pickAccount = (acc: SavedAccount) => {
    setActiveAccount(acc);
    setShowList(false);
    setErr('');
    setErrors({} as Record<FieldName, string>);
    if (acc.auto_login) {
      setView('picker');
    } else if (acc.password) {
      setAccount(acc.username);
      setPassword(acc.password);
      setRememberPwd(true);
      setView('form');
    } else {
      setAccount(acc.username);
      setPassword('');
      setView('form');
    }
  };

  const goAddAccount = () => {
    setShowList(false);
    setView('form');
    setErr('');
    setErrors({} as Record<FieldName, string>);
  };

  return (
    <div className="app-shell qq-login-shell" data-tauri-drag-region>
      <TitleBar qq />
      <div className="qq-login-body" data-tauri-no-drag>
        {view === 'picker' && activeAccount ? (
          /* ---------- 账号选择器 ---------- */
          <div className="qq-picker animate-fade">
            <div className="qq-avatar-wrap animate-pop" style={{ marginTop: 16 }}>
              <div className="qq-avatar-ring">
                {activeAccount.avatar_file_id ? (
                  <Avatar fileId={activeAccount.avatar_file_id} name={activeAccount.nickname} size={80} round token={activeAccount.access_token} />
                ) : (
                  <img src={irisAvatar} alt="蝶语" className="avatar" draggable={false} />
                )}
              </div>
            </div>
            <div className="qq-picker-name">{activeAccount.nickname || activeAccount.username}</div>
            <div className="qq-picker-account">@{activeAccount.username}</div>

            <button
              type="button"
              className="qq-login-btn"
              style={{ marginTop: 18 }}
              disabled={busy}
              onClick={() => void enterWithAccount(activeAccount)}
            >
              {busy ? '登录中…' : '进入蝶语'}
            </button>

            <div className="qq-picker-actions">
              <button type="button" className="qq-link" onClick={() => setShowList(true)}>
                切换账号
              </button>
              <span className="qq-divider">|</span>
              <button type="button" className="qq-link" onClick={goAddAccount}>
                添加账号
              </button>
            </div>

            {err && <div className="login-err center animate-shake"><WarnIcon />{err}</div>}

            {/* 账号列表弹层 */}
            {showList && (
              <div className="qq-account-list-mask" onClick={() => setShowList(false)}>
                <div className="qq-account-list" onClick={(e) => e.stopPropagation()}>
                  <div className="qq-account-list-title">切换账号</div>
                  {savedAccounts.map((a) => (
                    <div key={a.username} className="qq-account-item">
                      <button type="button" className="qq-account-item-main" onClick={() => pickAccount(a)}>
                        <div className="qq-account-avatar">
                          {a.avatar_file_id ? (
                            <Avatar fileId={a.avatar_file_id} name={a.nickname} size={36} round token={a.access_token} />
                          ) : (
                            <img src={irisAvatar} alt="" className="avatar" style={{ width: 36, height: 36, borderRadius: '50%' }} draggable={false} />
                          )}
                        </div>
                        <div className="qq-account-meta">
                          <div className="qq-account-nick">{a.nickname || a.username}</div>
                          <div className="qq-account-user">@{a.username}</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="qq-account-del"
                        title="删除该账号登录信息"
                        onClick={() => void deleteAccount(a)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                          <path d="M3 4h10M6.5 4V3h3v1M4 4l.7 8.5h6.6L12 4" stroke="#999" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" className="qq-account-add" onClick={goAddAccount}>
                    + 添加账号
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ---------- 表单区（登录/注册/重置） ---------- */
          <>
            {mode === 'login' && (
              <div className="qq-avatar-wrap animate-pop">
                <div className="qq-avatar-ring">
                  {detectedAccount?.avatar_file_id ? (
                    <Avatar fileId={detectedAccount.avatar_file_id} name={detectedAccount.nickname} size={80} round token={detectedAccount.access_token} />
                  ) : (
                    <img src={irisAvatar} alt="蝶语" className="avatar" draggable={false} />
                  )}
                </div>
                {detectedAccount && (
                  <div className="qq-detected-user">
                    <div className="qq-detected-nick">{detectedAccount.nickname || detectedAccount.username}</div>
                    <div className="qq-detected-user-name">@{detectedAccount.username}</div>
                  </div>
                )}
              </div>
            )}

            <div className="qq-form animate-rise" key={mode}>
              {mode === 'login' ? (
                <>
                  <div className="qq-field">
                    <div className={`qq-input ${errors.account ? 'has-error' : ''}`}>
                      <input
                        placeholder="输入账号"
                        value={account}
                        onChange={(e) => { setAccount(e.target.value); clearErr('account')(); }}
                        onBlur={onBlur('account')}
                        onKeyDown={(e) => e.key === 'Enter' && void submit()}
                      />
                    </div>
                    {errors.account && <div className="qq-field-error"><WarnIcon />{errors.account}</div>}
                  </div>

                  <div className="qq-field">
                    <div className={`qq-input ${errors.password ? 'has-error' : ''}`}>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="输入密码"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearErr('password')(); }}
                        onBlur={onBlur('password')}
                        onKeyDown={(e) => e.key === 'Enter' && void submit()}
                      />
                      <button type="button" className="qq-eye-btn" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                        <EyeIcon open={showPwd} />
                      </button>
                    </div>
                    {errors.password && <div className="qq-field-error"><WarnIcon />{errors.password}</div>}
                  </div>

                  <div className="qq-options">
                    <label className="qq-check">
                      <input type="checkbox" checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} />
                      <span>自动登录</span>
                    </label>
                    <label className="qq-check">
                      <input type="checkbox" checked={rememberPwd} onChange={(e) => setRememberPwd(e.target.checked)} />
                      <span>记住密码</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    className={`qq-login-btn ${agreed ? '' : 'disabled'}`}
                    disabled={busy}
                    onClick={() => void submit()}
                  >
                    {busy ? '登录中…' : '登 录'}
                  </button>

                  <label className="qq-agreement">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                    <span>已阅读并同意 <a>服务协议</a> 和 <a>隐私政策</a></span>
                  </label>

                  {err && <div className="login-err center animate-shake"><WarnIcon />{err}</div>}
                </>
              ) : mode === 'register' ? (
                <>
                  <div className="qq-field">
                    <div className={`qq-input ${errors.username ? 'has-error' : ''}`}>
                      <input
                        placeholder="请输入用户名"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); clearErr('username')(); }}
                        onBlur={onBlur('username')}
                      />
                    </div>
                    {errors.username && <div className="qq-field-error"><WarnIcon />{errors.username}</div>}
                  </div>

                  <div className="qq-field">
                    <div className={`qq-input ${errors.nickname ? 'has-error' : ''}`}>
                      <input
                        placeholder="请输入昵称"
                        value={nickname}
                        onChange={(e) => { setNickname(e.target.value); clearErr('nickname')(); }}
                        onBlur={onBlur('nickname')}
                      />
                    </div>
                    {errors.nickname && <div className="qq-field-error"><WarnIcon />{errors.nickname}</div>}
                  </div>

                  <div className="qq-field">
                    <div className={`qq-input ${errors.email ? 'has-error' : ''}`}>
                      <input
                        type="email"
                        placeholder="请输入邮箱"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearErr('email')(); }}
                        onBlur={onBlur('email')}
                      />
                    </div>
                    {errors.email && <div className="qq-field-error"><WarnIcon />{errors.email}</div>}
                  </div>

                  <div className="qq-field">
                    <div className={`qq-input code ${errors.code ? 'has-error' : ''}`}>
                      <input
                        placeholder="请输入验证码"
                        maxLength={8}
                        value={code}
                        onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); clearErr('code')(); }}
                        onBlur={onBlur('code')}
                      />
                      <button type="button" className="qq-code-btn" disabled={cooldown > 0} onClick={() => void sendCode('register')}>
                        {cooldown > 0 ? `${cooldown}s` : '获取验证码'}
                      </button>
                    </div>
                    {errors.code && <div className="qq-field-error"><WarnIcon />{errors.code}</div>}
                  </div>

                  <div className="qq-field">
                    <div className={`qq-input ${errors.password ? 'has-error' : ''}`}>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="请设置蝶语密码"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearErr('password')(); }}
                        onBlur={onBlur('password')}
                      />
                      <button type="button" className="qq-eye-btn" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                        <EyeIcon open={showPwd} />
                      </button>
                    </div>
                    {errors.password ? (
                      <div className="qq-field-error"><WarnIcon />{errors.password}</div>
                    ) : (
                      <ul className="qq-pwd-rules">
                        <li>密码由 8-16 位组成</li>
                        <li>至少含有 2 种以上数字、字母或符号</li>
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`qq-login-btn ${agreed ? '' : 'disabled'}`}
                    disabled={busy}
                    onClick={() => void submit()}
                  >
                    {busy ? '注册中…' : '注 册'}
                  </button>

                  <label className="qq-agreement">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                    <span>已阅读并同意 <a>服务协议</a> 和 <a>隐私政策</a></span>
                  </label>

                  {err && <div className="login-err center animate-shake"><WarnIcon />{err}</div>}
                </>
              ) : (
                <>
                  <div className="qq-field">
                    <div className={`qq-input ${errors.email ? 'has-error' : ''}`}>
                      <input
                        type="email"
                        placeholder="请输入注册邮箱"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearErr('email')(); }}
                        onBlur={onBlur('email')}
                      />
                    </div>
                    {errors.email && <div className="qq-field-error"><WarnIcon />{errors.email}</div>}
                  </div>

                  <div className="qq-field">
                    <div className={`qq-input code ${errors.code ? 'has-error' : ''}`}>
                      <input
                        placeholder="请输入验证码"
                        maxLength={8}
                        value={code}
                        onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); clearErr('code')(); }}
                        onBlur={onBlur('code')}
                      />
                      <button type="button" className="qq-code-btn" disabled={cooldown > 0} onClick={() => void sendCode('reset')}>
                        {cooldown > 0 ? `${cooldown}s` : '获取验证码'}
                      </button>
                    </div>
                    {errors.code && <div className="qq-field-error"><WarnIcon />{errors.code}</div>}
                  </div>

                  <div className="qq-field">
                    <div className={`qq-input ${errors.newPassword ? 'has-error' : ''}`}>
                      <input
                        type={showNewPwd ? 'text' : 'password'}
                        placeholder="请设置新密码"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); clearErr('newPassword')(); }}
                        onBlur={onBlur('newPassword')}
                      />
                      <button type="button" className="qq-eye-btn" onClick={() => setShowNewPwd((v) => !v)} tabIndex={-1}>
                        <EyeIcon open={showNewPwd} />
                      </button>
                    </div>
                    {errors.newPassword ? (
                      <div className="qq-field-error"><WarnIcon />{errors.newPassword}</div>
                    ) : (
                      <ul className="qq-pwd-rules">
                        <li>密码由 8-16 位组成</li>
                        <li>至少含有 2 种以上数字、字母或符号</li>
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`qq-login-btn ${agreed ? '' : 'disabled'}`}
                    disabled={busy}
                    onClick={() => void submit()}
                  >
                    {busy ? '重置中…' : '重置密码'}
                  </button>

                  <label className="qq-agreement">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                    <span>已阅读并同意 <a>服务协议</a> 和 <a>隐私政策</a></span>
                  </label>

                  {err && <div className="login-err center animate-shake"><WarnIcon />{err}</div>}
                </>
              )}
            </div>

            <div className="qq-foot-links animate-fade">
              {mode === 'login' ? (
                <>
                  <button type="button" className="qq-link" onClick={() => changeMode('register')}>注册账号</button>
                  <span className="qq-divider">|</span>
                  <button type="button" className="qq-link" onClick={() => changeMode('reset')}>忘记密码</button>
                </>
              ) : (
                <button type="button" className="qq-link" onClick={() => changeMode('login')}>← 返回登录</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
