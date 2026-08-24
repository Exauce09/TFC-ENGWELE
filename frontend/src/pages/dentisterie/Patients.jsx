import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function DentisteriePatients() {
  const [file, setFile] = useState([]);
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const [fRes, pRes] = await Promise.all([
        api.get('/dentisterie/file-consultation'),
        api.get('/dentisterie/patients', { params: search.trim() ? { q: search.trim() } : {} }),
      ]);
      setFile(fRes.data.data || []);
      setPatients(pRes.data.data || []);
      const msgs = [];
      if (fRes.data.success === false && fRes.data.message) msgs.push(fRes.data.message);
      if (pRes.data.success === false && pRes.data.message) msgs.push(pRes.data.message);
      setError(msgs.join(' '));
    } catch (err) {
      setFile([]);
      setPatients([]);
      setError(err.response?.data?.message || 'Impossible de charger les patients dentisterie.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <Layout title="Patients — Dentisterie">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patients assignés</h2>
          <p className="mt-1 text-sm text-slate-500">
            Uniquement les patients orientés vers vous (accueil / RDV / dossier) — pas toute la patientèle.
          </p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); void load(q); }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom ou n° patient…"
            className="rounded-xl border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-xl bg-[#0D6E6E] px-4 py-2 text-sm font-semibold text-white">
            Rechercher
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-slate-900">File du jour ({file.length})</h3>
            {file.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun patient en triage / consultation pour vous.</p>
            ) : (
              <ul className="space-y-2">
                {file.map((a) => (
                  <li key={a.id}>
                    <Link to={`/parcours/${a.id}`} className="block rounded-xl border px-3 py-2.5 hover:bg-slate-50">
                      <p className="font-medium text-slate-900">{a.patient?.user?.name}</p>
                      <p className="text-xs text-slate-500">
                        {a.numero_admission} · {a.statut_label || a.statut}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-slate-900">Tous vos patients ({patients.length})</h3>
            {patients.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun patient encore assigné à votre profil dentiste.</p>
            ) : (
              <ul className="space-y-2">
                {patients.map((p) => (
                  <li key={p.id} className="rounded-xl border px-3 py-2.5">
                    <p className="font-medium text-slate-900">{p.user?.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.numero_patient}
                      {p.admission_active ? ` · ${p.admission_active.statut_label || p.admission_active.statut}` : ''}
                    </p>
                    {p.admission_active?.id && (
                      <Link to={`/parcours/${p.admission_active.id}`} className="mt-1 inline-block text-xs font-semibold text-[#0D6E6E] hover:underline">
                        Ouvrir le parcours →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Layout>
  );
}
