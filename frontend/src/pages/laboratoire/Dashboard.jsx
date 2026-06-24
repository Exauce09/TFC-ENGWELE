import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function LaboratoireDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/laboratoire/dashboard').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  return (
    <Layout title="Laboratoire">
      <h2 className="text-2xl font-bold text-slate-900">Laboratoire AMEN</h2>
      <p className="mt-1 text-sm text-slate-500">Gestion des analyses biologiques.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'En attente', value: stats?.en_attente ?? '—', color: 'bg-amber-50 text-amber-700', icon: '⏳' },
          { label: 'En cours', value: stats?.en_cours ?? '—', color: 'bg-blue-50 text-blue-700', icon: '🔬' },
          { label: 'Résultats dispo', value: stats?.disponibles ?? '—', color: 'bg-emerald-50 text-emerald-700', icon: '✅' },
          { label: 'Mes analyses', value: stats?.mes_analyses ?? '—', color: 'bg-violet-50 text-violet-700', icon: '📋' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.color}`}>
            <p className="text-2xl">{s.icon}</p>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
            <p className="text-sm opacity-80">{s.label}</p>
          </div>
        ))}
      </div>
      <Link to="/laboratoire/analyses"
        className="mt-6 inline-flex rounded-xl bg-medical-primary px-6 py-3 text-sm font-bold text-white shadow hover:-translate-y-0.5 transition">
        Gérer les analyses →
      </Link>
    </Layout>
  );
}
