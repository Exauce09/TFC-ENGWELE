import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { findDemoUser, isDemoMode, isDemoToken } from '../demo/demoConfig';

const AuthContext = createContext(null);

const ROLE_ROUTES = {
  patient: '/patient/dashboard',
  medecin_generaliste: '/medecin/dashboard',
  medecin_interne: '/medecin/dashboard',
  pediatre: '/medecin/dashboard',
  gynecologue: '/medecin/dashboard',
  ophtalmologue: '/medecin/dashboard',
  urgentiste: '/medecin/dashboard',
  sage_femme: '/maternite/dashboard',
  chirurgien: '/chirurgie/dashboard',
  anesthesiste: '/chirurgie/dashboard',
  laborantin: '/laboratoire/dashboard',
  echographiste: '/echographie/dashboard',
  kinesitherapeute: '/kinesitherapie/dashboard',
  dentiste: '/dentisterie/dashboard',
  pharmacien: '/pharmacie/dashboard',
  infirmier: '/infirmier/dashboard',
  caissier: '/caisse/dashboard',
  receptionniste: '/accueil/dashboard',
  admin: '/admin/dashboard',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('amen_token');
    const cachedUser = localStorage.getItem('amen_user');
    if (token && cachedUser) {
      setUser(JSON.parse(cachedUser));
      if (isDemoMode() && isDemoToken(token)) {
        setLoading(false);
        return;
      }
      void verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const res = await api.get('/me');
      const userData = res.data.data;
      setUser(userData);
      localStorage.setItem('amen_user', JSON.stringify(userData));
    } catch {
      localStorage.removeItem('amen_token');
      localStorage.removeItem('amen_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const identifiant = String(email || '').trim();
    const pwd = String(password || '');
    if (isDemoMode()) {
      const demoUser = findDemoUser(identifiant.toLowerCase(), pwd);
      if (!demoUser) {
        throw { response: { data: { message: 'Email ou mot de passe incorrect (démo).' } } };
      }
      const token = `demo-token-${demoUser.email}`;
      localStorage.setItem('amen_token', token);
      localStorage.setItem('amen_user', JSON.stringify(demoUser));
      setUser(demoUser);
      return ROLE_ROUTES[demoUser.role] || '/';
    }

    const res = await api.post('/login', { email: identifiant, password: pwd });
    const { token, user: userData, role, redirect } = res.data.data;
    localStorage.setItem('amen_token', token);
    localStorage.setItem('amen_user', JSON.stringify(userData));
    setUser(userData);
    if (redirect) return redirect;
    if (userData?.needs_onboarding && role === 'patient') return '/patient/premiere-connexion';
    return ROLE_ROUTES[role] || '/';
  };

  const register = async (data) => {
    if (isDemoMode()) {
      const demoUser = {
        id: 99,
        name: data.name,
        email: data.email,
        role: 'patient',
        phone: data.phone,
      };
      localStorage.setItem('amen_token', `demo-token-${data.email}`);
      localStorage.setItem('amen_user', JSON.stringify(demoUser));
      setUser(demoUser);
      return '/patient/dashboard';
    }

    const res = await api.post('/register', data);
    const { token, user: userData } = res.data.data;
    localStorage.setItem('amen_token', token);
    localStorage.setItem('amen_user', JSON.stringify(userData));
    setUser(userData);
    return '/patient/dashboard';
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // no-op
    }
    localStorage.removeItem('amen_token');
    localStorage.removeItem('amen_user');
    setUser(null);
  };

  const setCurrentUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('amen_user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('amen_user');
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      setCurrentUser,
      hasRole: (...roles) => roles.includes(user?.role),
      isDemoMode: isDemoMode(),
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
