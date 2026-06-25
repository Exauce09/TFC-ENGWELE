import { useEffect, useState } from 'react';
import Layout from '../layout/Layout';
import api from '../../services/api';

export default function SpecialiteModule({
  layoutTitle,
  pageTitle,
  pageSubtitle,
  listEndpoint,
  createEndpoint,
  patientsEndpoint,
  fields,
  defaultForm,
  renderItem,
}) {
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(listEndpoint);
      setItems(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [listEndpoint]);

  const searchPatients = async (q) => {
    setSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    const res = await api.get(patientsEndpoint, { params: { q } });
    setPatients(res.data.data || []);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post(createEndpoint, form);
      setMsg('Enregistrement réussi.');
      setShowForm(false);
      setForm(defaultForm);
      setSearch('');
      void load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Erreur.');
    }
  };

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  return (
    <Layout title={layoutTitle}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{pageTitle}</h2>
          {pageSubtitle && <p className="text-sm text-slate-500">{pageSubtitle}</p>}
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">
          + Nouveau
        </button>
      </div>

      {msg && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div>}

      {showForm && (
        <form onSubmit={submit} className="mb-6 grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Patient *</span>
            <input value={search} onChange={(e) => searchPatients(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="Rechercher un patient..." />
            {patients.map((p) => (
              <button key={p.id} type="button" onClick={() => { setField('patient_id', p.id); setSearch(p.user?.name); setPatients([]); }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50">{p.user?.name} — {p.numero_patient}</button>
            ))}
          </label>
          {fields.map((field) => (
            <label key={field.name} className={`block ${field.fullWidth ? 'sm:col-span-2' : ''}`}>
              <span className="text-sm font-medium">{field.label}</span>
              {field.type === 'select' ? (
                <select required={field.required} value={form[field.name] ?? ''} onChange={(e) => setField(field.name, e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
                  {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea value={form[field.name] ?? ''} onChange={(e) => setField(field.name, e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" rows={3} />
              ) : (
                <input type={field.type || 'text'} required={field.required} value={form[field.name] ?? ''}
                  onChange={(e) => setField(field.name, field.type === 'checkbox' ? e.target.checked : e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
              )}
            </label>
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
            <button type="submit" className="rounded-xl bg-medical-primary px-6 py-2 text-sm font-bold text-white">Enregistrer</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-slate-500">Chargement...</p> : items.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucun enregistrement.</p>
      ) : (
        <div className="space-y-3">{items.map((item) => renderItem(item))}</div>
      )}
    </Layout>
  );
}
