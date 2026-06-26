import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api, {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  saveAuth,
  setUnauthorizedHandler,
} from '@/src/services/api';
import { getHomeRoute } from '@/src/constants/roles';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  date_naissance: string;
  sexe: 'M' | 'F';
  adresse?: string;
  role: 'patient';
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (data: RegisterPayload) => Promise<string>;
  logout: () => Promise<void>;
  setCurrentUser: (user: AuthUser | null) => void;
  hasRole: (...roles: string[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setCurrentUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
  }, []);

  const verifyToken = useCallback(async () => {
    try {
      const res = await api.get('/me');
      const userData = res.data.data as AuthUser;
      setUser(userData);
      const token = await getStoredToken();
      if (token) {
        await saveAuth(token, userData);
      }
    } catch {
      await clearAuthStorage();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    void (async () => {
      const token = await getStoredToken();
      const cachedUser = await getStoredUser();
      if (token && cachedUser) {
        setUser(JSON.parse(cachedUser) as AuthUser);
        await verifyToken();
      } else {
        setLoading(false);
      }
    })();
  }, [verifyToken]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/login', { email, password });
    const { token, user: userData, role } = res.data.data;
    await saveAuth(token, userData);
    setUser(userData);
    return getHomeRoute(role);
  }, []);

  const register = useCallback(async (data: RegisterPayload) => {
    const res = await api.post('/register', data);
    const { token, user: userData } = res.data.data;
    await saveAuth(token, userData);
    setUser(userData);
    return getHomeRoute(userData.role);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // no-op
    }
    await clearAuthStorage();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      setCurrentUser,
      hasRole: (...roles: string[]) => roles.includes(user?.role ?? ''),
    }),
    [user, loading, login, register, logout, setCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
