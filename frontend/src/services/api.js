import axios from 'axios';
import { isDemoMode, isDemoToken } from '../demo/demoConfig';
import { resolveMock } from '../demo/mockApi';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
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
    if (error.response?.status === 401 && !isDemoMode() && !isDemoToken(localStorage.getItem('amen_token'))) {
      localStorage.removeItem('amen_token');
      localStorage.removeItem('amen_user');
      const base = import.meta.env.BASE_URL || '/';
      window.location.href = `${base}login`;
    }
    return Promise.reject(error);
  }
);

export default api;
