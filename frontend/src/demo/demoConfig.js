export const DEMO_PASSWORD = 'Password@123';

/** Mode démo : build CI ou hébergement GitHub Pages (pas d'API publique). */
export const isDemoMode = () => {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return true;
  if (typeof window !== 'undefined' && /\.github\.io$/i.test(window.location.hostname)) {
    return true;
  }
  return false;
};

/** Comptes démo (parcours + spécialités). */
export const DEMO_USERS = {
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
  'caissier@amen.cd': {
    id: 9,
    name: 'Caissier AMEN',
    email: 'caissier@amen.cd',
    role: 'caissier',
    phone: '+243 900 000 009',
  },
  'sagefemme@amen.cd': {
    id: 10,
    name: 'Sage-femme AMEN',
    email: 'sagefemme@amen.cd',
    role: 'sage_femme',
    phone: '+243 900 000 010',
  },
  'chirurgien@amen.cd': {
    id: 11,
    name: 'Dr. Chirurgien AMEN',
    email: 'chirurgien@amen.cd',
    role: 'chirurgien',
    phone: '+243 900 000 011',
  },
  'echographiste@amen.cd': {
    id: 12,
    name: 'Échographiste AMEN',
    email: 'echographiste@amen.cd',
    role: 'echographiste',
    phone: '+243 900 000 012',
  },
  'kine@amen.cd': {
    id: 13,
    name: 'Kinésithérapeute AMEN',
    email: 'kine@amen.cd',
    role: 'kinesitherapeute',
    phone: '+243 900 000 013',
  },
  'dentiste@amen.cd': {
    id: 14,
    name: 'Dentiste AMEN',
    email: 'dentiste@amen.cd',
    role: 'dentiste',
    phone: '+243 900 000 014',
  },
  'patient@amen.cd': {
    id: 3,
    name: 'Marie Kalala',
    email: 'patient@amen.cd',
    role: 'patient',
    phone: '+243 900 000 003',
  },
};

export function findDemoUser(email, password) {
  const user = DEMO_USERS[email?.toLowerCase()];
  if (!user || password !== DEMO_PASSWORD) return null;
  return user;
}

export function isDemoToken(token) {
  return token?.startsWith('demo-token-');
}
