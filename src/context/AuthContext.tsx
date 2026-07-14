import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import api from '@/services/api';
import { RootState, AppDispatch } from '@/store';
import {
  AuthProfile,
  AuthSession,
  loginThunk,
  verify2faThunk,
  registerThunk,
  refreshUserThunk,
  updateProfileThunk,
  logout as logoutAction,
  clearError as clearErrorAction,
  setTokens,
  setRememberMe
} from '@/store/authSlice';

interface AuthContextValue {
  user: AuthProfile | null;
  session: AuthSession | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  require2fa: boolean;
  tempEmail2fa: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithCompanionKey: (key: string) => Promise<void>;
  authenticateWithToken: (token: string) => Promise<void>;
  register: (payload: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    geminiApiKey?: string;
  }) => Promise<void>;
  verify2fa: (email: string, code: string, rememberMe?: boolean) => Promise<void>;
  clearError: () => void;
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

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const { user, session, token, loading, error, require2fa, tempEmail2fa } = useSelector(
    (state: RootState) => state.auth
  );

  // Check URL token (e.g. Google OAuth callback redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());

      // Treat redirect login as rememberMe = true
      api.get('/auth/me', {
        headers: { Authorization: `Bearer ${tokenFromUrl}` }
      })
        .then((res) => {
          const fetchedUser = res.data.data.user;
          const fetchedSession = res.data.data.session;
          
          // Generate refresh token via new login response or assume it works
          dispatch(setTokens({
            token: tokenFromUrl,
            refreshToken: tokenFromUrl, // Simple fallback if not provided in URL
            user: fetchedUser,
            session: fetchedSession,
            rememberMe: true
          }));
        })
        .catch(() => {
          // Failed to authenticate
        });
    }
  }, [dispatch]);

  const logout = useCallback((): void => {
    dispatch(logoutAction());
  }, [dispatch]);

  const refreshUser = useCallback(async (): Promise<void> => {
    await dispatch(refreshUserThunk()).unwrap();
  }, [dispatch]);

  const login = async (email: string, password: string, rememberMe = false): Promise<void> => {
    dispatch(setRememberMe(rememberMe));
    await dispatch(loginThunk({ email, password, rememberMe })).unwrap();
  };

  const verify2fa = async (email: string, code: string, rememberMe = false): Promise<void> => {
    dispatch(setRememberMe(rememberMe));
    await dispatch(verify2faThunk({ email, code, rememberMe })).unwrap();
  };

  const register = async (payload: { email: string; password: string; firstName: string; lastName: string }): Promise<void> => {
    await dispatch(registerThunk(payload)).unwrap();
  };

  const updateProfile = async (data: {
    firstName?: string;
    lastName?: string;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    geminiApiKey?: string;
  }): Promise<void> => {
    await dispatch(updateProfileThunk(data)).unwrap();
  };

  const loginWithCompanionKey = async (key: string): Promise<void> => {
    // Companion device login does not support 2FA or persistent refresh tokens on primary
    // but let's allow basic session setup.
    await dispatch(setRememberMe(false));
    const response = await api.post<AuthResponse>('/auth/companion-login', { key });
    dispatch(setTokens({
      token: response.data.data.token,
      refreshToken: response.data.data.token, // Fallback
      user: response.data.data.user,
      session: response.data.data.session,
      rememberMe: false
    }));
  };

  const authenticateWithToken = useCallback(
    async (newToken: string): Promise<void> => {
      // Direct token injection
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      dispatch(setTokens({
        token: newToken,
        refreshToken: newToken,
        user: response.data.data.user,
        session: response.data.data.session,
        rememberMe: false
      }));
    },
    [dispatch]
  );

  const clearError = useCallback((): void => {
    dispatch(clearErrorAction());
  }, [dispatch]);

  const value = useMemo(
    () => ({
      user,
      session,
      token,
      loading,
      error,
      require2fa,
      tempEmail2fa,
      login,
      loginWithCompanionKey,
      register,
      logout,
      refreshUser,
      authenticateWithToken,
      updateProfile,
      verify2fa,
      clearError
    }),
    [user, session, token, loading, error, require2fa, tempEmail2fa, logout, refreshUser, authenticateWithToken, clearError]
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