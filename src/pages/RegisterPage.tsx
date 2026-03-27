import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const { register, loading, error, user } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const apiBase = useMemo(
    () => (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, ''),
    []
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await register(email, password);
    navigate('/', { replace: true });
  };

  const startGoogleSignIn = (): void => {
    const params = new URLSearchParams();
    params.set('redirect', '/');
    window.location.assign(`${apiBase}/auth/google?${params.toString()}`);
  };

  return (
    <main className="auth-page">
      <section className="card">
        <h1>Create account</h1>
        <p>Register with the same backend auth contract used by the API.</p>
        <button className="oauth-trigger" disabled={loading} onClick={startGoogleSignIn} type="button">
          Sign up with Google
        </button>
        <p className="oauth-divider">or create an email account</p>
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
              autoComplete="new-password"
              minLength={6}
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
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="muted-text">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
      <section className="card">
        <h2>Next up</h2>
        <p>Task creation, filters, and sync previews will be layered onto the dashboard after onboarding.</p>
      </section>
    </main>
  );
}

export default RegisterPage;
