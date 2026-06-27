export const colors = {
  primary: '#0284c7',
  primaryDark: '#0369a1',
  primaryLight: '#38bdf8',
  accent: '#0d9488',
  accentDark: '#0f766e',
  navy: '#0f172a',
  navySoft: '#1e293b',
  background: '#f1f5f9',
  backgroundDark: '#0f172a',
  card: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  error: '#dc2626',
  errorBg: '#fef2f2',
  success: '#059669',
  successBg: '#ecfdf5',
  warning: '#d97706',
  warningBg: '#fffbeb',
  white: '#ffffff',
};

export const gradients = {
  hero: ['#0c4a6e', '#0f766e'] as const,
  primary: ['#0284c7', '#0d9488'] as const,
  cardBlue: ['#0369a1', '#0284c7'] as const,
  cardTeal: ['#0f766e', '#14b8a6'] as const,
  overlay: ['rgba(15,23,42,0.85)', 'rgba(15,23,42,0.4)', 'transparent'] as const,
};

export const shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  button: {
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

export const statutColors: Record<string, { bg: string; text: string }> = {
  confirme: { bg: '#d1fae5', text: '#047857' },
  en_attente: { bg: '#fef3c7', text: '#b45309' },
  en_cours: { bg: '#dbeafe', text: '#1d4ed8' },
  termine: { bg: '#f1f5f9', text: '#475569' },
  annule: { bg: '#fee2e2', text: '#b91c1c' },
  emise: { bg: '#fef3c7', text: '#b45309' },
  payee: { bg: '#d1fae5', text: '#047857' },
};
