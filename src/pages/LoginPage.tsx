import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, user } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
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

  const startGoogleSignIn = (): void => {
    const params = new URLSearchParams();
    params.set('redirect', nextPath);
    window.location.assign(`${apiBase}/api/auth/google?${params.toString()}`);
  };

  return (
    <main className="auth-page">
      <section className="card">
        <h1>Login</h1>
        <p>Sign in to access your synced tasks.</p>
        <button className="oauth-trigger" disabled={loading} onClick={startGoogleSignIn} type="button">
          Sign in with Google
        </button>
        <p className="oauth-divider">or use your email</p>
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
