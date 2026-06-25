import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export default function Header({ onMenuToggle, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const dropRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications', { params: { per_page: 8 } });
      setNotifications(res.data.data || []);
      setUnread(res.data.meta?.unread ?? 0);
    } catch {
      // silent
    }
  }, [user]);

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => void loadNotifications(), 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/tout-lire');
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnread(0);
    } catch {
      // no-op
    }
  };

  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/lu`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      // no-op
    }
  };

  const toggleNotifs = () => {
    setNotifOpen((o) => {
      if (!o) void loadNotifications();
      return !o;
    });
    setDropOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-slate-100 bg-white/95 px-5 py-3.5 shadow-sm backdrop-blur-sm">
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Menu"
      >
        ☰
      </button>

      <h1 className="flex-1 text-lg font-semibold text-slate-900">{title}</h1>

      <span className="hidden text-sm text-slate-400 sm:block">
        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </span>

      <div className="flex items-center gap-2" ref={dropRef}>
        <div className="relative">
          <button
            onClick={toggleNotifs}
            className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 transition"
          >
            🔔
            {unread > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white border-2 border-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl bg-white shadow-2xl border border-slate-100 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="font-semibold text-sm text-slate-900">Notifications</p>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-medical-primary hover:underline">
                    Tout lire
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-400">Aucune notification</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.lu && void markOneRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-slate-50 cursor-pointer ${!n.lu ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${!n.lu ? 'bg-medical-primary' : 'bg-slate-200'}`} />
                    <div>
                      <p className="text-xs font-medium text-slate-800">{n.titre}</p>
                      <p className="text-xs text-slate-600">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setDropOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-medical-primary text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 sm:block">{user?.name?.split(' ')[0]}</span>
            <span className="text-slate-400 text-xs">▾</span>
          </button>

          {dropOpen && (
            <div className="absolute right-0 top-12 w-52 rounded-2xl bg-white shadow-2xl border border-slate-100 z-50 py-2">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setDropOpen(false);
                    navigate('/profil');
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span>👤</span> Mon profil
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <span>🚪</span> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
