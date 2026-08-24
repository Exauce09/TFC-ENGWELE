import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Icon from '../../components/Icon';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { ROLE_THEMES } from '../../constants/roleThemes';

const T = ROLE_THEMES.laborantin;

export default function LaboratoireDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api.get('/laboratoire/dashboard')
      .then((r) => {
        setStats(r.data.data || {});
        if (r.data.success === false && r.data.message) setError(r.data.message);
      })
      .catch((err) => {
        setStats({});
        setError(err.response?.data?.message || 'Stats laboratoire indisponibles.');
      });
  }, []);

  const cards = [
    { label: 'Patients file', value: stats?.patients_parcours ?? stats?.file_admissions ?? '—', color: 'bg-slate-100 text-slate-800', icon: 'users', to: '/laboratoire/patients' },
    { label: 'En attente', value: stats?.en_attente ?? '—', color: 'bg-amber-50 text-amber-800', icon: 'clock', to: '/laboratoire/analyses' },
    { label: 'En cours', value: stats?.en_cours ?? '—', color: 'bg-stone-100 text-stone-800', icon: 'microscope', to: '/laboratoire/analyses' },
    { label: 'Résultats dispo', value: stats?.disponibles ?? '—', color: 'bg-emerald-50 text-emerald-800', icon: 'check-circle', to: '/laboratoire/analyses' },
  ];

  return (
    <Layout title="Laboratoire">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-labo-display text-3xl" style={{ color: T.titleColor }}>Laboratoire</h2>
          <p className="mt-1 text-sm text-slate-500">File d&apos;analyses et publication des résultats.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/laboratoire/analyses"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow transition hover:-translate-y-0.5"
            style={{ background: T.accent }}
          >
            Gérer les analyses
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
          <Link to="/laboratoire/patients" className="rounded-xl border-2 bg-white px-5 py-2.5 text-sm font-bold" style={{ borderColor: T.accent, color: T.accent }}>
            Patients
          </Link>
          <Link to="/parcours" className="rounded-xl border bg-white px-5 py-2.5 text-sm font-bold text-slate-700">
            Parcours patient
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${s.color}`}
            style={{ borderColor: T.cardBorder }}
          >
            <Icon name={s.icon} className="h-6 w-6 opacity-80" />
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
            <p className="text-sm opacity-80">{s.label}</p>
            <p className="mt-2 text-xs font-semibold" style={{ color: T.accent }}>Voir →</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
