import { useEffect, useMemo, useState } from 'react';
import Layout from '../layout/Layout';
import Icon from '../Icon';
import api from '../../services/api';

export default function SpecialiteModule({
  layoutTitle,
  pageTitle,
  listEndpoint,
  createEndpoint,
  patientsEndpoint,
  fields,
  defaultForm,
  renderItem,
  filterKey,
  filterOptions,
}) {
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filtre, setFiltre] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

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

  const filtered = useMemo(() => {
    let list = items;
    if (filtre && filterKey) {
      list = list.filter((i) => String(i[filterKey] || '') === filtre);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((i) => {
        const name = i.patient?.user?.name || '';
        const num = i.patient?.numero_patient || '';
        return name.toLowerCase().includes(q) || num.toLowerCase().includes(q);
      });
    }
    return list;
  }, [items, filtre, filterKey, query]);

  const searchPatients = async (q) => {
    setSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    const res = await api.get(patientsEndpoint, { params: { q } });
    setPatients(res.data.data || []);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(createEndpoint, form);
      setMsg('Enregistré');
      setShowForm(false);
      setForm(defaultForm);
      setSearch('');
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  return (
    <Layout title={layoutTitle}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{pageTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} enregistrement(s)</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(true); setMsg(''); setError(''); }}
          className="rounded-xl bg-[#0D6E6E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0a5c5c]"
        >
          + Nouveau
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un patient…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0D6E6E] focus:ring-2 focus:ring-[#0D6E6E]/15"
          />
        </div>
        {filterOptions?.length ? (
          <select
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Tous</option>
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : null}
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <form onSubmit={submit} className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Patient *</span>
            <input
              value={search}
              onChange={(e) => searchPatients(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
              placeholder="Nom ou n° patient…"
              required={!form.patient_id}
            />
            {patients.length > 0 && (
              <div className="mt-1 overflow-hidden rounded-xl border bg-white shadow-lg">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setField('patient_id', p.id); setSearch(p.user?.name || ''); setPatients([]); }}
                    className="block w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="font-medium">{p.user?.name}</span>
                    <span className="ml-2 text-xs text-slate-400">{p.numero_patient}</span>
                  </button>
                ))}
              </div>
            )}
          </label>
          {fields.map((field) => (
            <label key={field.name} className={`block ${field.fullWidth ? 'sm:col-span-2' : ''}`}>
              <span className="text-sm font-medium text-slate-700">{field.label}</span>
              {field.type === 'select' ? (
                <select
                  required={field.required}
                  value={form[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
                >
                  {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={form[field.name] ?? ''}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
                  rows={3}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  required={field.required}
                  value={form[field.name] ?? ''}
                  onChange={(e) => setField(field.name, field.type === 'checkbox' ? e.target.checked : e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              )}
            </label>
          ))}
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
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
              <Icon name="folder" className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">Aucun enregistrement</p>
            </div>
          ) : filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className={`w-full text-left transition ${selected?.id === item.id ? 'ring-2 ring-[#0D6E6E]/30' : ''}`}
            >
              {renderItem(item)}
            </button>
          ))}
        </div>

        <aside className="lg:col-span-2">
          <div className="sticky top-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {!selected ? (
              <p className="text-sm text-slate-400">Sélectionnez un enregistrement</p>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0D6E6E]">Détail</p>
                <h3 className="text-lg font-semibold text-slate-900">{selected.patient?.user?.name}</h3>
                <p className="text-xs text-slate-500">{selected.patient?.numero_patient}</p>
                <dl className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                  {Object.entries(selected)
                    .filter(([k, v]) => !['id', 'patient', 'patient_id', 'created_at', 'updated_at'].includes(k) && v != null && v !== '')
                    .slice(0, 12)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3">
                        <dt className="capitalize text-slate-400">{String(k).replace(/_/g, ' ')}</dt>
                        <dd className="text-right font-medium text-slate-800">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}
          </div>
        </aside>
      </div>
    </Layout>
  );
}
