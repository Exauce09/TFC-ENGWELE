const ok = (data, message = 'OK') => ({ success: true, message, data });

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

const DEMO_NOTIFICATIONS = [
  { id: 1, titre: 'Rappel RDV', message: 'Votre rendez-vous est demain à 10h00', lu: false, created_at: '2026-07-12' },
  { id: 2, titre: 'Facture émise', message: 'Une nouvelle facture est disponible', lu: true, created_at: '2026-07-10' },
];

function path(url = '') {
  return url.replace(/^.*\/api\/v1/, '').split('?')[0];
}

export function resolveMock(config) {
  const p = path(config.url);
  const method = (config.method || 'get').toLowerCase();

  if (method === 'get' && p === '/me') {
    const cached = localStorage.getItem('amen_user');
    return ok(cached ? JSON.parse(cached) : null);
  }

  if (method === 'post' && (p === '/logout' || p === '/forgot-password')) {
    return ok(null, 'Mode démo');
  }

  if (method === 'put' && p === '/profile') {
    return ok(JSON.parse(config.data || '{}'), 'Profil mis à jour (démo)');
  }

  if (method === 'get' && p === '/notifications') {
    return { ...ok(DEMO_NOTIFICATIONS), meta: { total: DEMO_NOTIFICATIONS.length } };
  }

  if (method === 'put' && p.startsWith('/notifications')) {
    return ok(null);
  }

  if (method === 'get' && p === '/patient/dashboard') {
    return ok({ upcoming_rdv: 2 });
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
      stats: { rdv_jour: 5, patients_suivis: 42, prescriptions_actives: 8 },
    });
  }
  if (method === 'get' && p === '/medecin/patients') {
    return ok([{ id: 1, user: { name: 'Marie Kalala' }, numero_patient: 'PAT-00003' }]);
  }
  if (method === 'get' && p === '/medecin/planning') return ok(DEMO_RDV);

  if (method === 'get' && p === '/admin/dashboard/stats') {
    return ok({
      patients: 128,
      medecins: 24,
      rdv_aujourdhui: 18,
      factures_impayees: 7,
      chiffre_affaires_mois: 12500000,
    });
  }
  if (method === 'get' && p === '/admin/facturation') {
    return ok({ total: 12500000, impayees: 7 });
  }
  if (method === 'get' && p.startsWith('/admin/')) {
    return ok([]);
  }

  if (method === 'get' && p.includes('/dashboard')) {
    return ok({ total: 12, en_attente: 3, termines: 9 });
  }

  if (method === 'get' && (p.includes('/patients') || p.includes('/operations') || p.includes('/examens') || p.includes('/seances') || p.includes('/soins') || p.includes('/suivis') || p.includes('/demandes') || p.includes('/rendez-vous') || p.includes('/analyses') || p.includes('/stock') || p.includes('/ordonnances') || p.includes('/factures') || p.includes('/paiements') || p.includes('/constantes'))) {
    return ok([]);
  }

  if (method === 'post' || method === 'put' || method === 'delete') {
    return ok(null, 'Action simulée (mode démo)');
  }

  return ok([]);
}
