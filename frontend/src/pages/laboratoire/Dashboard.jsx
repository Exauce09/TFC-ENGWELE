import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Icon from '../../components/Icon';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ROLE_THEMES } from '../../constants/roleThemes';

const T = ROLE_THEMES.laborantin;

export default function LaboratoireDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/laboratoire/dashboard').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  return (
    <Layout title="Laboratoire">
      <h2 className="font-labo-display text-3xl" style={{ color: T.titleColor }}>Laboratoire</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Patients parcours', value: stats?.patients_parcours ?? '—', color: 'bg-slate-100 text-slate-800', icon: 'users' },
          { label: 'En attente', value: stats?.en_attente ?? '—', color: 'bg-amber-50 text-amber-800', icon: 'clock' },
          { label: 'En cours', value: stats?.en_cours ?? '—', color: 'bg-stone-100 text-stone-800', icon: 'microscope' },
          { label: 'Résultats dispo', value: stats?.disponibles ?? '—', color: 'bg-emerald-50 text-emerald-800', icon: 'check-circle' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.color}`} style={{ borderColor: T.cardBorder }}>
            <Icon name={s.icon} className="h-6 w-6 opacity-80" />
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
            <p className="text-sm opacity-80">{s.label}</p>
          </div>
        ))}
      </div>
      <Link
        to="/laboratoire/analyses"
        className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow transition hover:-translate-y-0.5"
        style={{ background: T.accent }}
      >
        Gérer les analyses
        <Icon name="arrow-right" className="h-4 w-4" />
      </Link>
    </Layout>
  );
}
