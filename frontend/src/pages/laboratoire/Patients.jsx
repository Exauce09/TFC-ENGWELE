import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function LaboratoirePatients() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/laboratoire/patients', {
        params: search.trim() ? { q: search.trim() } : {},
      });
      setItems(res.data.data || []);
      if (res.data.success === false) setError(res.data.message || '');
    } catch (err) {
      setItems([]);
      setError(err.response?.data?.message || 'Impossible de charger les patients laboratoire.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <Layout title="Patients — Laboratoire">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patients en file labo</h2>
          <p className="mt-1 text-sm text-slate-500">
            Patients avec examens prescrits / en cours (pas toute la patientèle).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void load(q); }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom ou n°…"
              className="rounded-xl border px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
              Rechercher
            </button>
          </form>
          <Link to="/laboratoire/analyses" className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700">
            Analyses →
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border bg-white p-10 text-center text-slate-500">
          Aucun patient avec examen en attente.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={`${p.id}-${p.admission_id || ''}`} className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate font-semibold text-slate-900">{p.user?.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {p.numero_patient || ''}
                    {p.numero_admission ? ` · ${p.numero_admission}` : ''}
                    {p.statut_label ? ` · ${p.statut_label}` : ''}
                    {p.departement ? ` · ${p.departement}` : ''}
                  </p>
                  {(p.examens || []).length > 0 && (
                    <p className="mt-1 text-xs text-slate-600">
                      {(p.examens || []).map((e) => e.type_examen).filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {p.admission_id && (
                    <Link to={`/parcours/${p.admission_id}`} className="rounded-xl border px-3 py-1.5 text-xs font-semibold text-slate-700">
                      Parcours
                    </Link>
                  )}
                  <Link to="/laboratoire/analyses" className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
                    Saisir résultats
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
