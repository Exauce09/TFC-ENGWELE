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
        numero_ordonnance: 'ORD-20260615-0001',
        date_prescription: '2026-06-15',
        statut: 'active',
        statut_label: 'Émise',
        medicaments: [{ nom: 'Amoxicilline', dosage: '500mg', frequence: '2×/j', duree: '7 j' }],
        medecin: { user: { name: 'Dr. Kabila' } },
      },
      {
        id: 2,
        numero_ordonnance: 'ORD-P-DEMO-0002',
        date_prescription: '2026-07-01',
        statut: 'delivree',
        statut_label: 'Délivrée',
        medicaments: [{ nom: 'Paracétamol', dosage: '500mg', frequence: '3×/j', duree: '5 j' }],
        medecin: { user: { name: 'Dr. Mbuyi' } },
      },
    ]);
  }
  if (method === 'get' && p === '/patient/dossier') {
    return ok({
      consultations: [
        {
          id: 1,
          date_consultation: '2026-06-15',
          departement: { nom: 'Médecine Interne' },
          motif: 'Fièvre',
          diagnostic_final: 'Grippe saisonnière',
          medecin: { user: { name: 'Dr. Kabila' } },
          statut_parcours_label: 'Suivi',
        },
        {
          id: 'adm-2',
          date_consultation: '2026-07-10',
          departement: { nom: 'Médecine Générale' },
          motif: 'Contrôle tension',
          medecin: { user: { name: 'Dr. Kabila' } },
          statut_parcours_label: 'Consultation médicale',
        },
      ],
    });
  }
  if (method === 'get' && p === '/teleconsultation') {
    const today = new Date().toISOString().slice(0, 10);
    return ok([
      {
        id: 88,
        date_rdv: today,
        heure_rdv: '15:00:00',
        statut: 'confirme',
        paiement_statut: 'paye',
        room_name: 'amen-rdv-88-demo12ab',
        salle_url: 'https://meet.jit.si/amen-rdv-88-demo12ab',
        medecin: { user: { name: 'Dr. Jean-Pierre Kabila' } },
        departement: { nom: 'Médecine Générale' },
      },
    ]);
  }
  if (method === 'post' && /\/teleconsultation\/\d+\/rejoindre/.test(p)) {
    return ok({
      room_url: 'https://meet.jit.si/amen-rdv-88-demo12ab#config.prejoinPageEnabled=false',
      room_name: 'amen-rdv-88-demo12ab',
      rendez_vous: { id: 88, patient: { user: { name: 'Marie Kalala' } } },
    });
  }
  if (method === 'get' && p === '/notifications') {
    return ok([
      {
        id: 1,
        titre: 'Rappel RDV',
        message: 'Votre rendez-vous est demain à 10h00',
        lu: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        titre: 'Facture émise',
        message: 'Une nouvelle facture est disponible',
        lu: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
  }
  if (method === 'put' && (/\/notifications\/\d+\/lu/.test(p) || p === '/notifications/tout-lire')) {
    return ok(null, 'OK');
  }
  if (method === 'get' && p === '/departements') {
    return ok([
      { id: 1, nom: 'Médecine Générale' },
      { id: 2, nom: 'Pédiatrie' },
      { id: 3, nom: 'Gynécologie' },
    ]);
  }
  if (method === 'get' && p === '/medecins') {
    return ok([
      { id: 1, name: 'Dr. Jean-Pierre Kabila', specialite: 'Médecine interne' },
      { id: 2, name: 'Dr. Esperance Mbuyi', specialite: 'Gynécologie' },
    ]);
  }
  if (method === 'get' && p === '/patient/creneaux') {
    return ok([
      { heure: '09:00', disponible: true },
      { heure: '10:00', disponible: true },
      { heure: '11:00', disponible: false },
      { heure: '14:00', disponible: true },
      { heure: '15:00', disponible: true },
    ]);
  }

  if (method === 'get' && p === '/medecin/dashboard') {
    return ok({
      rdv_aujourdhui: DEMO_RDV.map((r) => ({
        ...r,
        patient: { user: { name: 'Marie Kalala' } },
      })),
      stats: {
        rdv_jour: HOSPITAL.avgPatientsPerDay,
        patients_suivis: 42,
        prescriptions_actives: 8,
        en_cours: 1,
      },
    });
  }

  if (method === 'get' && p === '/infirmier/dashboard') {
    return ok({
      file_triage_count: 2,
      file_prelevement_count: 1,
      constantes_du_jour: 5,
      mes_constantes_du_jour: 3,
      file_triage: [
        {
          id: 11,
          motif_arrivee: 'Fièvre',
          statut: 'enregistre',
          niveau_urgence: null,
          patient: { user: { name: 'Patient Triage A' } },
        },
        {
          id: 12,
          motif_arrivee: 'Douleur abdominale',
          statut: 'enregistre',
          patient: { user: { name: 'Patient Triage B' } },
        },
      ],
    });
  }

  if (method === 'get' && p === '/accueil/dashboard') {
    return ok({
      demandes_en_attente: 2,
      rdv_du_jour: 8,
      patients: 40,
      arrivees: 3,
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

  if (method === 'get' && /\/patient\/factures\/\d+$/.test(p)) {
    const f = DEMO_FACTURES[0];
    return ok({
      ...f,
      reste_a_payer: f.montant_total - (f.montant_paye || 0),
      lignes: [
        { description: 'Consultation générale', quantite: 1, montant: 45000 },
        { description: 'Frais administratifs', quantite: 1, montant: 40000 },
      ],
    });
  }

  if (method === 'post' && /\/patient\/factures\/\d+\/paiement/.test(p)) {
    return ok({ statut: 'payee' }, 'Paiement Mobile Money simulé (démo)');
  }

  if (method === 'post' && p === '/patient/premiere-connexion') {
    return ok({ needs_onboarding: false }, 'Profil complété (démo)');
  }

  if (method === 'get' && p === '/medecin/planning') {
    return ok(
      DEMO_RDV.map((r) => ({
        ...r,
        patient: { user: { name: 'Marie Kalala' } },
        departement: { nom: r.departement },
      }))
    );
  }

  if (method === 'get' && (p === '/medecin/patients' || p === '/infirmier/patients' || p === '/accueil/patients')) {
    return ok([
      { id: 3, numero_patient: 'PAT-001', user: { name: 'Marie Kalala', phone: '+243 900 000 003' } },
      { id: 4, numero_patient: 'PAT-002', user: { name: 'Joseph Mukendi', phone: '+243 900 000 004' } },
    ]);
  }

  if (method === 'get' && p === '/medecin/dossiers') {
    return ok([
      {
        id: 21,
        motif_arrivee: 'Consultation de suivi',
        statut: 'consultation_medicale',
        patient: { user: { name: 'Marie Kalala' } },
      },
    ]);
  }

  if (method === 'get' && p === '/infirmier/file-triage') {
    return ok([
      {
        id: 11,
        motif_arrivee: 'Fièvre',
        patient: { user: { name: 'Patient Triage A' } },
      },
    ]);
  }

  if (method === 'get' && p === '/accueil/demandes') {
    return ok([
      {
        id: 1,
        source: 'rendez_vous',
        nom: 'Marie Kalala',
        date_souhaitee: '2026-08-12',
        heure_rdv: '10:00',
        message: 'Contrôle',
        medecin_id: 1,
        patient: { user: { name: 'Marie Kalala' } },
      },
    ]);
  }

  if (method === 'get' && p === '/accueil/rendez-vous') {
    return ok(
      DEMO_RDV.map((r) => ({
        ...r,
        patient: { user: { name: 'Marie Kalala' } },
        medecin: r.medecin,
      }))
    );
  }

  if (method === 'get' && p.includes('/dashboard')) {
    return ok({
      total: HOSPITAL.avgPatientsPerDay,
      en_attente: 3,
      termines: 9,
      patients_jour: HOSPITAL.avgPatientsPerDay,
      ordonnances_en_attente: 4,
      stock_bas: 2,
      factures_ouvertes: 5,
      encaisse_jour: 350000,
      total_suivis: 12,
      prenatales: 6,
      planifiees: 3,
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
      p.includes('/file-examens') ||
      p.includes('/departements') ||
      p.includes('/medecins') ||
      p.includes('/teleconsultation') ||
      p.includes('/planning') ||
      p.includes('/dossiers'))
  ) {
    return ok([]);
  }

  if (method === 'post' || method === 'put' || method === 'patch' || method === 'delete') {
    return ok(null, 'Action simulée (mode démo)');
  }

  return ok([]);
}
