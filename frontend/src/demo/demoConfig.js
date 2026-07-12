export const DEMO_PASSWORD = 'Password@123';

export const isDemoMode = () => import.meta.env.VITE_DEMO_MODE === 'true';

export const DEMO_USERS = {
  'admin@amen.cd': {
    id: 1,
    name: 'Administrateur AMEN',
    email: 'admin@amen.cd',
    role: 'admin',
    phone: '+243 900 000 001',
  },
  'medecin@amen.cd': {
    id: 2,
    name: 'Dr. Jean-Pierre Kabila',
    email: 'medecin@amen.cd',
    role: 'medecin_generaliste',
    phone: '+243 900 000 002',
  },
  'patient@amen.cd': {
    id: 3,
    name: 'Marie Kalala',
    email: 'patient@amen.cd',
    role: 'patient',
    phone: '+243 900 000 003',
  },
  'caissier@amen.cd': {
    id: 4,
    name: 'Caissier AMEN',
    email: 'caissier@amen.cd',
    role: 'caissier',
    phone: '+243 900 000 004',
  },
  'infirmier@amen.cd': {
    id: 5,
    name: 'Infirmier AMEN',
    email: 'infirmier@amen.cd',
    role: 'infirmier',
    phone: '+243 900 000 005',
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
  'receptionniste@amen.cd': {
    id: 8,
    name: 'Réceptionniste AMEN',
    email: 'receptionniste@amen.cd',
    role: 'receptionniste',
    phone: '+243 900 000 008',
  },
  'sage-femme@amen.cd': {
    id: 9,
    name: 'Sage-femme AMEN',
    email: 'sage-femme@amen.cd',
    role: 'sage_femme',
    phone: '+243 900 000 009',
  },
  'chirurgien@amen.cd': {
    id: 10,
    name: 'Dr. Chirurgien AMEN',
    email: 'chirurgien@amen.cd',
    role: 'chirurgien',
    phone: '+243 900 000 010',
  },
  'echographiste@amen.cd': {
    id: 11,
    name: 'Échographiste AMEN',
    email: 'echographiste@amen.cd',
    role: 'echographiste',
    phone: '+243 900 000 011',
  },
  'kinesitherapeute@amen.cd': {
    id: 12,
    name: 'Kinésithérapeute AMEN',
    email: 'kinesitherapeute@amen.cd',
    role: 'kinesitherapeute',
    phone: '+243 900 000 012',
  },
  'dentiste@amen.cd': {
    id: 13,
    name: 'Dentiste AMEN',
    email: 'dentiste@amen.cd',
    role: 'dentiste',
    phone: '+243 900 000 013',
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
