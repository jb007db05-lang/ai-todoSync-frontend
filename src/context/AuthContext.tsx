import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import api, { TOKEN_STORAGE_KEY } from '@/services/api';

interface AuthProfile {
  id: string;
  email: string;
  syncApiKey: string;
  name: string | null;
  authProvider: 'local' | 'google';
}

interface AuthSession {
  sessionId: string | null;
  deviceId: string | null;
  deviceType: 'primary' | 'companion' | 'sync_key';
  deviceName: string | null;
  companionDeviceType: string | null;
  authMethod: 'access_token' | 'sync_api_key';
}

interface AuthContextValue {
  user: AuthProfile | null;
  session: AuthSession | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithCompanionKey: (key: string) => Promise<void>;
  authenticateWithToken: (token: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthResponseData {
  token: string;
  user: AuthProfile;
  session?: AuthSession;
}

interface AuthResponse {
  message: string;
  data: AuthResponseData;
}

interface MeResponse {
  message: string;
  data: {
    user: AuthProfile;
    session?: AuthSession | null;
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      localStorage.setItem(TOKEN_STORAGE_KEY, tokenFromUrl);
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
      return tokenFromUrl;
    }
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [loading, setLoading] = useState<boolean>(token != null);
  const [error, setError] = useState<string | null>(null);

  const persistToken = useCallback((value: string | null) => {
    setToken(value);

    if (value) {
      localStorage.setItem(TOKEN_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  const logout = useCallback((): void => {
    persistToken(null);
    setUser(null);
    setSession(null);
    setError(null);
  }, [persistToken]);

  const handleAuthSuccess = useCallback((payload: AuthResponseData) => {
    persistToken(payload.token);
    setUser(payload.user);
    setSession(payload.session ?? null);
    setError(null);
  }, [persistToken]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get<MeResponse>('/auth/me');
      setUser(response.data.data.user);
      setSession(response.data.data.session ?? null);
      setError(null);
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      setSession(null);
      return;
    }

    setLoading(true);

    refreshUser()
      .catch(() => {
        setError('Unable to refresh session.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refreshUser, token]);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      handleAuthSuccess(response.data.data);
    } catch (error) {
      setError('Login failed. Check your credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<AuthResponse>('/auth/register', { email, password });
      handleAuthSuccess(response.data.data);
    } catch (error) {
      setError('Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithCompanionKey = async (key: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<AuthResponse>('/auth/companion-login', { key });
      handleAuthSuccess(response.data.data);
    } catch (error) {
      setError('Companion login failed. Check the key and try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const authenticateWithToken = useCallback(
    async (newToken: string): Promise<void> => {
      setLoading(true);
      setError(null);

      persistToken(newToken);

      try {
        await refreshUser();
      } finally {
        setLoading(false);
      }
    },
    [persistToken, refreshUser]
  );

  const value = useMemo(
    () => ({
      user,
      session,
      token,
      loading,
      error,
      login,
      loginWithCompanionKey,
      register,
      logout,
      refreshUser,
      authenticateWithToken
    }),
    [authenticateWithToken, error, loading, login, loginWithCompanionKey, logout, refreshUser, register, session, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context == null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthProvider;
export { useAuth };
