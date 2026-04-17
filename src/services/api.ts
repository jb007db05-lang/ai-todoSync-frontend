import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const TOKEN_STORAGE_KEY = 'todo_token';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

import { startGlobalLoading, stopGlobalLoading } from '@/context/LoadingContext';

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Only start loading if it's not a chat endpoint
  if (!config.url?.includes('/chat')) {
    startGlobalLoading();
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (!response.config.url?.includes('/chat')) {
      stopGlobalLoading();
    }
    return response;
  },
  (error: AxiosError) => {
    if (!error.config?.url?.includes('/chat')) {
      stopGlobalLoading();
    }

    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);

      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export { TOKEN_STORAGE_KEY };
export default api;
