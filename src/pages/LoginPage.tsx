import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, Smartphone } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

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
    <main className="auth-page">
      <section className="card">
        <h1>Login</h1>
        <p>Sign in to access your synced tasks.</p>
        <button className="oauth-trigger" disabled={loading} onClick={startGoogleSignIn} type="button">
          Sign in with Google
        </button>
        <p className="oauth-divider">or choose a login method</p>
        <div className="auth-mode-switch" role="tablist" aria-label="Login method">
          <button
            aria-selected={loginMode === 'account'}
            className={`auth-mode-button${loginMode === 'account' ? ' auth-mode-button-active' : ''}`}
            onClick={() => setLoginMode('account')}
            type="button"
          >
            <KeyRound size={14} />
            Account login
          </button>
          <button
            aria-selected={loginMode === 'companion'}
            className={`auth-mode-button${loginMode === 'companion' ? ' auth-mode-button-active' : ''}`}
            onClick={() => setLoginMode('companion')}
            type="button"
          >
            <Smartphone size={14} />
            Companion device
          </button>
        </div>
        {loginMode === 'account' ? (
          <form className="form" onSubmit={(event) => void handleSubmit(event)}>
            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete="current-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            {user != null ? <p className="muted-text">You already have an active session. Redirecting...</p> : null}
            {error ? <p className="error-text">{error}</p> : null}
            <button disabled={loading} type="submit">
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={(event) => void handleCompanionSubmit(event)}>
            <label>
              <span>Companion device ID</span>
              <input
                name="companion-key"
                onChange={(event) => setCompanionKey(event.target.value)}
                placeholder="Paste the companion device ID"
                required
                type="password"
                value={companionKey}
              />
            </label>
            <p className="muted-text">
              Use the companion device ID generated from the primary device in Settings.
            </p>
            {error ? <p className="error-text">{error}</p> : null}
            <button disabled={loading} type="submit">
              {loading ? 'Authorizing device...' : 'Login as companion device'}
            </button>
          </form>
        )}
        <p className="muted-text">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </section>
      <section className="card">
        <h2>Next up</h2>
        <p>Task list widgets, daily grouping, and sync history will be added after auth is stable.</p>
      </section>
    </main>
  );
}

export default LoginPage;
