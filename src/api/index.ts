import axios from 'axios';
import { persistAuthTokensFromEnvelope } from '@/utils/authTokens';

const api = axios.create({
  baseURL: 'https://hrica.skyro.dev/api/v1',
});

let refreshInFlight: Promise<void> | null = null;

function runRefresh(): Promise<void> {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) {
    return Promise.reject(new Error('missing refresh_token'));
  }
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await axios.post(
        'https://hrica.skyro.dev/api/v1/auth/refresh',
        { refresh_token },
        { headers: { 'Content-Type': 'application/json' } },
      );
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
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }
    originalRequest._retry = true;
    try {
      await runRefresh();
      return api(originalRequest);
    } catch {
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }
  },
);

export default api;