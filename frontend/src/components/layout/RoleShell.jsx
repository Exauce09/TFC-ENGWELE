import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleTheme } from '../../constants/roleThemes';
import Icon from '../Icon';
import { getMenuForRole, getRoleLabel } from './roleMenus';

/**
 * Coque visuelle thématisée par rôle (patient, admin, accueil, labo, pharma, caisse, spécialités).
 */
export default function RoleShell({ children, title = 'Centre Médical AMEN', theme: themeProp }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const theme = themeProp || getRoleTheme(user?.role) || getRoleTheme('admin');
  const links = getMenuForRole(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div
      className={`${theme.shellClass} flex h-screen overflow-hidden`}
      style={{ background: theme.sidebarTo }}
    >
      {open && (
        <button
          type="button"
          aria-label="Fermer"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 text-white transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: `linear-gradient(180deg, ${theme.sidebarFrom}, ${theme.sidebarTo})`,
        }}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <p className={`${theme.displayFont} text-2xl`} style={{ color: theme.brandText }}>
            {theme.brand}
          </p>
          <p
            className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: theme.muted }}
          >
            {theme.spaceLabel}
          </p>
        </div>

        <div
          className="mx-4 mt-4 rounded-xl border bg-black/20 p-3"
          style={{ borderColor: `${theme.accent}59` }}
        >
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="text-[11px]" style={{ color: theme.muted }}>
            {getRoleLabel(user?.role) || theme.roleLabel}
          </p>
        </div>

        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <p
            className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: theme.muted }}
          >
            Navigation
          </p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to.split('/').length <= 3}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'text-white shadow-lg shadow-black/25'
                    : 'hover:bg-white/5 hover:text-white'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? theme.accent : 'transparent',
                color: isActive ? '#fff' : theme.navIdle,
              })}
            >
              {link.icon ? <Icon name={link.icon} className="h-4 w-4 shrink-0 opacity-90" /> : null}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-red-950/40 hover:text-red-300"
            style={{ color: theme.navIdle }}
          >
            <span className="inline-flex items-center gap-2">
              <Icon name="logout" className="h-4 w-4" />
              Se déconnecter
            </span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-slate-900" style={{ background: theme.contentBg }}>
        <header
          className="sticky top-0 z-20 flex items-center gap-4 border-b px-5 py-3.5 backdrop-blur"
          style={{ background: theme.headerBg, borderColor: theme.headerBorder }}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 lg:hidden"
            style={{ color: theme.accent }}
            aria-label="Menu"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: theme.muted }}
            >
              {theme.headerEyebrow}
            </p>
            <h1 className={`${theme.displayFont} text-xl truncate`} style={{ color: theme.titleColor }}>
              {title}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profil')}
            className="hidden rounded-full border bg-white px-3 py-1.5 text-xs font-semibold sm:inline-flex"
            style={{ borderColor: theme.headerBorder, color: theme.accent }}
          >
            Profil
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-7 text-slate-900">{children}</main>
      </div>
    </div>
  );
}
