import api from './api';

export const admissionsApi = {
  list: (params = {}) => api.get('/admissions', { params }),
  get: (id) => api.get(`/admissions/${id}`),
  create: (payload) => api.post('/admissions', payload),
  triage: (id, payload) => api.patch(`/admissions/${id}/triage`, payload),
  consultation: (id, payload) => api.patch(`/admissions/${id}/consultation`, payload),
  prelevement: (id, payload) => api.patch(`/admissions/${id}/prelevement`, payload),
  examens: (id, payload) => api.post(`/admissions/${id}/examens`, payload),
  diagnostic: (id, payload) => api.patch(`/admissions/${id}/diagnostic`, payload),
  prescription: (id, payload) => api.post(`/admissions/${id}/prescription`, payload),
  initiation: (id, payload) => api.patch(`/admissions/${id}/initiation`, payload),
  suivi: (id, payload) => api.patch(`/admissions/${id}/suivi`, payload),
};

export const STATUT_STEPS = [
  { key: 'enregistre', label: '1. Accueil' },
  { key: 'triage', label: '2. Triage' },
  { key: 'consultation_medicale', label: '3. Consultation' },
  { key: 'prelevement', label: '4. Prélèvement' },
  { key: 'examens_laboratoire', label: '5. Labo' },
  { key: 'diagnostic_prescription', label: '6. Diagnostic' },
  { key: 'delivrance_medicaments', label: '7. Pharmacie' },
  { key: 'initiation_traitement', label: '8. Traitement' },
  { key: 'suivi', label: '9. Suivi' },
];

export function stepIndex(statut) {
  const i = STATUT_STEPS.findIndex((s) => s.key === statut);
  return i >= 0 ? i : 0;
}

/** Masque prélèvement/labo si le médecin a sauté les examens. */
export function stepsForAdmission(admission) {
  const hasExamens = (admission?.examens_labo || admission?.examensLabo || []).length > 0;
  const skippedLab = [
    'diagnostic_prescription',
    'delivrance_medicaments',
    'initiation_traitement',
    'suivi',
  ].includes(admission?.statut) && !hasExamens && admission?.statut !== 'prelevement';

  return STATUT_STEPS.filter((s) => {
    if (skippedLab && ['prelevement', 'examens_laboratoire'].includes(s.key)) return false;
    return true;
  });
}
