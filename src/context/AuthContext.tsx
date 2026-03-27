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

interface AuthContextValue {
  user: AuthProfile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  authenticateWithToken: (token: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthResponseData {
  token: string;
  user: AuthProfile;
}

interface AuthResponse {
  message: string;
  data: AuthResponseData;
}

interface MeResponse {
  message: string;
  data: {
    user: AuthProfile;
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
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
    setError(null);
  }, [persistToken]);

  const handleAuthSuccess = useCallback((payload: AuthResponseData) => {
    persistToken(payload.token);
    setUser(payload.user);
    setError(null);
  }, [persistToken]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get<MeResponse>('/auth/me');
      setUser(response.data.data.user);
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
    () => ({ user, token, loading, error, login, register, logout, refreshUser, authenticateWithToken }),
    [error, loading, login, logout, refreshUser, register, token, user, authenticateWithToken]
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
