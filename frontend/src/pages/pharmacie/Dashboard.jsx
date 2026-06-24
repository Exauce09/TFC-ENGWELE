import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function PharmacieDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/pharmacie/dashboard').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  return (
    <Layout title="Pharmacie">
      <h2 className="text-2xl font-bold text-slate-900">Pharmacie interne</h2>
      <p className="mt-1 text-sm text-slate-500">Stock et délivrance des ordonnances.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Médicaments', value: stats?.medicaments_total ?? '—', icon: '💊' },
          { label: 'Stock bas', value: stats?.stock_bas ?? '—', icon: '⚠️', alert: true },
          { label: 'Ordonnances actives', value: stats?.ordonnances_actives ?? '—', icon: '📋' },
          { label: 'Délivrées', value: stats?.ordonnances_delivrees ?? '—', icon: '✅' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.alert && stats?.stock_bas > 0 ? 'border-red-200 bg-red-50' : 'bg-white'}`}>
            <p className="text-2xl">{s.icon}</p>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <Link to="/pharmacie/stock" className="rounded-xl bg-medical-primary px-6 py-3 text-sm font-bold text-white">Gérer le stock</Link>
        <Link to="/pharmacie/ordonnances" className="rounded-xl border-2 border-medical-primary px-6 py-3 text-sm font-bold text-medical-primary">Ordonnances</Link>
      </div>
    </Layout>
  );
}
