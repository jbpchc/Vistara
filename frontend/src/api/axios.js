import axios from 'axios';
import { demoAdapter } from '@/api/demo';

/**
 * Axios instance pre-configured for the Camella GuardTrack API.
 * The Vite proxy handles /api → http://localhost:5000 in development.
 * In production, set VITE_API_BASE_URL as the full backend URL.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Demo mode (static hosting, no backend): answer requests from an in-memory fake API.
export const IS_DEMO = import.meta.env.VITE_DEMO === 'true';
if (IS_DEMO) api.defaults.adapter = demoAdapter;

// ─── Request Interceptor: Attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('guardtrack_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale token and redirect to login
      localStorage.removeItem('guardtrack_token');
      localStorage.removeItem('guardtrack_user');
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }
    return Promise.reject(error);
  }
);

export default api;
