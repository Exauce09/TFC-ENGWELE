/** Menus de navigation par rôle (partagés Sidebar legacy + RoleShell). */

export const MENUS = {
  patient: [
    { label: 'Tableau de bord', icon: 'home', to: '/patient/dashboard' },
    { label: 'Mes Rendez-vous', icon: 'calendar', to: '/patient/rendez-vous' },
    { label: 'Mon Dossier Médical', icon: 'clipboard', to: '/patient/dossier' },
    { label: 'Mes Factures', icon: 'receipt', to: '/patient/factures' },
    { label: 'Téléconsultation', icon: 'video', to: '/patient/teleconsultation' },
  ],
  medecin: [
    { label: 'Tableau de bord', icon: 'home', to: '/medecin/dashboard' },
    { label: 'Consultations', icon: 'stethoscope', to: '/medecin/dossiers' },
    { label: 'Patients', icon: 'users', to: '/medecin/patients' },
    { label: 'Planning RDV', icon: 'calendar', to: '/medecin/planning' },
    { label: 'Téléconsultation', icon: 'video', to: '/medecin/teleconsultation' },
  ],
  admin: [
    { label: 'Tableau de bord', icon: 'home', to: '/admin/dashboard' },
    { label: 'Parcours patient', icon: 'route', to: '/parcours' },
    { label: 'Patients', icon: 'users', to: '/admin/patients' },
    { label: 'Médecins', icon: 'doctor', to: '/admin/medecins' },
    { label: 'Rendez-vous', icon: 'calendar', to: '/admin/rendez-vous' },
    { label: 'Départements', icon: 'hospital', to: '/admin/departements' },
    { label: 'Facturation', icon: 'receipt', to: '/admin/facturation' },
    { label: 'Statistiques', icon: 'chart', to: '/admin/statistiques' },
    { label: 'Utilisateurs', icon: 'lock', to: '/admin/utilisateurs' },
  ],
  laborantin: [
    { label: 'Tableau de bord', icon: 'home', to: '/laboratoire/dashboard' },
    { label: 'Patients', icon: 'users', to: '/laboratoire/patients' },
    { label: 'Parcours patient', icon: 'route', to: '/parcours' },
    { label: 'Analyses', icon: 'microscope', to: '/laboratoire/analyses' },
  ],
  pharmacien: [
    { label: 'Tableau de bord', icon: 'home', to: '/pharmacie/dashboard' },
    { label: 'Patients', icon: 'users', to: '/pharmacie/patients' },
    { label: 'Parcours patient', icon: 'route', to: '/parcours' },
    { label: 'Stock', icon: 'pill', to: '/pharmacie/stock' },
    { label: 'Ordonnances', icon: 'clipboard', to: '/pharmacie/ordonnances' },
  ],
  caissier: [
    { label: 'Tableau de bord', icon: 'home', to: '/caisse/dashboard' },
    { label: 'Parcours patient', icon: 'route', to: '/parcours' },
    { label: 'Factures', icon: 'receipt', to: '/caisse/factures' },
    { label: 'Paiements', icon: 'banknote', to: '/caisse/paiements' },
  ],
  infirmier: [
    { label: 'Tableau de bord', icon: 'home', to: '/infirmier/dashboard' },
    { label: 'Triage', icon: 'bandage', to: '/infirmier/triage' },
    { label: 'Prélèvements', icon: 'flask', to: '/infirmier/prelevements' },
    { label: 'Constantes', icon: 'activity', to: '/infirmier/constantes' },
    { label: 'Patients', icon: 'users', to: '/infirmier/patients' },
    { label: 'Parcours patient', icon: 'route', to: '/parcours' },
  ],
  accueil: [
    { label: 'Tableau de bord', icon: 'home', to: '/accueil/dashboard' },
    { label: 'Réception', icon: 'door', to: '/accueil/reception' },
    { label: 'Demandes RDV', icon: 'inbox', to: '/accueil/demandes' },
    { label: 'RDV du jour', icon: 'calendar', to: '/accueil/rendez-vous' },
    { label: 'Patients', icon: 'users', to: '/accueil/patients' },
  ],
  maternite: [
    { label: 'Tableau de bord', icon: 'home', to: '/maternite/dashboard' },
    { label: 'Planning RDV', icon: 'calendar', to: '/maternite/planning' },
    { label: 'Suivis', icon: 'baby', to: '/maternite/suivis' },
  ],
  chirurgie: [
    { label: 'Tableau de bord', icon: 'home', to: '/chirurgie/dashboard' },
    { label: 'Planning RDV', icon: 'calendar', to: '/chirurgie/planning' },
    { label: 'Opérations', icon: 'scissors', to: '/chirurgie/operations' },
  ],
  echographie: [
    { label: 'Tableau de bord', icon: 'home', to: '/echographie/dashboard' },
    { label: 'Planning RDV', icon: 'calendar', to: '/echographie/planning' },
    { label: 'Examens', icon: 'radio', to: '/echographie/examens' },
  ],
  kinesitherapie: [
    { label: 'Tableau de bord', icon: 'home', to: '/kinesitherapie/dashboard' },
    { label: 'Planning RDV', icon: 'calendar', to: '/kinesitherapie/planning' },
    { label: 'Séances', icon: 'dumbbell', to: '/kinesitherapie/seances' },
  ],
  dentisterie: [
    { label: 'Tableau de bord', icon: 'home', to: '/dentisterie/dashboard' },
    { label: 'Patients', icon: 'users', to: '/dentisterie/patients' },
    { label: 'Planning RDV', icon: 'calendar', to: '/dentisterie/planning' },
    { label: 'Soins', icon: 'tooth', to: '/dentisterie/soins' },
  ],
};

export const ROLE_MENU_KEY = {
  medecin_generaliste: 'medecin',
  medecin_interne: 'medecin',
  pediatre: 'medecin',
  gynecologue: 'medecin',
  ophtalmologue: 'medecin',
  urgentiste: 'medecin',
  chirurgien: 'chirurgie',
  anesthesiste: 'chirurgie',
  sage_femme: 'maternite',
  receptionniste: 'accueil',
  echographiste: 'echographie',
  kinesitherapeute: 'kinesitherapie',
  dentiste: 'dentisterie',
};

export const ROLE_LABELS = {
  patient: 'Patient',
  medecin_generaliste: 'Médecin Généraliste',
  medecin_interne: 'Médecin Interne',
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
  radiologue: 'Radiologue',
  directeur_medical: 'Directeur médical',
  gestionnaire_assurance: 'Gestionnaire assurance',
  responsable_chambres: 'Responsable chambres',
};

export function getMenuForRole(role) {
  const key = ROLE_MENU_KEY[role] ?? role;
  return MENUS[key] ?? [];
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}
