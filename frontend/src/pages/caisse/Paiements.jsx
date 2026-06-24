import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const MODE_LABELS = {
  cash: 'Espèces',
  airtel_money: 'Airtel Money',
  mpesa: 'M-Pesa',
  virement: 'Virement',
};

export default function CaissePaiements() {
  const [paiements, setPaiements] = useState([]);
  const [facturesOuvertes, setFacturesOuvertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    facture_id: '',
    montant: '',
    mode_paiement: 'cash',
    reference_transaction: '',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, fRes] = await Promise.all([
        api.get('/caisse/paiements'),
        api.get('/caisse/factures', { params: { statut: 'emise' } }),
      ]);
      setPaiements(pRes.data.data || []);
      const partielles = await api.get('/caisse/factures', { params: { statut: 'partiellement_payee' } });
      setFacturesOuvertes([
        ...(fRes.data.data || []),
        ...(partielles.data.data || []),
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const onFactureChange = (id) => {
    const f = facturesOuvertes.find((x) => String(x.id) === id);
    setForm((prev) => ({
      ...prev,
      facture_id: id,
      montant: f ? String(f.reste_a_payer) : '',
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/caisse/paiements', {
        ...form,
        montant: Number(form.montant),
      });
      setSuccess(res.data.message || 'Paiement enregistré.');
      setForm({ facture_id: '', montant: '', mode_paiement: 'cash', reference_transaction: '', notes: '' });
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Enregistrement impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Paiements">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Paiements</h2>
        <p className="text-sm text-slate-500">Enregistrer les encaissements à la caisse.</p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <form onSubmit={submit} className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold">Nouveau paiement</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Facture *</span>
            <select required value={form.facture_id} onChange={(e) => onFactureChange(e.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 text-sm">
              <option value="">Sélectionner une facture impayée...</option>
              {facturesOuvertes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.numero_facture} — {f.patient?.user?.name} — reste {Number(f.reste_a_payer).toLocaleString()} FC
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Montant (FC) *</span>
            <input type="number" required min="1" value={form.montant}
              onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Mode *</span>
            <select value={form.mode_paiement} onChange={(e) => setForm((f) => ({ ...f, mode_paiement: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2.5 text-sm">
              <option value="cash">Espèces</option>
              <option value="airtel_money">Airtel Money</option>
              <option value="mpesa">M-Pesa</option>
              <option value="virement">Virement bancaire</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Référence transaction</span>
            <input value={form.reference_transaction} onChange={(e) => setForm((f) => ({ ...f, reference_transaction: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Optionnel" />
          </label>
        </div>
        <button type="submit" disabled={submitting}
          className="mt-4 rounded-xl bg-medical-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {submitting ? 'Enregistrement...' : 'Valider le paiement'}
        </button>
      </form>

      <h3 className="mb-3 font-semibold text-slate-900">Historique récent</h3>
      {loading ? <p className="text-slate-500">Chargement...</p> : paiements.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucun paiement.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Facture</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Mode</th>
              </tr>
            </thead>
            <tbody>
              {paiements.map((p) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">{new Date(p.date_paiement).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 font-medium">{p.facture?.numero_facture}</td>
                  <td className="px-4 py-3">{p.patient?.user?.name}</td>
                  <td className="px-4 py-3 font-bold">{Number(p.montant).toLocaleString()} FC</td>
                  <td className="px-4 py-3">{MODE_LABELS[p.mode_paiement] ?? p.mode_paiement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
