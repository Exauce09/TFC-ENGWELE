export const MEDECIN_ROLES = [
  'medecin_generaliste',
  'medecin_interne',
  'pediatre',
  'gynecologue',
  'ophtalmologue',
  'urgentiste',
] as const;

export type SpecialiteConfig = {
  title: string;
  dashboardApi: string;
  listApi: string;
  listLabel: string;
  listTitleKey?: string;
  stats: { key: string; label: string }[];
};

export const SPECIALITE_BY_ROLE: Record<string, SpecialiteConfig> = {
  sage_femme: {
    title: 'Maternité',
    dashboardApi: '/maternite/dashboard',
    listApi: '/maternite/suivis',
    listLabel: 'Suivis',
    stats: [
      { key: 'total_suivis', label: 'Total suivis' },
      { key: 'prenatales', label: 'Prénatales' },
      { key: 'accouchements', label: 'Accouchements' },
      { key: 'postnatales', label: 'Postnatales' },
    ],
  },
  chirurgien: {
    title: 'Chirurgie',
    dashboardApi: '/chirurgie/dashboard',
    listApi: '/chirurgie/operations',
    listLabel: 'Opérations',
    stats: [
      { key: 'total', label: 'Total' },
      { key: 'planifiees', label: 'Planifiées' },
      { key: 'en_cours', label: 'En cours' },
      { key: 'terminees', label: 'Terminées' },
    ],
  },
  anesthesiste: {
    title: 'Chirurgie',
    dashboardApi: '/chirurgie/dashboard',
    listApi: '/chirurgie/operations',
    listLabel: 'Opérations',
    stats: [
      { key: 'total', label: 'Total' },
      { key: 'planifiees', label: 'Planifiées' },
      { key: 'en_cours', label: 'En cours' },
      { key: 'terminees', label: 'Terminées' },
    ],
  },
  echographiste: {
    title: 'Échographie',
    dashboardApi: '/echographie/dashboard',
    listApi: '/echographie/examens',
    listLabel: 'Examens',
    stats: [
      { key: 'total', label: 'Total' },
      { key: 'en_attente', label: 'En attente' },
      { key: 'termines', label: 'Terminés' },
    ],
  },
  kinesitherapeute: {
    title: 'Kinésithérapie',
    dashboardApi: '/kinesitherapie/dashboard',
    listApi: '/kinesitherapie/seances',
    listLabel: 'Séances',
    stats: [
      { key: 'total', label: 'Total' },
      { key: 'aujourdhui', label: "Aujourd'hui" },
      { key: 'terminees', label: 'Terminées' },
    ],
  },
  dentiste: {
    title: 'Dentisterie',
    dashboardApi: '/dentisterie/dashboard',
    listApi: '/dentisterie/soins',
    listLabel: 'Soins',
    stats: [
      { key: 'total', label: 'Total' },
      { key: 'aujourdhui', label: "Aujourd'hui" },
      { key: 'termines', label: 'Terminés' },
    ],
  },
};

export const ROLE_HOME: Record<string, string> = {
  patient: '/(patient)/(tabs)',
  medecin_generaliste: '/(medecin)',
  medecin_interne: '/(medecin)',
  pediatre: '/(medecin)',
  gynecologue: '/(medecin)',
  ophtalmologue: '/(medecin)',
  urgentiste: '/(medecin)',
  infirmier: '/(infirmier)',
  receptionniste: '/(accueil)',
  laborantin: '/(labo)',
  pharmacien: '/(pharma)',
  caissier: '/(caisse)',
  admin: '/(admin)',
  sage_femme: '/(specialite)',
  chirurgien: '/(specialite)',
  anesthesiste: '/(specialite)',
  echographiste: '/(specialite)',
  kinesitherapeute: '/(specialite)',
  dentiste: '/(specialite)',
};

export function getHomeRoute(role?: string): string {
  if (!role) return '/(auth)/login';
  return ROLE_HOME[role] ?? '/(app)/home';
}

export function isMedecinRole(role?: string): boolean {
  return !!role && (MEDECIN_ROLES as readonly string[]).includes(role);
}

export const ROLE_LABELS: Record<string, string> = {
  patient: 'Patient',
  medecin_generaliste: 'Médecin généraliste',
  medecin_interne: 'Médecin interne',
  pediatre: 'Pédiatre',
  gynecologue: 'Gynécologue',
  ophtalmologue: 'Ophtalmologue',
  urgentiste: 'Urgentiste',
  admin: 'Administrateur',
  laborantin: 'Laborantin',
  pharmacien: 'Pharmacien',
  caissier: 'Caissier',
  infirmier: 'Infirmier(e)',
  receptionniste: 'Réceptionniste',
  sage_femme: 'Sage-femme',
  chirurgien: 'Chirurgien',
  anesthesiste: 'Anesthésiste',
  echographiste: 'Échographiste',
  kinesitherapeute: 'Kinésithérapeute',
  dentiste: 'Dentiste',
};
