export const ROLE_HOME: Record<string, string> = {
  patient: '/(patient)/(tabs)',
  medecin_generaliste: '/(app)/home',
  medecin_interne: '/(app)/home',
  pediatre: '/(app)/home',
  gynecologue: '/(app)/home',
  ophtalmologue: '/(app)/home',
  urgentiste: '/(app)/home',
  sage_femme: '/(app)/home',
  chirurgien: '/(app)/home',
  anesthesiste: '/(app)/home',
  laborantin: '/(app)/home',
  echographiste: '/(app)/home',
  kinesitherapeute: '/(app)/home',
  dentiste: '/(app)/home',
  pharmacien: '/(app)/home',
  infirmier: '/(app)/home',
  caissier: '/(app)/home',
  receptionniste: '/(app)/home',
  admin: '/(app)/home',
};

export function getHomeRoute(role?: string): string {
  if (!role) return '/(auth)/login';
  return ROLE_HOME[role] ?? '/(app)/home';
}

export const ROLE_LABELS: Record<string, string> = {
  patient: 'Patient',
  medecin_generaliste: 'Médecin',
  admin: 'Administrateur',
  infirmier: 'Infirmier',
  caissier: 'Caissier',
  receptionniste: 'Réceptionniste',
};
