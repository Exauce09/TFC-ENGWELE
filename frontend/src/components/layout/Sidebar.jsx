import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../Icon';
import { getMenuForRole, getRoleLabel } from './roleMenus';
import { getRoleTheme } from '../../constants/roleThemes';

/** Sidebar legacy — préférer RoleShell / Layout thématisé. Conservé pour compatibilité. */
export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = getRoleTheme(user?.role);
  const links = getMenuForRole(user?.role);
  const accent = theme?.accent || '#0070C0';
  const sidebarFrom = theme?.sidebarFrom || '#0f172a';
  const sidebarTo = theme?.sidebarTo || '#0f172a';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 text-white flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto`}
        style={{ background: `linear-gradient(180deg, ${sidebarFrom}, ${sidebarTo})` }}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-lg shadow text-white"
            style={{ background: accent }}
          >
            A
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Centre Médical</p>
            <p className="text-xs font-semibold" style={{ color: theme?.brandText || '#34d399' }}>
              AMEN
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white lg:hidden" aria-label="Fermer">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-4 my-4 rounded-xl bg-white/5 p-3 border border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: accent }}
            >
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-slate-400">{getRoleLabel(user?.role)}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Navigation
          </p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium mb-1 transition-all ${
                  isActive ? 'text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
              style={({ isActive }) => (isActive ? { background: accent } : undefined)}
            >
              <Icon name={link.icon} className="h-4 w-4 shrink-0 opacity-90" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-red-900/40 hover:text-red-300 transition"
          >
            <Icon name="logout" className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}
