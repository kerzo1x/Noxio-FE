import axios from 'axios';
import { apiBaseUrl } from '@/config/api';
import { persistAuthTokensFromEnvelope } from '@/utils/authTokens';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

let refreshInFlight: Promise<void> | null = null;

function runRefresh(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await api.post('/auth/refresh');
      persistAuthTokensFromEnvelope(res.data as Record<string, unknown>);
      if (!localStorage.getItem('access_token')) {
        throw new Error('refresh response had no access token');
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function redirectToLogin() {
  window.location.href = '/auth/login';
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    const url = String(originalRequest.url ?? '');
    if (url.includes('/auth/refresh')) {
      localStorage.removeItem('access_token');
      redirectToLogin();
      return Promise.reject(error);
    }
    originalRequest._retry = true;
    try {
      await runRefresh();
      return api(originalRequest);
    } catch {
      localStorage.removeItem('access_token');
      redirectToLogin();
      return Promise.reject(error);
    }
  },
);

export default api;
