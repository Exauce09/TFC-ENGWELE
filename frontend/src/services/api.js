import axios from 'axios';
import { isDemoMode, isDemoToken } from '../demo/demoConfig';
import { resolveMock } from '../demo/mockApi';

const api = axios.create({
  // En dev Vite : proxy /api → backend (voir vite.config.js). Sinon URL absolue.
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api/v1' : 'http://localhost:8000/api/v1'),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (isDemoMode()) {
    config.adapter = async (cfg) => {
      const data = resolveMock(cfg);
      return {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: cfg,
      };
    };
  }

  const token = localStorage.getItem('amen_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error.config?.url || '');
    const isAuthAttempt = /\/login\b|\/register\b|\/forgot-password\b/i.test(url);
    // Ne pas recharger la page sur un échec de connexion (sinon le message d'erreur disparaît)
    if (
      error.response?.status === 401 &&
      !isAuthAttempt &&
      !isDemoMode() &&
      !isDemoToken(localStorage.getItem('amen_token'))
    ) {
      localStorage.removeItem('amen_token');
      localStorage.removeItem('amen_user');
      const base = import.meta.env.BASE_URL || '/';
      window.location.href = `${base}login`;
    }
    return Promise.reject(error);
  }
);

export default api;
