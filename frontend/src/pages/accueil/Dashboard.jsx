import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function AccueilDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/accueil/dashboard').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  return (
    <Layout title="Accueil">
      <h2 className="text-2xl font-bold text-slate-900">Accueil & réception</h2>
      <p className="mt-1 text-sm text-slate-500">Gestion des arrivées, demandes et rendez-vous du jour.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { key: 'demandes_nouvelles', label: 'Demandes nouvelles', icon: '📩' },
          { key: 'rdv_du_jour', label: 'RDV du jour', icon: '📅' },
          { key: 'rdv_en_attente', label: 'RDV en attente', icon: '⏳' },
          { key: 'patients_total', label: 'Patients', icon: '👥' },
        ].map((s) => (
          <div key={s.key} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-2xl">{s.icon}</p>
            <p className="mt-2 text-3xl font-bold">{stats?.[s.key] ?? '—'}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link to="/accueil/demandes" className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
          <p className="text-3xl">📩</p>
          <p className="mt-2 font-bold">Demandes RDV</p>
        </Link>
        <Link to="/accueil/rendez-vous" className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
          <p className="text-3xl">📅</p>
          <p className="mt-2 font-bold">RDV du jour</p>
        </Link>
        <Link to="/accueil/patients" className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
          <p className="text-3xl">👥</p>
          <p className="mt-2 font-bold">Recherche patients</p>
        </Link>
      </div>
    </Layout>
  );
}
