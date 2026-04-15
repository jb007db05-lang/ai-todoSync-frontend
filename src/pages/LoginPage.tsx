import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, Smartphone } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

const inputCls = 'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md text-zinc-900 dark:text-slate-100 px-4 py-3.5 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10';
const labelCls = 'grid gap-2 font-medium text-[0.95rem] text-zinc-900 dark:text-slate-100';

function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithCompanionKey, loading, error, user } = useAuth();
  const [loginMode, setLoginMode] = useState<'account' | 'companion'>('account');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [companionKey, setCompanionKey] = useState<string>('');
  const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, ''),
    []
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    try {
      await login(email, password);
      navigate(nextPath, { replace: true });
    } catch {
      // AuthContext sets the error state; we just prevent navigation
    }
  };

  const handleCompanionSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    try {
      await loginWithCompanionKey(companionKey);
      navigate(nextPath, { replace: true });
    } catch {
      // AuthContext sets the error state; we just prevent navigation
    }
  };

  const startGoogleSignIn = (): void => {
    const params = new URLSearchParams();
    params.set('redirect', nextPath);
    window.location.assign(`${apiBase}/auth/google?${params.toString()}`);
  };

  return (
    <main className="min-h-screen flex items-start justify-center gap-5 py-20 px-5">
      {/* Login card */}
      <section className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-lg shadow-[0_10px_24px_rgba(15,23,42,0.06)] p-8 w-full max-w-[480px] grid gap-5">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-slate-100 m-0">Login</h1>
          <p className="text-zinc-500 dark:text-slate-400 mt-1">Sign in to access your synced tasks.</p>
        </div>

        {/* Google OAuth */}
        <button
          className="w-full py-3 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md text-zinc-700 dark:text-slate-200 font-medium hover:bg-zinc-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2.5 shadow-sm transition-colors disabled:opacity-50"
          disabled={loading}
          onClick={startGoogleSignIn}
          type="button"
        >
          Sign in with Google
        </button>

        <p className="text-center text-zinc-400 dark:text-slate-500 text-sm m-0">or choose a login method</p>

        {/* Mode switch */}
        <div
          aria-label="Login method"
          className="flex p-1 bg-zinc-100 dark:bg-slate-800 rounded-lg gap-1"
          role="tablist"
        >
          {(
            [
              { key: 'account',   label: 'Account login',   Icon: KeyRound },
              { key: 'companion', label: 'Companion device', Icon: Smartphone }
            ] as const
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              aria-selected={loginMode === key}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                loginMode === key
                  ? 'bg-white dark:bg-slate-700 text-zinc-900 dark:text-slate-100 shadow-sm'
                  : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-200'
              ].join(' ')}
              onClick={() => setLoginMode(key)}
              type="button"
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Account form */}
        {loginMode === 'account' ? (
          <form className="grid gap-[18px]" onSubmit={(event) => void handleSubmit(event)}>
            <label className={labelCls}>
              <span>Email</span>
              <input autoComplete="email" className={inputCls} name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            </label>
            <label className={labelCls}>
              <span>Password</span>
              <input autoComplete="current-password" className={inputCls} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
            </label>
            {user != null ? <p className="text-zinc-400 dark:text-slate-500 m-0 text-sm">You already have an active session. Redirecting...</p> : null}
            {error ? <p className="text-red-600 dark:text-red-400 m-0 text-[0.9rem]">{error}</p> : null}
            <button
              className="bg-zinc-900 dark:bg-blue-600 text-white rounded-md px-4 py-2.5 text-[0.9rem] font-medium hover:bg-zinc-700 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form className="grid gap-[18px]" onSubmit={(event) => void handleCompanionSubmit(event)}>
            <label className={labelCls}>
              <span>Companion device ID</span>
              <input
                className={inputCls}
                name="companion-key"
                onChange={(event) => setCompanionKey(event.target.value)}
                placeholder="Paste the companion device ID"
                required
                type="password"
                value={companionKey}
              />
            </label>
            <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">
              Use the companion device ID generated from the primary device in Settings.
            </p>
            {error ? <p className="text-red-600 dark:text-red-400 m-0 text-[0.9rem]">{error}</p> : null}
            <button
              className="bg-zinc-900 dark:bg-blue-600 text-white rounded-md px-4 py-2.5 text-[0.9rem] font-medium hover:bg-zinc-700 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Authorizing device...' : 'Login as companion device'}
            </button>
          </form>
        )}

        <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">
          Need an account? <Link className="text-blue-600 dark:text-blue-400 hover:underline" to="/register">Create one</Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
