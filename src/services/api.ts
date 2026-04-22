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
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const normalizedError = normalizeApiError(error);

    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);

      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
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
