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

const DEMO_DEPARTEMENTS = [
  { id: 1, nom: 'Médecine Générale', code: 'MG' },
  { id: 2, nom: 'Urgences', code: 'URG' },
  { id: 3, nom: 'Pédiatrie', code: 'PED' },
];

const STATUT_LABELS = {
  enregistre: '1. Accueil (réceptionniste)',
  triage: '2. Triage (infirmier)',
  consultation_medicale: '3. Consultation médicale',
  prelevement: '4. Prélèvement',
  examens_laboratoire: '5. Analyses de laboratoire',
  diagnostic_prescription: '6. Diagnostic & prescription',
  delivrance_medicaments: '7. Délivrance médicaments',
  initiation_traitement: '8. Initiation du traitement',
  suivi: '9. Suivi',
};

const CLOTURES = ['suivi'];

let demoAdmissionSeq = 2;
let demoPatientSeq = 4;
/** @type {any[]} */
let DEMO_ADMISSIONS = [
  {
    id: 1,
    numero_admission: 'ADM-DEMO-0001',
    statut: 'triage',
    statut_label: STATUT_LABELS.triage,
    motif_arrivee: 'Fièvre et céphalées',
    mode_arrivee: 'walk_in',
    observations: null,
    created_at: '2026-07-25T08:00:00.000000Z',
    patient: {
      id: 3,
      numero_patient: 'PAT-00003',
      date_naissance: '1990-05-12',
      sexe: 'F',
      commune: 'Matete',
      user: { id: 3, name: 'Marie Kalala', phone: '+243 900 000 003', email: 'marie@demo.cd' },
    },
    departement: { id: 1, nom: 'Médecine Générale', code: 'MG' },
    triage: null,
    consultations: [],
    examens_labo: [],
    prescriptions: [],
    facture_lignes: [
      { id: 1, libelle: "Frais d'accueil", montant: 5000, created_at: '2026-07-25T08:00:00.000000Z' },
    ],
    historique_statuts: [
      { id: 1, statut_avant: null, statut_apres: 'enregistre', created_at: '2026-07-25T08:00:00.000000Z', user: { id: 1, name: 'Accueil démo' } },
      { id: 2, statut_avant: 'enregistre', statut_apres: 'triage', created_at: '2026-07-25T08:01:00.000000Z', user: { id: 1, name: 'Accueil démo' } },
    ],
  },
];

function cloneAdmission(a) {
  return JSON.parse(JSON.stringify(a));
}

function findAdmission(id) {
  return DEMO_ADMISSIONS.find((a) => String(a.id) === String(id));
}

function bumpStatut(admission, statut) {
  const avant = admission.statut;
  admission.statut = statut;
  admission.statut_label = STATUT_LABELS[statut] || statut;
  admission.historique_statuts = admission.historique_statuts || [];
  admission.historique_statuts.push({
    id: admission.historique_statuts.length + 1,
    statut_avant: avant,
    statut_apres: statut,
    created_at: new Date().toISOString(),
    user: { id: 1, name: 'Utilisateur démo' },
  });
}

function parseBody(config) {
  try {
    return typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});
  } catch {
    return {};
  }
}

function path(url = '') {
  return url.replace(/^.*\/api\/v1/, '').split('?')[0];
}

export function resolveMock(config) {
  const p = path(config.url);
  const method = (config.method || 'get').toLowerCase();
  const body = parseBody(config);

  if (method === 'get' && p === '/me') {
    const cached = localStorage.getItem('amen_user');
    return ok(cached ? JSON.parse(cached) : null);
  }

  if (method === 'post' && (p === '/logout' || p === '/forgot-password')) {
    return ok(null, 'Mode démo');
  }

  if (method === 'post' && p === '/patient/premiere-connexion') {
    const cached = localStorage.getItem('amen_user');
    const user = cached ? JSON.parse(cached) : { role: 'patient', name: 'Patient' };
    const next = {
      ...user,
      phone: body.phone || user.phone,
      must_change_password: false,
      profil_complet: true,
      needs_onboarding: false,
      patient: {
        ...(user.patient || {}),
        date_naissance: body.date_naissance,
        sexe: body.sexe,
        adresse: body.adresse,
        commune: body.commune || 'Matete',
        contact_urgence_nom: body.contact_urgence_nom,
        contact_urgence_tel: body.contact_urgence_tel,
        allergies: body.allergies,
        antecedents_medicaux: body.antecedents_medicaux,
      },
    };
    localStorage.setItem('amen_user', JSON.stringify(next));
    return { ...ok(next, 'Profil complété (démo)'), redirect: '/patient/dashboard' };
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

  if (method === 'get' && p === '/departements') {
    return ok(DEMO_DEPARTEMENTS);
  }

  // --- Parcours patient / admissions ---
  if (method === 'get' && p === '/admissions') {
    const actifs = String(config.url || '').includes('actifs=1') || String(config.url || '').includes('actifs=true');
    const list = DEMO_ADMISSIONS
      .filter((a) => !actifs || !CLOTURES.includes(a.statut))
      .map((a) => cloneAdmission(a));
    return { ...ok(list, 'Liste des admissions'), meta: { total: list.length, statuts: STATUT_LABELS } };
  }


  const admissionMatch = p.match(/^\/admissions\/(\d+)(?:\/(.+))?$/);
  if (admissionMatch) {
    const id = admissionMatch[1];
    const action = admissionMatch[2] || '';
    const admission = findAdmission(id);
    if (!admission) {
      return { success: false, message: 'Admission introuvable (démo)', data: null };
    }

    if (method === 'get' && !action) {
      return ok(cloneAdmission(admission), 'Dossier parcours patient');
    }

    if (method === 'patch' && action === 'triage') {
      admission.triage = {
        id: 1,
        temperature: body.temperature || null,
        tension_arterielle: body.tension_arterielle || null,
        frequence_cardiaque: body.frequence_cardiaque || null,
        saturation_02: body.saturation_02 || null,
        niveau_urgence: body.niveau_urgence || 'moins_urgent',
        notes: body.notes || '',
        infirmier: { id: 2, name: 'Infirmier démo' },
      };
      bumpStatut(admission, 'consultation_medicale');
      return ok(cloneAdmission(admission), 'Triage enregistré — orienté vers le médecin');
    }

    if (method === 'patch' && action === 'consultation') {
      admission.consultations = admission.consultations || [];
      admission.consultations.push({
        id: admission.consultations.length + 1,
        anamnese: body.anamnese || '',
        examen_clinique: body.examen_clinique || '',
        diagnostic_provisoire: body.diagnostic_provisoire || '',
        type_diagnostic: 'provisoire',
        medecin: { user: { name: 'Dr. démo' } },
        created_at: new Date().toISOString(),
      });
      bumpStatut(admission, body.prescrire_examens ? 'prelevement' : 'diagnostic_prescription');
      return ok(cloneAdmission(admission), 'Consultation enregistrée');
    }

    if (method === 'patch' && action === 'prelevement') {
      bumpStatut(admission, 'examens_laboratoire');
      return ok(cloneAdmission(admission), 'Prélèvement transmis au labo');
    }

    if (method === 'post' && action === 'examens') {
      admission.examens_labo = admission.examens_labo || [];
      admission.examens_labo.push({
        id: admission.examens_labo.length + 1,
        type_examen: body.type_examen || 'Analyse',
        indication: body.indication || null,
        statut: body.statut || 'prescrit',
        resultats: body.resultats || null,
        interpretation: body.interpretation || null,
        created_at: new Date().toISOString(),
      });
      if (admission.statut === 'consultation_medicale') bumpStatut(admission, 'prelevement');
      return ok({ admission: cloneAdmission(admission) }, 'Examen enregistré');
    }

    if (method === 'patch' && action === 'diagnostic') {
      const last = (admission.consultations || [])[admission.consultations.length - 1];
      if (last) {
        last.diagnostic_final = body.diagnostic_final || '';
        last.code_cim10 = body.code_cim10 || null;
        last.decision = body.decision || '';
        last.type_diagnostic = 'final';
      }
      if (body.medicaments && body.medicaments.length) {
        admission.prescriptions = admission.prescriptions || [];
        admission.prescriptions.push({
          id: admission.prescriptions.length + 1,
          medicaments: body.medicaments,
          statut: 'active',
          date_prescription: new Date().toISOString().slice(0, 10),
          medecin: { user: { name: 'Dr. démo' } },
        });
      }
      if (['examens_laboratoire', 'consultation_medicale', 'prelevement'].includes(admission.statut)) {
        if (admission.statut === 'prelevement') bumpStatut(admission, 'examens_laboratoire');
        if (admission.statut !== 'diagnostic_prescription') bumpStatut(admission, 'diagnostic_prescription');
      }
      return ok(cloneAdmission(admission), 'Diagnostic & prescription');
    }

    if (method === 'post' && action === 'prescription') {
      admission.prescriptions = admission.prescriptions || [];
      const prescription = {
        id: admission.prescriptions.length + 1,
        medicaments: body.medicaments || [],
        statut: body.delivrer ? 'delivree' : 'active',
        date_prescription: new Date().toISOString().slice(0, 10),
        medecin: { user: { name: 'Dr. démo' } },
      };
      admission.prescriptions.push(prescription);
      if (body.delivrer && admission.statut === 'diagnostic_prescription') {
        bumpStatut(admission, 'delivrance_medicaments');
      }
      return ok({ admission: cloneAdmission(admission), prescription }, 'Pharmacie');
    }

    if (method === 'patch' && action === 'initiation') {
      bumpStatut(admission, 'initiation_traitement');
      admission.consignes_sortie = body.notes_initiation || null;
      admission.date_suivi_prevue = body.date_suivi_prevue || null;
      return ok(cloneAdmission(admission), 'Traitement initié');
    }

    if (method === 'patch' && action === 'suivi') {
      bumpStatut(admission, 'suivi');
      admission.sortie_at = new Date().toISOString();
      admission.date_suivi_prevue = body.date_suivi_prevue || admission.date_suivi_prevue;
      return ok(cloneAdmission(admission), 'Passage en suivi');
    }
  }

  if (method === 'post' && p === '/admissions') {
    const id = demoAdmissionSeq++;
    const patientId = body.patient_id || demoPatientSeq++;
    const admission = {
      id,
      numero_admission: `ADM-DEMO-${String(id).padStart(4, '0')}`,
      statut: 'triage',
      statut_label: STATUT_LABELS.triage,
      motif_arrivee: body.motif_arrivee || 'Consultation',
      mode_arrivee: body.mode_arrivee || 'walk_in',
        observations: body.observations || null,
      created_at: new Date().toISOString(),
      patient: {
        id: patientId,
        numero_patient: `PAT-${String(patientId).padStart(5, '0')}`,
        date_naissance: body.date_naissance || '1995-01-01',
        sexe: body.sexe || 'M',
        commune: body.commune || 'Matete',
        user: {
          id: patientId,
          name: body.name || 'Patient démo',
          phone: body.phone || '+243 900 000 000',
          email: body.email || null,
        },
      },
      departement: DEMO_DEPARTEMENTS.find((d) => String(d.id) === String(body.departement_id)) || DEMO_DEPARTEMENTS[0],
      triage: null,
      consultations: [],
      examens_labo: [],
      prescriptions: [],
      facture_lignes: [
        { id: 1, libelle: "Frais d'accueil", montant: 5000, created_at: new Date().toISOString() },
      ],
      historique_statuts: [
        { id: 1, statut: 'enregistre', created_at: new Date().toISOString(), user: { id: 1, name: 'Accueil démo' } },
        { id: 2, statut: 'triage', created_at: new Date().toISOString(), user: { id: 1, name: 'Accueil démo' } },
      ],
    };
    DEMO_ADMISSIONS = [admission, ...DEMO_ADMISSIONS];
    const numero = admission.patient.numero_patient;
    const nom = body.name || 'Patient démo';
    const login = String(nom)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '') || 'patient';
    const email = body.email || `${login}@patient.amen.cd`;
    admission.patient.user.email = email;
    const response = ok(cloneAdmission(admission), 'Patient et dossier créés — remettez les identifiants au patient');
    if (!body.patient_id) {
      response.acces_patient = {
        numero_patient: numero,
        login,
        nom_complet: nom,
        password: 'Amen2026',
        message: '1re connexion : nom (ou login) + Amen2026. Le patient complète son profil et change le mot de passe.',
      };
    }
    return response;
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
      medecins: 12,
      rdv_aujourdhui: 14,
      factures_impayees: 3,
      chiffre_affaires_mois: 4200000,
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

  if (method === 'get' && (p.includes('/file-triage') || p.includes('/file-consultation') || p.includes('/file-examens') || p.includes('/episodes'))) {
    return ok([]);
  }

  if (method === 'get' && p === '/laboratoire/patients') {
    return ok([
      {
        id: 3,
        numero_patient: 'PAT-00003',
        user: { name: 'Marie Kalala', phone: '+243 900 000 003' },
        episode_id: 1,
        numero_episode: 'EPS-DEMO-0001',
        etape: 'examens',
        etape_label: '4. Laboratoire / Imagerie',
        niveau_urgence: 'moins_urgent',
        motif_arrivee: 'Fièvre',
        dossier_id: 1,
        numero_dossier: 'DOS-DEMO-0001',
        priorite_examens: true,
      },
    ]);
  }

  if (method === 'post' && p.includes('/arrivee')) {
    return ok({
      id: 1,
      numero_episode: 'EPS-DEMO-0001',
      etape: 'triage',
      etape_label: '2. Triage infirmier',
      motif_arrivee: 'Consultation',
      dossier: { id: 1, numero_dossier: 'DOS-DEMO-0001', statut: 'ouvert' },
      patient: { user: { name: 'Patient démo' } },
    }, 'Patient créé. Dossier DOS-DEMO-0001 ouvert — orienté vers le triage.');
  }

  if (method === 'get' && (p.includes('/patients') || p.includes('/operations') || p.includes('/examens') || p.includes('/seances') || p.includes('/soins') || p.includes('/suivis') || p.includes('/demandes') || p.includes('/rendez-vous') || p.includes('/analyses') || p.includes('/stock') || p.includes('/ordonnances') || p.includes('/factures') || p.includes('/paiements') || p.includes('/constantes'))) {
    return ok([]);
  }

  if (method === 'post' || method === 'put' || method === 'patch' || method === 'delete') {
    return ok(null, 'Action simulée (mode démo)');
  }

  return ok([]);
}
