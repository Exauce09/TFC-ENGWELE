import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Icon from '../../components/Icon';
import api from '../../services/api';
import { ROLE_THEMES } from '../../constants/roleThemes';

const T = ROLE_THEMES.dentiste;

export default function DentisterieDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/dentisterie/dashboard')
      .then((r) => {
        setData(r.data.data || {});
        if (r.data.success === false && r.data.message) setError(r.data.message);
      })
      .catch((err) => {
        setData({});
        setError(err.response?.data?.message || 'Impossible de charger le tableau de bord dentisterie.');
      })
      .finally(() => setLoading(false));
  }, []);

  const file = data?.file_consultation || [];
  const cards = [
    { key: 'file_count', label: 'File consultation', icon: 'users', to: '/dentisterie/patients' },
    { key: 'rdv_du_jour', label: 'RDV du jour', icon: 'calendar', to: '/dentisterie/planning' },
    { key: 'ce_mois', label: 'Soins ce mois', icon: 'tooth', to: '/dentisterie/soins' },
    { key: 'total', label: 'Total soins', icon: 'clipboard', to: '/dentisterie/soins' },
  ];

  return (
    <Layout title="Dentisterie">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[Fraunces,Georgia,serif] text-3xl" style={{ color: T.titleColor }}>Dentisterie</h2>
          <p className="mt-1 text-sm text-slate-500">
            Patients qui vous sont assignés à l&apos;accueil — file et soins bucco-dentaires.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/dentisterie/patients" className="rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: T.accent }}>
            File patients
          </Link>
          <Link to="/dentisterie/planning" className="rounded-xl border-2 bg-white px-5 py-2.5 text-sm font-bold" style={{ borderColor: T.accent, color: T.accent }}>
            Planning RDV
          </Link>
          <Link to="/dentisterie/soins" className="rounded-xl border bg-white px-5 py-2.5 text-sm font-bold text-slate-700">
            Soins
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((s) => (
              <Link
                key={s.key}
                to={s.to}
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderLeftWidth: 4, borderLeftColor: T.accent }}
              >
                <Icon name={s.icon} className="h-6 w-6 text-slate-600" />
                <p className="mt-3 text-3xl font-bold text-slate-900">{data?.[s.key] ?? 0}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="mt-2 text-xs font-semibold" style={{ color: T.accent }}>Voir →</p>
              </Link>
            ))}
          </div>

          <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900">File de consultation</h3>
              <Link to="/dentisterie/patients" className="text-xs font-semibold hover:underline" style={{ color: T.accent }}>
                Tout voir →
              </Link>
            </div>
            {file.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Aucun patient en file. À l&apos;accueil, assignez le patient au dentiste (service Dentisterie).
              </p>
            ) : (
              <ul className="space-y-2">
                {file.slice(0, 8).map((a) => (
                  <li key={a.id}>
                    <Link
                      to={`/parcours/${a.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{a.patient?.user?.name || 'Patient'}</p>
                        <p className="text-xs text-slate-500">
                          {a.numero_admission}
                          {a.departement?.nom ? ` · ${a.departement.nom}` : ''}
                          {a.motif_arrivee ? ` · ${a.motif_arrivee}` : ''}
                        </p>
                      </div>
                      <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-800">
                        {a.statut_label || a.statut}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
