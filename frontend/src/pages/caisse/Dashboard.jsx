import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Icon from '../../components/Icon';
import api from '../../services/api';
import { ROLE_THEMES } from '../../constants/roleThemes';

const T = ROLE_THEMES.caissier;

export default function CaisseDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/caisse/dashboard').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  const fmt = (n) => Number(n ?? 0).toLocaleString('fr-FR');

  return (
    <Layout title="Caisse">
      <h2 className="font-caisse-display text-3xl" style={{ color: T.titleColor }}>Caisse</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Factures du jour', value: stats?.factures_du_jour ?? '—', icon: 'receipt' },
          { label: 'Montant facturé (jour)', value: stats ? `${fmt(stats.montant_du_jour)} FC` : '—', icon: 'wallet' },
          { label: 'Encaissements (jour)', value: stats ? `${fmt(stats.paiements_du_jour)} FC` : '—', icon: 'check-circle' },
          { label: 'Impayées', value: stats?.impayees ?? '—', sub: stats ? `${fmt(stats.montant_impaye)} FC` : '', icon: 'alert', alert: (stats?.impayees ?? 0) > 0 },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-5 ${s.alert ? 'border-amber-200 bg-amber-50' : 'bg-white'}`}
            style={!s.alert ? { borderLeftWidth: 4, borderLeftColor: T.accent, borderColor: T.cardBorder } : undefined}
          >
            <Icon name={s.icon} className={`h-6 w-6 ${s.alert ? 'text-amber-700' : 'text-slate-600'}`} />
            <p className="mt-2 text-2xl font-bold" style={{ color: T.titleColor }}>{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
            {s.sub && <p className="text-xs text-amber-700">{s.sub}</p>}
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/caisse/factures" className="rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ background: T.accent }}>
          Gérer les factures
        </Link>
        <Link
          to="/caisse/paiements"
          className="rounded-xl border-2 px-6 py-3 text-sm font-bold bg-white"
          style={{ borderColor: T.accent, color: T.accent }}
        >
          Enregistrer un paiement
        </Link>
      </div>
    </Layout>
  );
}
