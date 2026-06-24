import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const STATUT_STYLES = {
  emise: 'bg-amber-100 text-amber-700',
  partiellement_payee: 'bg-orange-100 text-orange-700',
  payee: 'bg-emerald-100 text-emerald-700',
};

export default function PatientFactures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detail, setDetail] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ mode: 'airtel_money', telephone: '' });
  const [paying, setPaying] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patient/factures');
      setFactures(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openDetail = async (id) => {
    try {
      const res = await api.get(`/patient/factures/${id}`);
      setDetail(res.data.data);
    } catch {
      setDetail(null);
    }
  };

  const payer = async (e) => {
    e.preventDefault();
    if (!payModal) return;
    setPaying(true);
    setError('');
    try {
      const res = await api.post(`/patient/factures/${payModal.id}/paiement`, payForm);
      setSuccess(res.data.message || 'Paiement enregistré.');
      setPayModal(null);
      setDetail(null);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Paiement impossible');
    } finally {
      setPaying(false);
    }
  };

  const description = (f) => f.lignes?.map((l) => l.description).join(', ') || '—';

  return (
    <Layout title="Mes Factures">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Mes factures</h2>
        <p className="text-sm text-slate-500">Consultez et payez vos factures hospitalières.</p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {loading ? <p className="text-slate-500">Chargement...</p> : factures.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <p className="text-4xl">🧾</p>
          <p className="mt-3 font-medium text-slate-700">Aucune facture</p>
          <Link to="/patient/dashboard" className="mt-4 inline-block text-sm text-medical-primary hover:underline">Retour au tableau de bord</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {factures.map((f) => (
            <article key={f.id} className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => openDetail(f.id)}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{f.numero_facture}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUT_STYLES[f.statut] ?? 'bg-slate-100'}`}>
                    {f.statut?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{description(f)}</p>
                <p className="text-xs text-slate-400">{new Date(f.date_facture).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{Number(f.montant_total).toLocaleString()} FC</p>
                {f.reste_a_payer > 0 && (
                  <p className="text-xs text-amber-600">Reste : {Number(f.reste_a_payer).toLocaleString()} FC</p>
                )}
              </div>
              {['emise', 'partiellement_payee'].includes(f.statut) && (
                <button onClick={() => setPayModal(f)}
                  className="rounded-xl bg-medical-primary px-5 py-2 text-sm font-semibold text-white">
                  Payer
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{detail.numero_facture}</h3>
            <p className="text-sm text-slate-500">{new Date(detail.date_facture).toLocaleDateString('fr-FR')}</p>
            <table className="mt-4 w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500"><th className="py-2">Description</th><th>Qté</th><th className="text-right">Montant</th></tr></thead>
              <tbody>
                {(detail.lignes || []).map((l, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2">{l.description}</td>
                    <td>{l.quantite}</td>
                    <td className="text-right">{(l.quantite * l.prix_unitaire).toLocaleString()} FC</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 space-y-1 text-sm">
              <p>Sous-total : {Number(detail.sous_total).toLocaleString()} FC</p>
              {detail.remise > 0 && <p>Remise : -{Number(detail.remise).toLocaleString()} FC</p>}
              <p className="font-bold">Total : {Number(detail.montant_total).toLocaleString()} FC</p>
              <p className="text-emerald-600">Payé : {Number(detail.montant_paye).toLocaleString()} FC</p>
            </div>
            {(detail.paiements || []).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Paiements</p>
                {detail.paiements.map((p) => (
                  <p key={p.id} className="text-xs text-slate-600">
                    {new Date(p.date_paiement).toLocaleDateString('fr-FR')} — {Number(p.montant).toLocaleString()} FC ({p.mode_paiement})
                  </p>
                ))}
              </div>
            )}
            <button onClick={() => setDetail(null)} className="mt-4 w-full rounded-xl border py-2 text-sm">Fermer</button>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={payer} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Payer la facture</h3>
            <p className="mt-1 text-sm text-slate-500">{payModal.numero_facture} — {Number(payModal.reste_a_payer).toLocaleString()} FC</p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Opérateur</span>
                <select value={payForm.mode} onChange={(e) => setPayForm((f) => ({ ...f, mode: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm">
                  <option value="airtel_money">Airtel Money</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Téléphone</span>
                <input type="tel" required placeholder="+243..." value={payForm.telephone}
                  onChange={(e) => setPayForm((f) => ({ ...f, telephone: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm" />
              </label>
            </div>
            <p className="mt-3 text-xs text-slate-400">Mode démo : paiement simulé automatiquement.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setPayModal(null)} className="flex-1 rounded-xl border py-2.5 text-sm">Annuler</button>
              <button type="submit" disabled={paying} className="flex-1 rounded-xl bg-medical-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {paying ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
