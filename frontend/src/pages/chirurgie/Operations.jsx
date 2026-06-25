import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function ChirurgieOperations() {
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patient_id: '', date_operation: new Date().toISOString().slice(0, 10),
    type_operation: '', salle: '', type_anesthesie: 'generale',
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
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Opérations chirurgicales</h2>
        <button onClick={() => setShowForm(true)} className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">+ Nouvelle opération</button>
      </div>

      {showForm && (
        <form onSubmit={creer} className="mb-6 grid gap-3 rounded-2xl border bg-white p-6 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-medium">Patient</span>
            <input value={search} onChange={(e) => searchPatients(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="Rechercher..." />
            {patients.map((p) => (
              <button key={p.id} type="button" onClick={() => { setForm((f) => ({ ...f, patient_id: p.id })); setSearch(p.user?.name); setPatients([]); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50">{p.user?.name}</button>
            ))}
          </label>
          <input required type="date" value={form.date_operation} onChange={(e) => setForm((f) => ({ ...f, date_operation: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <input required placeholder="Type d'opération *" value={form.type_operation} onChange={(e) => setForm((f) => ({ ...f, type_operation: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="Salle" value={form.salle} onChange={(e) => setForm((f) => ({ ...f, salle: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <div className="sm:col-span-2 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
            <button type="submit" className="rounded-xl bg-medical-primary px-6 py-2 text-sm font-bold text-white">Enregistrer</button>
          </div>
        </form>
      )}

      {loading ? <p>Chargement...</p> : (
        <div className="space-y-3">
          {items.map((op) => (
            <article key={op.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="font-semibold">{op.patient?.user?.name} — {op.type_operation}</p>
              <p className="text-sm text-slate-500">{op.date_operation} · Salle {op.salle || '—'}</p>
              <select value={op.statut} onChange={(e) => updateStatut(op.id, e.target.value)} className="mt-2 rounded-lg border px-2 py-1 text-sm">
                {['planifiee', 'en_cours', 'realisee', 'annulee'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
