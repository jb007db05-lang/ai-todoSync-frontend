import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

function GoogleOAuthCallbackPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticateWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const redirectTo = params.get('redirect') ?? '/';

    if (!token) {
      setError('Google OAuth did not return a valid token.');
      return;
    }

    const timeout = setTimeout(() => {
      setError('Sign-in timed out. Please try again.');
    }, 10000);

    void (async () => {
      try {
        await authenticateWithToken(token);
        clearTimeout(timeout);
        navigate(redirectTo.startsWith('/') ? redirectTo : '/', { replace: true });
      } catch {
        clearTimeout(timeout);
        setError('Unable to complete Google sign-in.');
      }
    })();

    return () => clearTimeout(timeout);
  }, [authenticateWithToken, location.search, navigate]);

  return (
    <main className="route-state">
      {error ? <p className="error-text">{error}</p> : <p>Finalizing Google sign-in…</p>}
    </main>
  );
}

export default GoogleOAuthCallbackPage;