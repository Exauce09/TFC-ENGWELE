import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MENUS = {
  patient: [
    { label: 'Tableau de bord', icon: '🏠', to: '/patient/dashboard' },
    { label: 'Mes Rendez-vous', icon: '📅', to: '/patient/rendez-vous' },
    { label: 'Mon Dossier Médical', icon: '📋', to: '/patient/dossier' },
    { label: 'Mes Prescriptions', icon: '💊', to: '/patient/prescriptions' },
    { label: 'Mes Factures', icon: '🧾', to: '/patient/factures' },
    { label: 'Téléconsultation', icon: '📹', to: '/patient/teleconsultation' },
  ],
  medecin_generaliste: 'medecin',
  medecin_interne: 'medecin',
  pediatre: 'medecin',
  gynecologue: 'medecin',
  ophtalmologue: 'medecin',
  urgentiste: 'medecin',
  medecin: [
    { label: 'Tableau de bord', icon: '🏠', to: '/medecin/dashboard' },
    { label: 'Mon Planning', icon: '📅', to: '/medecin/planning' },
    { label: 'Mes Patients', icon: '👥', to: '/medecin/patients' },
    { label: 'Dossiers Médicaux', icon: '📋', to: '/medecin/dossiers' },
    { label: 'Prescriptions', icon: '💊', to: '/medecin/prescriptions' },
    { label: 'Téléconsultation', icon: '📹', to: '/medecin/teleconsultation' },
  ],
  admin: [
    { label: 'Tableau de bord', icon: '🏠', to: '/admin/dashboard' },
    { label: 'Patients', icon: '👥', to: '/admin/patients' },
    { label: 'Médecins', icon: '👨‍⚕️', to: '/admin/medecins' },
    { label: 'Rendez-vous', icon: '📅', to: '/admin/rendez-vous' },
    { label: 'Départements', icon: '🏥', to: '/admin/departements' },
    { label: 'Facturation', icon: '🧾', to: '/admin/facturation' },
    { label: 'Statistiques', icon: '📊', to: '/admin/statistiques' },
    { label: 'Utilisateurs', icon: '🔐', to: '/admin/utilisateurs' },
  ],
  laborantin: [
    { label: 'Tableau de bord', icon: '🏠', to: '/laboratoire/dashboard' },
    { label: 'Analyses', icon: '🔬', to: '/laboratoire/analyses' },
  ],
  pharmacien: [
    { label: 'Tableau de bord', icon: '🏠', to: '/pharmacie/dashboard' },
    { label: 'Stock', icon: '💊', to: '/pharmacie/stock' },
    { label: 'Ordonnances', icon: '📋', to: '/pharmacie/ordonnances' },
  ],
  caissier: [
    { label: 'Tableau de bord', icon: '🏠', to: '/caisse/dashboard' },
    { label: 'Factures', icon: '🧾', to: '/caisse/factures' },
    { label: 'Paiements', icon: '💵', to: '/caisse/paiements' },
  ],
  infirmier: [
    { label: 'Tableau de bord', icon: '🏠', to: '/infirmier/dashboard' },
    { label: 'Patients', icon: '👥', to: '/infirmier/patients' },
    { label: 'Constantes', icon: '📈', to: '/infirmier/constantes' },
  ],
  accueil: [
    { label: 'Tableau de bord', icon: '🏠', to: '/accueil/dashboard' },
    { label: 'Demandes RDV', icon: '📩', to: '/accueil/demandes' },
    { label: 'RDV du jour', icon: '📅', to: '/accueil/rendez-vous' },
    { label: 'Patients', icon: '👥', to: '/accueil/patients' },
  ],
  maternite: [
    { label: 'Tableau de bord', icon: '🏠', to: '/maternite/dashboard' },
    { label: 'Suivis', icon: '🤰', to: '/maternite/suivis' },
  ],
  chirurgie: [
    { label: 'Tableau de bord', icon: '🏠', to: '/chirurgie/dashboard' },
    { label: 'Opérations', icon: '🔪', to: '/chirurgie/operations' },
  ],
  echographie: [
    { label: 'Tableau de bord', icon: '🏠', to: '/echographie/dashboard' },
    { label: 'Examens', icon: '📡', to: '/echographie/examens' },
  ],
  kinesitherapie: [
    { label: 'Tableau de bord', icon: '🏠', to: '/kinesitherapie/dashboard' },
    { label: 'Séances', icon: '💪', to: '/kinesitherapie/seances' },
  ],
  dentisterie: [
    { label: 'Tableau de bord', icon: '🏠', to: '/dentisterie/dashboard' },
    { label: 'Soins', icon: '🦷', to: '/dentisterie/soins' },
  ],
};

const ROLE_MENU_KEY = {
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

const ROLE_LABELS = {
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
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleKey = ROLE_MENU_KEY[user?.role] ?? user?.role;
  const links = MENUS[roleKey] ?? [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-slate-900 text-white flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-primary font-bold text-lg shadow">A</div>
          <div>
            <p className="text-sm font-bold leading-tight">Centre Médical</p>
            <p className="text-xs text-emerald-400 font-semibold">AMEN</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white lg:hidden">✕</button>
        </div>

        {/* User info */}
        <div className="mx-4 my-4 rounded-xl bg-white/5 p-3 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-medical-primary text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-slate-400">{ROLE_LABELS[user?.role] ?? user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Navigation</p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium mb-1 transition-all
                ${isActive
                  ? 'bg-medical-primary text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
              }
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-red-900/40 hover:text-red-300 transition"
          >
            <span>🚪</span> Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}
