import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Icon from '../../components/Icon';
import api from '../../services/api';
import { ROLE_THEMES } from '../../constants/roleThemes';

const T = ROLE_THEMES.pharmacien;

export default function PharmacieDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/pharmacie/dashboard').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  return (
    <Layout title="Pharmacie">
      <h2 className="font-pharmacie-display text-3xl" style={{ color: T.titleColor }}>Pharmacie</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Médicaments', value: stats?.medicaments_total ?? '—', icon: 'pill' },
          { label: 'Stock bas', value: stats?.stock_bas ?? '—', icon: 'alert', alert: true },
          { label: 'Ordonnances actives', value: stats?.ordonnances_actives ?? '—', icon: 'clipboard' },
          { label: 'Délivrées', value: stats?.ordonnances_delivrees ?? '—', icon: 'check-circle' },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-5 ${s.alert && stats?.stock_bas > 0 ? 'border-red-200 bg-red-50' : 'bg-white'}`}
            style={!s.alert || !(stats?.stock_bas > 0) ? { borderLeftWidth: 4, borderLeftColor: T.accent, borderColor: T.cardBorder } : undefined}
          >
            <Icon name={s.icon} className={`h-6 w-6 ${s.alert && stats?.stock_bas > 0 ? 'text-red-600' : 'text-slate-600'}`} />
            <p className="mt-2 text-3xl font-bold" style={{ color: T.titleColor }}>{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <Link to="/pharmacie/stock" className="rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ background: T.accent }}>
          Gérer le stock
        </Link>
        <Link
          to="/pharmacie/ordonnances"
          className="rounded-xl border-2 px-6 py-3 text-sm font-bold bg-white"
          style={{ borderColor: T.accent, color: T.accent }}
        >
          Ordonnances
        </Link>
      </div>
    </Layout>
  );
}
