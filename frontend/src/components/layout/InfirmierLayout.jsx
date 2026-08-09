import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../Icon';

const LINKS = [
  { label: 'Tableau de bord', to: '/infirmier/dashboard' },
  { label: 'Triage', to: '/infirmier/triage' },
  { label: 'Prélèvements', to: '/infirmier/prelevements' },
  { label: 'Constantes', to: '/infirmier/constantes' },
  { label: 'Patients', to: '/infirmier/patients' },
  { label: 'Parcours patient', to: '/parcours' },
];

/** Layout dédié espace infirmier — navy / coral, distinct médecin & accueil. */
export default function InfirmierLayout({ children, title = 'Infirmerie' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="infirmier-shell flex h-screen overflow-hidden bg-[#101B2D]">
      {open && (
        <button type="button" aria-label="Fermer" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#152238] to-[#101B2D] text-[#E8EEF6] transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <p className="font-infirmier-display text-2xl text-[#F2C4B0]">AMEN</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FA3BE]">Soins infirmiers</p>
        </div>

        <div className="mx-4 mt-4 rounded-xl border border-[#E07A5F]/35 bg-black/25 p-3">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="text-[11px] text-[#8FA3BE]">Infirmier(e)</p>
        </div>

        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-[#6B7F99]">Navigation</p>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#E07A5F] text-white shadow-lg shadow-black/25'
                    : 'text-[#A8B8CC] hover:bg-white/5 hover:text-white'
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
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-[#A8B8CC] transition hover:bg-red-950/40 hover:text-red-300"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#EEF2F7] text-[#152238]">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-[#C9D4E3] bg-[#F7F9FC]/92 px-5 py-3.5 backdrop-blur">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-[#E07A5F] hover:bg-[#F8E8E2] lg:hidden"
            aria-label="Menu"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7A8FA8]">Unité de soins</p>
            <h1 className="font-infirmier-display text-xl text-[#152238]">{title}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profil')}
            className="hidden rounded-full border border-[#C9D4E3] bg-white px-3 py-1.5 text-xs font-semibold text-[#E07A5F] sm:inline-flex"
          >
            Profil
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 text-[#152238] lg:p-7">{children}</main>
      </div>
    </div>
  );
}
