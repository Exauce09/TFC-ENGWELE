import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InfirmierLayout from '../../components/layout/InfirmierLayout';
import api from '../../services/api';
import { admissionsApi } from '../../services/admissionsApi';

export default function InfirmierPrelevements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/infirmier/file-prelevement');
      setItems(res.data.data || []);
    } catch {
      setItems([]);
      setError('Impossible de charger la file de prélèvement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const setField = (id, key, value) => {
    setForm((f) => ({ ...f, [id]: { ...(f[id] || {}), [key]: value } }));
  };

  const transmettre = async (a) => {
    setBusyId(a.id);
    setError('');
    setMsg('');
    const f = form[a.id] || {};
    try {
      await admissionsApi.prelevement(a.id, {
        type_echantillon: f.type_echantillon || 'sang veineux',
        conditions_prelevement: f.conditions || '',
        notes: f.notes || '',
      });
      setMsg(`Prélèvement ${a.numero_admission} transmis au laboratoire.`);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Échec du prélèvement');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <InfirmierLayout title="Prélèvements">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E07A5F]">Étape 4</p>
        <h2 className="font-infirmier-display text-3xl text-[#152238]">File de prélèvement</h2>
        <p className="mt-1 text-sm text-[#7A8FA8]">
          Patients après prescription d&apos;examens — transmettre l&apos;échantillon au laboratoire.
        </p>
      </div>

      {msg && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</div>}
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {loading ? (
        <p className="text-[#7A8FA8]">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#C9D4E3] bg-white p-10 text-center text-[#7A8FA8]">
          Aucun prélèvement en attente.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((a) => {
            const examens = a.examens_labo || a.examensLabo || [];
            const f = form[a.id] || {};
            return (
              <article key={a.id} className="rounded-2xl border border-[#C9D4E3] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#152238]">{a.patient?.user?.name}</p>
                    <p className="text-sm text-[#7A8FA8]">
                      {a.numero_admission} · {a.departement?.nom || '—'}
                      {a.medecin_referent?.user?.name || a.medecinReferent?.user?.name
                        ? ` · ${a.medecin_referent?.user?.name || a.medecinReferent?.user?.name}`
                        : ''}
                    </p>
                    {examens.length > 0 && (
                      <ul className="mt-2 text-xs text-[#5A6F88]">
                        {examens.map((ex) => (
                          <li key={ex.id}>• {ex.type_examen} ({ex.priorite || 'routine'})</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Link to={`/parcours/${a.id}`} className="text-xs font-semibold text-[#E07A5F] hover:underline">
                    Voir dossier →
                  </Link>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-[#152238]">Type d&apos;échantillon</span>
                    <input
                      placeholder="Sang veineux, urine…"
                      value={f.type_echantillon || ''}
                      onChange={(e) => setField(a.id, 'type_echantillon', e.target.value)}
                      className="w-full rounded-xl border border-[#C9D4E3] bg-white px-3 py-2 text-sm text-[#152238] placeholder:text-slate-400"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-[#152238]">Conditions</span>
                    <input
                      placeholder="À jeun…"
                      value={f.conditions || ''}
                      onChange={(e) => setField(a.id, 'conditions', e.target.value)}
                      className="w-full rounded-xl border border-[#C9D4E3] bg-white px-3 py-2 text-sm text-[#152238] placeholder:text-slate-400"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-[#152238]">Notes</span>
                    <input
                      placeholder="Observations"
                      value={f.notes || ''}
                      onChange={(e) => setField(a.id, 'notes', e.target.value)}
                      className="w-full rounded-xl border border-[#C9D4E3] bg-white px-3 py-2 text-sm text-[#152238] placeholder:text-slate-400"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => transmettre(a)}
                  className="mt-3 rounded-xl bg-[#E07A5F] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  {busyId === a.id ? '…' : 'Transmettre au laboratoire'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </InfirmierLayout>
  );
}
