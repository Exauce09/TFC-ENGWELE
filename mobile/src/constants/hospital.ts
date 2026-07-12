export const HOSPITAL = {
  name: 'Centre Médical AMEN',
  legalName: 'FOSPHA ONGD/ASBL',
  address: 'Avenue Vitamine 1, n° 36 D/Bis',
  commune: 'Matete',
  city: 'Kinshasa',
  country: 'RDC',
  fullAddress: 'Avenue Vitamine 1, n° 36 D/Bis — Commune de Matete, Kinshasa, RDC',
  foundedYear: 2007,
  foundedMonth: 'juillet',
  avgPatientsPerDay: 14,
  tagline: 'Votre santé, notre priorité',
  shortDescription:
    'Établissement de santé privé créé en juillet 2007, situé à Matete. Environ 14 patients accueillis chaque jour.',
  description:
    "Le Centre Médical AMEN est un établissement de santé privé situé dans la commune de Matete, sur l'avenue Vitamine 1 numéro 36 D/Bis. Créé en juillet 2007, le centre compte plusieurs années d'expérience dans la prestation des soins de santé.",
} as const;

export const HOSPITAL_STATS = {
  patientsParJour: HOSPITAL.avgPatientsPerDay,
  anneesExperience: new Date().getFullYear() - HOSPITAL.foundedYear,
  depuis: `Depuis ${HOSPITAL.foundedMonth} ${HOSPITAL.foundedYear}`,
} as const;
