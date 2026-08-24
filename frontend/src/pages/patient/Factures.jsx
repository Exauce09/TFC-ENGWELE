import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Icon from '../../components/Icon';
import api from '../../services/api';
import {
  downloadDocx,
  downloadPdf,
  factureDocxChildren,
  facturePrintBody,
  printHtml,
} from '../../utils/printDoc';

const STATUT_STYLES = {
  emise: 'bg-amber-100 text-amber-800',
  partiellement_payee: 'bg-orange-100 text-orange-800',
  payee: 'bg-emerald-100 text-emerald-800',
  annulee: 'bg-slate-100 text-slate-600',
};

const STATUT_LABELS = {
  emise: 'À payer',
  partiellement_payee: 'Partiellement payée',
  payee: 'Payée',
  annulee: 'Annulée',
};

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'a_payer', label: 'À payer' },
  { key: 'payees', label: 'Payées' },
];

function isAPayer(f) {
  return ['emise', 'partiellement_payee'].includes(f.statut);
}

function formatFc(n) {
  return `${Number(n || 0).toLocaleString('fr-FR')} FC`;
}

export default function PatientFactures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('a_payer');
  const [detail, setDetail] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ mode: 'airtel_money', telephone: '' });
  const [paying, setPaying] = useState(false);
  const [busyId, setBusyId] = useState(null);

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

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(() => {
    const aPayer = factures.filter(isAPayer).length;
    const payees = factures.filter((f) => f.statut === 'payee').length;
    return { all: factures.length, a_payer: aPayer, payees };
  }, [factures]);

  const filtered = useMemo(() => {
    if (filter === 'a_payer') return factures.filter(isAPayer);
    if (filter === 'payees') return factures.filter((f) => f.statut === 'payee');
    return factures;
  }, [factures, filter]);

  const totals = useMemo(() => {
    const reste = factures.filter(isAPayer).reduce((s, f) => s + Number(f.reste_a_payer || 0), 0);
    const paye = factures.reduce((s, f) => s + Number(f.montant_paye || 0), 0);
    return { reste, paye };
  }, [factures]);

  // Si le filtre par défaut est vide, basculer sur « Toutes »
  useEffect(() => {
    if (!loading && filter === 'a_payer' && counts.a_payer === 0 && counts.all > 0) {
      setFilter('all');
    }
  }, [loading, filter, counts]);

  const openDetail = async (id) => {
    try {
      const res = await api.get(`/patient/factures/${id}`);
      setDetail(res.data.data);
    } catch {
      setDetail(null);
    }
  };

  const resolveFacture = async (f) => {
    try {
      const res = await api.get(`/patient/factures/${f.id}`);
      return res.data.data || f;
    } catch {
      return f;
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

  const imprimerFacture = async (f) => {
    setBusyId(f.id);
    try {
      const full = await resolveFacture(f);
      printHtml(`Facture ${full.numero_facture}`, facturePrintBody(full));
    } finally {
      setBusyId(null);
    }
  };

  const telechargerPdf = async (f) => {
    setBusyId(f.id);
    try {
      const full = await resolveFacture(f);
      await downloadPdf(
        `${full.numero_facture || 'facture'}.pdf`,
        `Facture ${full.numero_facture}`,
        facturePrintBody(full),
      );
    } finally {
      setBusyId(null);
    }
  };

  const telechargerWord = async (f) => {
    setBusyId(f.id);
    try {
      const full = await resolveFacture(f);
      await downloadDocx(`${full.numero_facture || 'facture'}.docx`, () => factureDocxChildren(full));
    } finally {
      setBusyId(null);
    }
  };

  const description = (f) => f.lignes?.map((l) => l.description).join(', ') || 'Facture hospitalière';

  return (
    <Layout title="Mes Factures">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mes factures</h2>
          <p className="text-sm text-slate-500">Consultez, imprimez et payez vos factures hospitalières.</p>
        </div>
        {!loading && factures.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="rounded-xl border bg-white px-4 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Reste à payer</p>
              <p className="font-bold text-amber-700">{formatFc(totals.reste)}</p>
            </div>
            <div className="rounded-xl border bg-white px-4 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Déjà payé</p>
              <p className="font-bold text-emerald-700">{formatFc(totals.paye)}</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {!loading && factures.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filter === f.key
                  ? 'bg-medical-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-80">({counts[f.key]})</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : factures.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <Icon name="receipt" className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">Aucune facture</p>
          <Link to="/patient/dashboard" className="mt-4 inline-block text-sm text-medical-primary hover:underline">
            Retour au tableau de bord
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">
          Aucune facture dans cette catégorie.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const busy = busyId === f.id;
            return (
              <article
                key={f.id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <button
                    type="button"
                    onClick={() => openDetail(f.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-bold text-slate-900">{f.numero_facture}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STATUT_STYLES[f.statut] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {STATUT_LABELS[f.statut] || f.statut?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{description(f)}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {f.date_facture
                        ? new Date(f.date_facture).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '—'}
                      <span className="ml-2 text-medical-primary underline-offset-2 hover:underline">
                        Voir le détail
                      </span>
                    </p>
                  </button>

                  <div className="shrink-0 text-left lg:min-w-[140px] lg:text-right">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Total</p>
                    <p className="text-lg font-bold text-slate-900">{formatFc(f.montant_total)}</p>
                    {Number(f.reste_a_payer) > 0 ? (
                      <p className="text-xs font-semibold text-amber-600">
                        Reste : {formatFc(f.reste_a_payer)}
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-600">Soldée</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  {isAPayer(f) && (
                    <button
                      type="button"
                      onClick={() => setPayModal(f)}
                      className="rounded-xl bg-medical-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                    >
                      Payer
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void imprimerFacture(f)}
                    className="rounded-xl border px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Imprimer
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void telechargerPdf(f)}
                    className="rounded-xl border px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void telechargerWord(f)}
                    className="rounded-xl border px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Word
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold">{detail.numero_facture}</h3>
                <p className="text-sm text-slate-500">
                  {detail.date_facture
                    ? new Date(detail.date_facture).toLocaleDateString('fr-FR')
                    : '—'}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  STATUT_STYLES[detail.statut] ?? 'bg-slate-100'
                }`}
              >
                {STATUT_LABELS[detail.statut] || detail.statut?.replace(/_/g, ' ')}
              </span>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-2">Description</th>
                  <th>Qté</th>
                  <th className="text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {(detail.lignes || []).map((l, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2">{l.description}</td>
                    <td>{l.quantite}</td>
                    <td className="text-right">{formatFc(l.quantite * l.prix_unitaire)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 space-y-1 text-sm">
              <p>Sous-total : {formatFc(detail.sous_total)}</p>
              {detail.remise > 0 && <p>Remise : -{formatFc(detail.remise)}</p>}
              <p className="font-bold">Total : {formatFc(detail.montant_total)}</p>
              <p className="text-emerald-600">Payé : {formatFc(detail.montant_paye)}</p>
              {Number(detail.reste_a_payer) > 0 && (
                <p className="font-semibold text-amber-600">Reste : {formatFc(detail.reste_a_payer)}</p>
              )}
            </div>
            {(detail.paiements || []).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Paiements</p>
                {detail.paiements.map((p) => (
                  <p key={p.id} className="text-xs text-slate-600">
                    {new Date(p.date_paiement).toLocaleDateString('fr-FR')} — {formatFc(p.montant)} (
                    {p.mode_paiement})
                  </p>
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {isAPayer(detail) && (
                <button
                  type="button"
                  onClick={() => {
                    setPayModal(detail);
                    setDetail(null);
                  }}
                  className="rounded-xl bg-medical-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Payer
                </button>
              )}
              <button
                type="button"
                onClick={() => printHtml(`Facture ${detail.numero_facture}`, facturePrintBody(detail))}
                className="rounded-xl border px-3 py-2 text-xs font-bold"
              >
                Imprimer
              </button>
              <button
                type="button"
                onClick={() =>
                  void downloadPdf(
                    `${detail.numero_facture}.pdf`,
                    `Facture ${detail.numero_facture}`,
                    facturePrintBody(detail),
                  )
                }
                className="rounded-xl border px-3 py-2 text-xs font-bold"
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() =>
                  void downloadDocx(`${detail.numero_facture}.docx`, () => factureDocxChildren(detail))
                }
                className="rounded-xl border px-3 py-2 text-xs font-bold"
              >
                Word
              </button>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="ml-auto rounded-xl border px-3 py-2 text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={payer} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Payer la facture</h3>
            <p className="mt-1 text-sm text-slate-500">
              {payModal.numero_facture} — {formatFc(payModal.reste_a_payer)}
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Opérateur</span>
                <select
                  value={payForm.mode}
                  onChange={(e) => setPayForm((f) => ({ ...f, mode: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                >
                  <option value="airtel_money">Airtel Money</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Téléphone</span>
                <input
                  type="tel"
                  required
                  placeholder="+243..."
                  value={payForm.telephone}
                  onChange={(e) => setPayForm((f) => ({ ...f, telephone: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-slate-400">Mode démo : paiement simulé automatiquement.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setPayModal(null)} className="flex-1 rounded-xl border py-2.5 text-sm">
                Annuler
              </button>
              <button
                type="submit"
                disabled={paying}
                className="flex-1 rounded-xl bg-medical-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {paying ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
