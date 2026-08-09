import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { admissionsApi } from '../../services/admissionsApi';

export default function AdmissionsList() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isInfirmier = user?.role === 'infirmier';

  useEffect(() => {
    admissionsApi.list({ actifs: 1 })
      .then((res) => setItems(res.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (user?.role === 'receptionniste') {
    return <Navigate to="/accueil/reception" replace />;
  }

  return (
    <Layout title="Parcours patient">
      <div className="mb-6">
        <h2 className={isInfirmier ? 'font-infirmier-display text-3xl text-[#152238]' : 'text-2xl font-bold text-slate-900'}>
          Parcours patient
        </h2>
        <p className={isInfirmier ? 'mt-1 text-sm text-[#7A8FA8]' : 'mt-1 text-sm text-slate-500'}>
          Consultez les admissions en cours et ouvrez le dossier médical.
        </p>
      </div>

      {loading ? (
        <p className={isInfirmier ? 'text-[#7A8FA8]' : 'text-slate-500'}>Chargement…</p>
      ) : items.length === 0 ? (
        <p className={isInfirmier ? 'infirmier-card p-10 text-center text-[#8FA3BE]' : 'rounded-2xl border bg-white p-10 text-center text-slate-500'}>
          Aucune admission active.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Link
              key={a.id}
              to={`/parcours/${a.id}`}
              className={
                isInfirmier
                  ? 'infirmier-card block p-4 transition hover:border-[#E07A5F]/50'
                  : 'block rounded-2xl border bg-white p-4 shadow-sm transition hover:border-medical-primary hover:shadow-md'
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className={`font-semibold ${isInfirmier ? 'text-[#152238]' : 'text-slate-900'}`}>
                    {a.patient?.user?.name}
                  </p>
                  <p className={`text-xs ${isInfirmier ? 'text-[#7A8FA8]' : 'text-slate-500'}`}>
                    {a.numero_admission} · {a.patient?.numero_patient} · {a.motif_arrivee}
                    {a.departement?.nom ? ` · ${a.departement.nom}` : ''}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isInfirmier ? 'bg-[#F8E8E2] text-[#C9654B]' : 'bg-blue-50 text-blue-700'
                }`}>
                  {a.statut_label || a.statut}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
