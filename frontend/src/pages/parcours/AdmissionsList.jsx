import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { admissionsApi } from '../../services/admissionsApi';

function patientLabel(a) {
  return a.patient?.user?.name
    || a.patient?.numero_patient
    || (a.patient_id ? `Patient #${a.patient_id}` : 'Patient inconnu');
}

export default function AdmissionsList() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isInfirmier = user?.role === 'infirmier';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);
  // Admin : voir tout le parcours (y compris terminés) — sinon la liste « se vide » après la sortie.
  const [filtre, setFiltre] = useState(isAdmin ? 'tous' : 'actifs');
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = { per_page: isAdmin ? 50 : 20 };
    if (filtre === 'actifs') params.actifs = 1;
    if (filtre === 'termines') params.termines = 1;
    if (q.trim()) params.q = q.trim();

    admissionsApi.list(params)
      .then((res) => {
        if (cancelled) return;
        setItems(Array.isArray(res.data?.data) ? res.data.data : []);
        setMeta(res.data?.meta || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        setMeta(null);
        setError(err.response?.data?.message || 'Impossible de charger les admissions.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [filtre, q, isAdmin]);

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
          {isAdmin
            ? 'Vue admin : admissions en cours et historiques. Ouvrez un dossier pour le détail du parcours.'
            : 'Consultez les admissions en cours et ouvrez le dossier médical.'}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher nom, n° admission, motif…"
          className="w-full max-w-md rounded-xl border px-4 py-2 text-sm"
        />
        <select
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          <option value="tous">Toutes les admissions</option>
          <option value="actifs">En cours uniquement</option>
          <option value="termines">Terminées (suivi)</option>
        </select>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className={isInfirmier ? 'text-[#7A8FA8]' : 'text-slate-500'}>Chargement…</p>
      ) : items.length === 0 ? (
        <p className={isInfirmier ? 'infirmier-card p-10 text-center text-[#8FA3BE]' : 'rounded-2xl border bg-white p-10 text-center text-slate-500'}>
          {error
            ? 'La liste n’a pas pu être chargée.'
            : filtre === 'actifs'
              ? 'Aucune admission active. Passez le filtre sur « Toutes » pour voir l’historique.'
              : q
                ? 'Aucune admission ne correspond à cette recherche.'
                : 'Aucune admission enregistrée.'}
        </p>
      ) : (
        <>
          {meta?.total != null && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {meta.total} admission{meta.total > 1 ? 's' : ''}
            </p>
          )}
          <div className="space-y-3">
            {items.map((a) => {
              const name = patientLabel(a);
              const deleted = !!a.patient?.user?.deleted_at;
              return (
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
                    <div className="flex min-w-0 items-start gap-3">
                      {a.patient?.photo ? (
                        <img
                          src={a.patient.photo}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-xl border object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed bg-slate-50 text-sm font-bold text-slate-400">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className={`font-semibold ${isInfirmier ? 'text-[#152238]' : 'text-slate-900'}`}>
                          {name}
                          {deleted ? (
                            <span className="ml-2 text-[10px] font-semibold uppercase text-slate-400">compte supprimé</span>
                          ) : null}
                        </p>
                        <p className={`text-xs ${isInfirmier ? 'text-[#7A8FA8]' : 'text-slate-500'}`}>
                          {a.numero_admission} · {a.patient?.numero_patient || '—'} · {a.motif_arrivee}
                          {a.departement?.nom ? ` · ${a.departement.nom}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isInfirmier ? 'bg-[#F8E8E2] text-[#C9654B]' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {a.statut_label || a.statut}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
