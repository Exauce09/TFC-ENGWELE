import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function CaisseDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/caisse/dashboard').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  const fmt = (n) => Number(n ?? 0).toLocaleString('fr-FR');

  return (
    <Layout title="Caisse">
      <h2 className="text-2xl font-bold text-slate-900">Caisse & Facturation</h2>
      <p className="mt-1 text-sm text-slate-500">Encaissements, factures et recouvrement.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Factures du jour', value: stats?.factures_du_jour ?? '—', icon: '🧾' },
          { label: 'Montant facturé (jour)', value: stats ? `${fmt(stats.montant_du_jour)} FC` : '—', icon: '💰' },
          { label: 'Encaissements (jour)', value: stats ? `${fmt(stats.paiements_du_jour)} FC` : '—', icon: '✅' },
          { label: 'Impayées', value: stats?.impayees ?? '—', sub: stats ? `${fmt(stats.montant_impaye)} FC` : '', icon: '⚠️', alert: (stats?.impayees ?? 0) > 0 },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.alert ? 'border-amber-200 bg-amber-50' : 'bg-white'}`}>
            <p className="text-2xl">{s.icon}</p>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
            {s.sub && <p className="text-xs text-amber-700">{s.sub}</p>}
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/caisse/factures" className="rounded-xl bg-medical-primary px-6 py-3 text-sm font-bold text-white">Gérer les factures</Link>
        <Link to="/caisse/paiements" className="rounded-xl border-2 border-medical-primary px-6 py-3 text-sm font-bold text-medical-primary">Enregistrer un paiement</Link>
      </div>
    </Layout>
  );
}
