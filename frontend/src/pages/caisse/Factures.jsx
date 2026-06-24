import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const STATUT_STYLES = {
  emise: 'bg-amber-100 text-amber-700',
  partiellement_payee: 'bg-orange-100 text-orange-700',
  payee: 'bg-emerald-100 text-emerald-700',
  annulee: 'bg-red-100 text-red-700',
  brouillon: 'bg-slate-100 text-slate-600',
};

const emptyLine = { description: '', quantite: 1, prix_unitaire: '' };

export default function CaisseFactures() {
  const [factures, setFactures] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    patient_id: '',
    remise: 0,
    notes: '',
    lignes: [{ ...emptyLine }],
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = filter ? { statut: filter } : {};
      const [fRes, pRes] = await Promise.all([
        api.get('/caisse/factures', { params }),
        api.get('/caisse/patients'),
      ]);
      setFactures(fRes.data.data || []);
      setPatients(pRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [filter]);

  const totalPreview = form.lignes.reduce(
    (sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0),
    0,
  ) - (Number(form.remise) || 0);

  const addLine = () => setForm((f) => ({ ...f, lignes: [...f.lignes, { ...emptyLine }] }));

  const updateLine = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      lignes: f.lignes.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/caisse/factures', {
        ...form,
        lignes: form.lignes.map((l) => ({
          description: l.description,
          quantite: Number(l.quantite),
          prix_unitaire: Number(l.prix_unitaire),
        })),
        remise: Number(form.remise) || 0,
      });
      setShowForm(false);
      setForm({ patient_id: '', remise: 0, notes: '', lignes: [{ ...emptyLine }] });
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const annuler = async (id) => {
    if (!confirm('Annuler cette facture ?')) return;
    try {
      await api.put(`/caisse/factures/${id}/annuler`);
      void load();
    } catch (err) {
      alert(err.response?.data?.message || 'Annulation impossible');
    }
  };

  return (
    <Layout title="Factures">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Factures</h2>
          <p className="text-sm text-slate-500">Émission et suivi des factures patients.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">
          {showForm ? '✕ Fermer' : '+ Nouvelle facture'}
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {showForm && (
        <form onSubmit={submit} className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold">Créer une facture</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Patient *</span>
              <select required value={form.patient_id} onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="">Choisir un patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.user?.name} — {p.numero_patient}</option>
                ))}
              </select>
            </label>
            {form.lignes.map((l, i) => (
              <div key={i} className="sm:col-span-2 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-4">
                <input required placeholder="Description *" value={l.description}
                  onChange={(e) => updateLine(i, 'description', e.target.value)}
                  className="sm:col-span-2 rounded-xl border px-3 py-2 text-sm" />
                <input type="number" min="1" placeholder="Qté" value={l.quantite}
                  onChange={(e) => updateLine(i, 'quantite', e.target.value)}
                  className="rounded-xl border px-3 py-2 text-sm" />
                <input type="number" min="0" required placeholder="Prix unit. FC" value={l.prix_unitaire}
                  onChange={(e) => updateLine(i, 'prix_unitaire', e.target.value)}
                  className="rounded-xl border px-3 py-2 text-sm" />
              </div>
            ))}
            <button type="button" onClick={addLine} className="text-sm text-medical-primary hover:underline sm:col-span-2">+ Ajouter une ligne</button>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Remise (FC)</span>
              <input type="number" min="0" value={form.remise} onChange={(e) => setForm((f) => ({ ...f, remise: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <div className="flex items-end">
              <p className="text-lg font-bold text-slate-900">Total : {Math.max(0, totalPreview).toLocaleString()} FC</p>
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="mt-4 rounded-xl bg-medical-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {submitting ? 'Création...' : 'Émettre la facture'}
          </button>
        </form>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {['', 'emise', 'partiellement_payee', 'payee', 'annulee'].map((s) => (
          <button key={s || 'all'} onClick={() => setFilter(s)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold ${filter === s ? 'bg-medical-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
            {s ? s.replace(/_/g, ' ') : 'Toutes'}
          </button>
        ))}
      </div>

      {loading ? <p className="text-slate-500">Chargement...</p> : factures.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucune facture.</p>
      ) : (
        <div className="space-y-3">
          {factures.map((f) => (
            <article key={f.id} className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{f.numero_facture}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUT_STYLES[f.statut] ?? 'bg-slate-100'}`}>
                    {f.statut?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{f.patient?.user?.name}</p>
                <p className="text-xs text-slate-400">{new Date(f.date_facture).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{Number(f.montant_total).toLocaleString()} FC</p>
                <p className="text-xs text-slate-500">Payé : {Number(f.montant_paye).toLocaleString()} · Reste : {Number(f.reste_a_payer).toLocaleString()}</p>
              </div>
              {!['payee', 'annulee'].includes(f.statut) && (
                <button onClick={() => annuler(f.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                  Annuler
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
