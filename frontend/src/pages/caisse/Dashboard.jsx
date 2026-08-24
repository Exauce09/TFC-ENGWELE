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

  const cards = [
    { label: 'Factures du jour', value: stats?.factures_du_jour ?? '—', icon: 'receipt', to: '/caisse/factures' },
    { label: 'Montant facturé (jour)', value: stats ? `${fmt(stats.montant_du_jour)} FC` : '—', icon: 'wallet', to: '/caisse/factures' },
    { label: 'Encaissements (jour)', value: stats ? `${fmt(stats.paiements_du_jour)} FC` : '—', icon: 'check-circle', to: '/caisse/paiements' },
    {
      label: 'Impayées',
      value: stats?.impayees ?? '—',
      sub: stats ? `${fmt(stats.montant_impaye)} FC` : '',
      icon: 'alert',
      alert: (stats?.impayees ?? 0) > 0,
      to: '/caisse/factures',
    },
  ];

  return (
    <Layout title="Caisse">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-caisse-display text-3xl" style={{ color: T.titleColor }}>Caisse</h2>
          <p className="mt-1 text-sm text-slate-500">Facturation, encaissements et suivi des impayés.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/caisse/factures" className="rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: T.accent }}>
            Gérer les factures
          </Link>
          <Link
            to="/caisse/paiements"
            className="rounded-xl border-2 bg-white px-5 py-2.5 text-sm font-bold"
            style={{ borderColor: T.accent, color: T.accent }}
          >
            Enregistrer un paiement
          </Link>
          <Link to="/parcours" className="rounded-xl border bg-white px-5 py-2.5 text-sm font-bold text-slate-700">
            Parcours patient
          </Link>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${s.alert ? 'border-amber-200 bg-amber-50' : 'bg-white'}`}
            style={!s.alert ? { borderLeftWidth: 4, borderLeftColor: T.accent, borderColor: T.cardBorder } : undefined}
          >
            <Icon name={s.icon} className={`h-6 w-6 ${s.alert ? 'text-amber-700' : 'text-slate-600'}`} />
            <p className="mt-2 text-2xl font-bold" style={{ color: T.titleColor }}>{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
            {s.sub && <p className="text-xs text-amber-700">{s.sub}</p>}
            <p className="mt-2 text-xs font-semibold" style={{ color: T.accent }}>Voir →</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
