import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { showGlobalToast } from '@/context/ToastContext';
import { normalizeApiError } from '@/utils/apiError';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const TOKEN_STORAGE_KEY = 'todo_token';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY) ?? sessionStorage.getItem(TOKEN_STORAGE_KEY);

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

interface FailedRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig | undefined;
    const normalizedError = normalizeApiError(error);

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('todo_refresh_token') ?? sessionStorage.getItem('todo_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          const { token: newAccessToken, refreshToken: newRefreshToken, user, session } = res.data.data;
          
          const rememberMe = localStorage.getItem('todo_remember_me') === 'true';
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem(TOKEN_STORAGE_KEY, newAccessToken);
          storage.setItem('todo_refresh_token', newRefreshToken);
          storage.setItem('todo_user', JSON.stringify(user));
          if (session) {
            storage.setItem('todo_session', JSON.stringify(session));
          }

          processQueue(null, newAccessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return api(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem('todo_refresh_token');
          localStorage.removeItem('todo_user');
          localStorage.removeItem('todo_session');
          localStorage.removeItem('todo_remember_me');
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          sessionStorage.removeItem('todo_refresh_token');
          sessionStorage.removeItem('todo_user');
          sessionStorage.removeItem('todo_session');

          if (window.location.pathname !== '/login') {
            window.location.assign('/login');
          }
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }

    showGlobalToast({
      variant: 'error',
      message: normalizedError.message,
      dedupeKey: `${normalizedError.code}:${normalizedError.message}`
    });

    return Promise.reject(normalizedError);
  }
);

export { TOKEN_STORAGE_KEY };
export default api;
