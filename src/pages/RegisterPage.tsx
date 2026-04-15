import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

const inputCls = 'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md text-zinc-900 dark:text-slate-100 px-4 py-3.5 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10';
const labelCls = 'grid gap-2 font-medium text-[0.95rem] text-zinc-900 dark:text-slate-100';

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
    <main className="min-h-screen flex items-start justify-center gap-5 py-20 px-5">
      {/* Register card */}
      <section className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-lg shadow-sm p-8 w-full max-w-[480px] grid gap-5">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-slate-100 m-0">Create account</h1>
          <p className="text-zinc-500 dark:text-slate-400 mt-1">Register with the same backend auth contract used by the API.</p>
        </div>

        {/* Google OAuth */}
        <button
          className="w-full py-3 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md text-zinc-700 dark:text-slate-200 font-medium hover:bg-zinc-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2.5 shadow-sm transition-colors disabled:opacity-50"
          disabled={loading}
          onClick={startGoogleSignIn}
          type="button"
        >
          Sign up with Google
        </button>

        <p className="text-center text-zinc-400 dark:text-slate-500 text-sm m-0">or create an email account</p>

        <form className="grid gap-[18px]" onSubmit={(event) => void handleSubmit(event)}>
          <label className={labelCls}>
            <span>Email</span>
            <input autoComplete="email" className={inputCls} name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label className={labelCls}>
            <span>Password</span>
            <input autoComplete="new-password" className={inputCls} minLength={6} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          {user != null ? <p className="text-zinc-400 dark:text-slate-500 m-0 text-sm">You already have an active session. Redirecting...</p> : null}
          {error ? <p className="text-red-600 dark:text-red-400 m-0 text-[0.9rem]">{error}</p> : null}
          <button
            className="bg-zinc-900 dark:bg-blue-600 text-white rounded-md px-4 py-2.5 text-[0.9rem] font-medium hover:bg-zinc-700 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">
          Already registered? <Link className="text-blue-600 dark:text-blue-400 hover:underline" to="/login">Login</Link>
        </p>
      </section>

    </main>
  );
}

export default RegisterPage;
