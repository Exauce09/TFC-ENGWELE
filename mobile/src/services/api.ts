import axios from 'axios';
import { Platform } from 'react-native';

import { getItem, removeItem, setItem } from '@/src/services/storage';

const TOKEN_KEY = 'amen_token';
const USER_KEY = 'amen_user';

function defaultBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://127.0.0.1:8000/api/v1';
}

const api = axios.create({
  baseURL: defaultBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export async function getStoredToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<string | null> {
  return getItem(USER_KEY);
}

export async function saveAuth(token: string, user: object) {
  await setItem(TOKEN_KEY, token);
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuthStorage() {
  await removeItem(TOKEN_KEY);
  await removeItem(USER_KEY);
}

api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuthStorage();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default api;
