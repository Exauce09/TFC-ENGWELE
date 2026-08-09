import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const STATUT_COLORS = {
  planifiee: 'bg-blue-50 text-blue-700',
  en_cours: 'bg-amber-50 text-amber-800',
  realisee: 'bg-emerald-50 text-emerald-700',
  annulee: 'bg-slate-100 text-slate-600',
};

export default function ChirurgieOperations() {
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    patient_id: '',
    date_operation: new Date().toISOString().slice(0, 10),
    type_operation: '',
    salle: '',
    type_anesthesie: 'generale',
  });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/chirurgie/operations').then((r) => setItems(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const searchPatients = async (q) => {
    setSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    const res = await api.get('/chirurgie/patients', { params: { q } });
    setPatients(res.data.data || []);
  };

  const creer = async (e) => {
    e.preventDefault();
    await api.post('/chirurgie/operations', form);
    setShowForm(false);
    load();
  };

  const updateStatut = async (id, statut) => {
    await api.put(`/chirurgie/operations/${id}/statut`, { statut });
    load();
  };

  return (
    <Layout title="Chirurgie">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Opérations</h2>
          <p className="mt-1 text-sm text-slate-500">{items.length} intervention(s)</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-[#0D6E6E] px-5 py-2.5 text-sm font-semibold text-white"
        >
          + Nouvelle opération
        </button>
      </div>

      {showForm && (
        <form onSubmit={creer} className="mb-6 grid gap-3 rounded-2xl border bg-white p-6 shadow-sm sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-medium">Patient</span>
            <input value={search} onChange={(e) => searchPatients(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="Rechercher…" />
            {patients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setForm((f) => ({ ...f, patient_id: p.id })); setSearch(p.user?.name); setPatients([]); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                {p.user?.name}
              </button>
            ))}
          </label>
          <input required type="date" value={form.date_operation} onChange={(e) => setForm((f) => ({ ...f, date_operation: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <input required placeholder="Type d'opération *" value={form.type_operation} onChange={(e) => setForm((f) => ({ ...f, type_operation: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="Salle" value={form.salle} onChange={(e) => setForm((f) => ({ ...f, salle: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
            <button type="submit" className="rounded-xl bg-[#0D6E6E] px-6 py-2 text-sm font-semibold text-white">Enregistrer</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          {loading ? (
            <p className="text-slate-500">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">Aucune opération</p>
          ) : items.map((op) => (
            <button
              key={op.id}
              type="button"
              onClick={() => setSelected(op)}
              className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-[#0D6E6E]/40 ${selected?.id === op.id ? 'ring-2 ring-[#0D6E6E]/30' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{op.patient?.user?.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUT_COLORS[op.statut] || 'bg-slate-100'}`}>
                  {op.statut?.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{op.type_operation}</p>
              <p className="text-xs text-slate-400">{op.date_operation} · Salle {op.salle || '—'}</p>
            </button>
          ))}
        </div>

        <aside className="lg:col-span-2">
          <div className="sticky top-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {!selected ? (
              <p className="text-sm text-slate-400">Sélectionnez une opération</p>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">{selected.patient?.user?.name}</h3>
                <p className="text-sm text-slate-600">{selected.type_operation}</p>
                <p className="text-xs text-slate-400">{selected.date_operation} · {selected.salle || 'Salle —'}</p>
                <label className="block pt-2">
                  <span className="text-xs font-medium text-slate-500">Statut</span>
                  <select
                    value={selected.statut}
                    onChange={(e) => updateStatut(selected.id, e.target.value)}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  >
                    {['planifiee', 'en_cours', 'realisee', 'annulee'].map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        </aside>
      </div>
    </Layout>
  );
}
