import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: attach JWT token ────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/api/auth/refresh/`, {
          refresh,
        });

        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getOptimizedImageUrl(url: string, width = 1080, quality = 75): string {
  // Suppress unused-vars warnings — width/quality are intentionally kept as
  // named params for API compatibility but we bypass Next.js image optimization.
  if (width && quality) { /* intentional no-op */ }

  if (!url) return '';

  // Already absolute (from upload response when request context is present)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Relative URL (e.g. /media/annotations/images/...) — prepend backend base
  // This happens when ImageSerializer is nested without request context.
  if (url.startsWith('/')) {
    return `${API_BASE}${url}`;
  }

  return url;
}

export default api;
