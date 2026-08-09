import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../Icon';

const LINKS = [
  { label: 'Tableau de bord', to: '/medecin/dashboard' },
  { label: 'Consultations', to: '/medecin/dossiers' },
  { label: 'Patients', to: '/medecin/patients' },
  { label: 'Planning RDV', to: '/medecin/planning' },
  { label: 'Téléconsultation', to: '/medecin/teleconsultation' },
];

const ROLE_LABELS = {
  medecin_generaliste: 'Médecin généraliste',
  medecin_interne: 'Médecine interne',
  pediatre: 'Pédiatre',
  gynecologue: 'Gynécologue',
  ophtalmologue: 'Ophtalmologue',
  urgentiste: 'Urgentiste',
};

/** Layout dédié espace médecin — design teal / Fraunces, distinct des autres rôles. */
export default function MedecinLayout({ children, title = 'Espace médecin' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="medecin-shell flex h-screen overflow-hidden bg-[#0B2E2C]">
      {open && (
        <button type="button" aria-label="Fermer" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#0D3B3A] to-[#0B2E2C] text-[#E8F5F2] transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <p className="font-medecin-display text-2xl text-[#B8E0D2]">AMEN</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6B9A8C]">Espace clinique</p>
        </div>

        <div className="mx-4 mt-4 rounded-xl border border-[#1A7A6D]/35 bg-black/20 p-3">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="text-[11px] text-[#6B9A8C]">{ROLE_LABELS[user?.role] || 'Médecin'}</p>
        </div>

        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-[#4A7A6C]">Navigation</p>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#1A7A6D] text-white shadow-lg shadow-black/25'
                    : 'text-[#9BBDB0] hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-[#9BBDB0] transition hover:bg-red-950/40 hover:text-red-300"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#E8F2EF] text-[#0D3B3A]">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-[#C5D9D0] bg-[#F4FAF8]/92 px-5 py-3.5 backdrop-blur">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-[#1A7A6D] hover:bg-[#DCEEE6] lg:hidden"
            aria-label="Menu"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5A8A7A]">Cabinet médical</p>
            <h1 className="font-medecin-display text-xl text-[#0D3B3A]">{title}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profil')}
            className="hidden rounded-full border border-[#B8D4C8] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A7A6D] sm:inline-flex"
          >
            Profil
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 text-[#0D3B3A] lg:p-7">{children}</main>
      </div>
    </div>
  );
}
