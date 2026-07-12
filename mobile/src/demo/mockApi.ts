import type { InternalAxiosRequestConfig } from 'axios';

import { HOSPITAL } from '@/src/constants/hospital';
import { getItem } from '@/src/services/storage';

const USER_KEY = 'amen_user';

const ok = <T>(data: T, message = 'OK') => ({ success: true, message, data });

const DEMO_RDV = [
  {
    id: 1,
    date_rdv: '2026-07-15',
    heure_rdv: '10:00',
    statut: 'confirme',
    type: 'presentiel',
    motif: 'Consultation de suivi',
    medecin: { user: { name: 'Dr. Jean-Pierre Kabila' } },
    departement: 'Médecine Interne',
  },
  {
    id: 2,
    date_rdv: '2026-07-18',
    heure_rdv: '14:30',
    statut: 'en_attente',
    type: 'teleconsultation',
    motif: 'Visite prénatale',
    medecin: { user: { name: 'Dr. Esperance Mbuyi' } },
    departement: 'Gynécologie',
  },
];

const DEMO_FACTURES = [
  {
    id: 1,
    numero_facture: 'FAC-2026-001',
    statut: 'emise',
    montant_total: 85000,
    montant_paye: 0,
    date_emission: '2026-07-01',
  },
  {
    id: 2,
    numero_facture: 'FAC-2026-002',
    statut: 'payee',
    montant_total: 45000,
    montant_paye: 45000,
    date_emission: '2026-06-20',
  },
];

function path(url = '') {
  return url.replace(/^.*\/api\/v1/, '').split('?')[0];
}

export async function resolveMock(config: InternalAxiosRequestConfig) {
  const p = path(config.url);
  const method = (config.method || 'get').toLowerCase();

  if (method === 'get' && p === '/me') {
    const cached = await getItem(USER_KEY);
    return ok(cached ? JSON.parse(cached) : null);
  }

  if (method === 'post' && (p === '/logout' || p === '/forgot-password' || p === '/register')) {
    return ok(null, 'Mode démo');
  }

  if (method === 'put' && p === '/profile') {
    return ok(JSON.parse((config.data as string) || '{}'), 'Profil mis à jour (démo)');
  }

  if (method === 'get' && p === '/patient/rendez-vous') return ok(DEMO_RDV);
  if (method === 'get' && p === '/patient/factures') return ok(DEMO_FACTURES);
  if (method === 'get' && p === '/patient/prescriptions') {
    return ok([
      {
        id: 1,
        date_prescription: '2026-06-15',
        statut: 'active',
        medicaments: [{ nom: 'Amoxicilline', dosage: '500mg' }],
        medecin: 'Dr. Kabila',
      },
    ]);
  }
  if (method === 'get' && p === '/patient/dossier') {
    return ok({
      consultations: [
        {
          id: 1,
          date_consultation: '2026-06-15',
          departement: 'Médecine Interne',
          motif: 'Fièvre',
          diagnostic: 'Grippe saisonnière',
          medecin: 'Dr. Kabila',
        },
      ],
    });
  }

  if (method === 'get' && p === '/medecin/dashboard') {
    return ok({
      rdv_aujourdhui: DEMO_RDV,
      stats: {
        rdv_jour: HOSPITAL.avgPatientsPerDay,
        patients_suivis: 42,
        prescriptions_actives: 8,
      },
    });
  }

  if (method === 'get' && p === '/admin/dashboard/stats') {
    return ok({
      patients: 128,
      medecins: 12,
      rdv_aujourdhui: HOSPITAL.avgPatientsPerDay,
      factures_impayees: 3,
      chiffre_affaires_mois: 4200000,
    });
  }

  if (method === 'get' && p.includes('/dashboard')) {
    return ok({
      total: HOSPITAL.avgPatientsPerDay,
      en_attente: 3,
      termines: 9,
      patients_jour: HOSPITAL.avgPatientsPerDay,
    });
  }

  if (
    method === 'get' &&
    (p.includes('/patients') ||
      p.includes('/operations') ||
      p.includes('/examens') ||
      p.includes('/seances') ||
      p.includes('/soins') ||
      p.includes('/suivis') ||
      p.includes('/demandes') ||
      p.includes('/rendez-vous') ||
      p.includes('/analyses') ||
      p.includes('/stock') ||
      p.includes('/ordonnances') ||
      p.includes('/factures') ||
      p.includes('/paiements') ||
      p.includes('/constantes') ||
      p.includes('/departements') ||
      p.includes('/medecins') ||
      p.includes('/teleconsultation'))
  ) {
    return ok([]);
  }

  if (method === 'post' || method === 'put' || method === 'delete') {
    return ok(null, 'Action simulée (mode démo)');
  }

  return ok([]);
}
