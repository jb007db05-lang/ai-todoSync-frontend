import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/services/api';

export interface AuthProfile {
  id: string;
  email: string;
  syncApiKey: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  authProvider: 'local' | 'google';
  openaiApiKeyConfigured?: boolean;
  anthropicApiKeyConfigured?: boolean;
  geminiApiKeyConfigured?: boolean;
  twoFactorEnabled?: boolean;
}

export interface AuthSession {
  sessionId: string | null;
  deviceId: string | null;
  deviceType: 'primary' | 'companion' | 'sync_key';
  deviceName: string | null;
  companionDeviceType: string | null;
  authMethod: 'access_token' | 'sync_api_key';
}

export interface AuthState {
  user: AuthProfile | null;
  session: AuthSession | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  require2fa: boolean;
  tempEmail2fa: string | null;
  rememberMe: boolean;
}

const getPersistedItem = (key: string): string | null => {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
};

const getPersistedJson = <T>(key: string): T | null => {
  const val = getPersistedItem(key);
  if (!val) return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
};

const initialToken = getPersistedItem('todo_token');
const initialRefreshToken = getPersistedItem('todo_refresh_token');
const initialUser = getPersistedJson<AuthProfile>('todo_user');
const initialSession = getPersistedJson<AuthSession>('todo_session');
const initialRememberMe = localStorage.getItem('todo_remember_me') === 'true';

const initialState: AuthState = {
  user: initialUser,
  session: initialSession,
  token: initialToken,
  refreshToken: initialRefreshToken,
  loading: false,
  error: null,
  require2fa: false,
  tempEmail2fa: null,
  rememberMe: initialRememberMe,
};

// Async Thunks
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string; rememberMe: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', {
        email: payload.email,
        password: payload.password,
      });
      return { data: response.data.data, rememberMe: payload.rememberMe };
    } catch (err) {
      const errorObj = err as { message?: string };
      return rejectWithValue(errorObj.message || 'Login failed');
    }
  }
);

export const verify2faThunk = createAsyncThunk(
  'auth/verify2fa',
  async (payload: { email: string; code: string; rememberMe: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-2fa', {
        email: payload.email,
        code: payload.code,
      });
      return { data: response.data.data, rememberMe: payload.rememberMe };
    } catch (err) {
      const errorObj = err as { message?: string };
      return rejectWithValue(errorObj.message || '2FA code verification failed');
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: { email: string; password: string; firstName: string; lastName: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', payload);
      return response.data.data;
    } catch (err) {
      const errorObj = err as { message?: string };
      return rejectWithValue(errorObj.message || 'Registration failed');
    }
  }
);

export const refreshUserThunk = createAsyncThunk(
  'auth/refreshUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (err) {
      const errorObj = err as { message?: string };
      return rejectWithValue(errorObj.message || 'Unable to refresh session');
    }
  }
);

export const updateProfileThunk = createAsyncThunk(
  'auth/updateProfile',
  async (
    payload: {
      firstName?: string;
      lastName?: string;
      openaiApiKey?: string;
      anthropicApiKey?: string;
      geminiApiKey?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.patch('/auth/profile', payload);
      return response.data.data.user;
    } catch (err) {
      const errorObj = err as { message?: string };
      return rejectWithValue(errorObj.message || 'Failed to update profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      clearTokens(state);
    },
    clearError(state) {
      state.error = null;
    },
    setTokens(state, action: PayloadAction<{ token: string; refreshToken: string; user: AuthProfile; session?: AuthSession; rememberMe: boolean }>) {
      state.rememberMe = action.payload.rememberMe;
      saveTokens(state, action.payload);
    },
    setRememberMe(state, action: PayloadAction<boolean>) {
      state.rememberMe = action.payload;
      if (action.payload) {
        localStorage.setItem('todo_remember_me', 'true');
      } else {
        localStorage.removeItem('todo_remember_me');
      }
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.rememberMe = action.payload.rememberMe;
      if (action.payload.data.require2fa) {
        state.require2fa = true;
        state.tempEmail2fa = action.payload.data.email;
      } else {
        saveTokens(state, action.payload.data);
      }
    });
    builder.addCase(loginThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Verify 2FA
    builder.addCase(verify2faThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verify2faThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.rememberMe = action.payload.rememberMe;
      saveTokens(state, action.payload.data);
    });
    builder.addCase(verify2faThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(registerThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerThunk.fulfilled, (state, action) => {
      state.loading = false;
      saveTokens(state, action.payload);
    });
    builder.addCase(registerThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Refresh User
    builder.addCase(refreshUserThunk.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.session = action.payload.session ?? null;
      const storage = state.rememberMe ? localStorage : sessionStorage;
      storage.setItem('todo_user', JSON.stringify(action.payload.user));
      if (action.payload.session) {
        storage.setItem('todo_session', JSON.stringify(action.payload.session));
      }
    });
    builder.addCase(refreshUserThunk.rejected, (state) => {
      clearTokens(state);
    });

    // Update Profile
    builder.addCase(updateProfileThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateProfileThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      const storage = state.rememberMe ? localStorage : sessionStorage;
      storage.setItem('todo_user', JSON.stringify(action.payload));
    });
    builder.addCase(updateProfileThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

function saveTokens(state: AuthState, payload: { token: string; refreshToken: string; user: AuthProfile; session?: AuthSession }) {
  state.token = payload.token;
  state.refreshToken = payload.refreshToken;
  state.user = payload.user;
  state.session = payload.session ?? null;
  state.require2fa = false;
  state.tempEmail2fa = null;

  const storage = state.rememberMe ? localStorage : sessionStorage;
  storage.setItem('todo_token', payload.token);
  storage.setItem('todo_refresh_token', payload.refreshToken);
  storage.setItem('todo_user', JSON.stringify(payload.user));
  if (payload.session) {
    storage.setItem('todo_session', JSON.stringify(payload.session));
  }
  
  if (state.rememberMe) {
    localStorage.setItem('todo_remember_me', 'true');
  } else {
    localStorage.removeItem('todo_remember_me');
  }
}

function clearTokens(state: AuthState) {
  state.token = null;
  state.refreshToken = null;
  state.user = null;
  state.session = null;
  state.require2fa = false;
  state.tempEmail2fa = null;

  localStorage.removeItem('todo_token');
  localStorage.removeItem('todo_refresh_token');
  localStorage.removeItem('todo_user');
  localStorage.removeItem('todo_session');
  localStorage.removeItem('todo_remember_me');

  sessionStorage.removeItem('todo_token');
  sessionStorage.removeItem('todo_refresh_token');
  sessionStorage.removeItem('todo_user');
  sessionStorage.removeItem('todo_session');
}

export const { logout, clearError, setTokens, setRememberMe } = authSlice.actions;
export default authSlice.reducer;
