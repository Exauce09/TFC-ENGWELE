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
  description:
    "Le Centre Médical AMEN est un établissement de santé privé situé dans la commune de Matete, sur l'avenue Vitamine 1 numéro 36 D/Bis. Créé en juillet 2007, le centre compte plusieurs années d'expérience dans la prestation des soins de santé. En moyenne, le centre reçoit environ quatorze patients par jour.",
  organization:
    "L'organisation interne repose sur une hiérarchie administrative et médicale : direction, médecins, personnel soignant et agents administratifs. Les patients sont accueillis à la réception avant d'être orientés vers les consultations appropriées.",
};

export const HOSPITAL_STATS = {
  patientsParJour: HOSPITAL.avgPatientsPerDay,
  anneesExperience: new Date().getFullYear() - HOSPITAL.foundedYear,
  depuis: `Depuis ${HOSPITAL.foundedMonth} ${HOSPITAL.foundedYear}`,
};
