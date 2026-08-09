import type { AuthUser } from '@/src/context/AuthContext';

export const DEMO_PASSWORD = 'Password@123';

export const isDemoMode = () => process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

/** Comptes du parcours Accueil → Traitement (+ admin). */
export const DEMO_USERS: Record<string, AuthUser> = {
  'admin@amen.cd': {
    id: 1,
    name: 'Administrateur AMEN',
    email: 'admin@amen.cd',
    role: 'admin',
    phone: '+243 900 000 001',
  },
  'receptionniste@amen.cd': {
    id: 8,
    name: 'Réceptionniste AMEN',
    email: 'receptionniste@amen.cd',
    role: 'receptionniste',
    phone: '+243 900 000 008',
  },
  'infirmier@amen.cd': {
    id: 5,
    name: 'Infirmier AMEN',
    email: 'infirmier@amen.cd',
    role: 'infirmier',
    phone: '+243 900 000 005',
  },
  'medecin@amen.cd': {
    id: 2,
    name: 'Dr. Jean-Pierre Kabila',
    email: 'medecin@amen.cd',
    role: 'medecin_generaliste',
    phone: '+243 900 000 002',
  },
  'laborantin@amen.cd': {
    id: 6,
    name: 'Laborantin AMEN',
    email: 'laborantin@amen.cd',
    role: 'laborantin',
    phone: '+243 900 000 006',
  },
  'pharmacien@amen.cd': {
    id: 7,
    name: 'Pharmacien AMEN',
    email: 'pharmacien@amen.cd',
    role: 'pharmacien',
    phone: '+243 900 000 007',
  },
  'patient@amen.cd': {
    id: 3,
    name: 'Marie Kalala',
    email: 'patient@amen.cd',
    role: 'patient',
    phone: '+243 900 000 003',
  },
};

export function findDemoUser(email: string, password: string): AuthUser | null {
  const user = DEMO_USERS[email?.toLowerCase()];
  if (!user || password !== DEMO_PASSWORD) return null;
  return user;
}

export function isDemoToken(token: string | null | undefined): boolean {
  return token?.startsWith('demo-token-') ?? false;
}
