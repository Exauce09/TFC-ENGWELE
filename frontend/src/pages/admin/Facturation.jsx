import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const STATUT_STYLES = {
  emise: 'bg-amber-100 text-amber-700',
  partiellement_payee: 'bg-orange-100 text-orange-700',
  payee: 'bg-emerald-100 text-emerald-700',
  annulee: 'bg-red-100 text-red-700',
};

export default function AdminFacturation() {
  const [factures, setFactures] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter ? { statut: filter } : {};
    api.get('/admin/facturation', { params })
      .then((r) => {
        setFactures(r.data.data || []);
        setMeta(r.data.meta || null);
      })
      .catch(() => setFactures([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const fmt = (n) => Number(n ?? 0).toLocaleString('fr-FR');

  return (
    <Layout title="Facturation">
      <h2 className="mb-2 text-2xl font-bold text-slate-900">Facturation globale</h2>
      <p className="mb-6 text-sm text-slate-500">Vue d'ensemble du recouvrement hospitalier.</p>

      {meta && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Montant facturé', value: `${fmt(meta.montant_total)} FC` },
            { label: 'Montant encaissé', value: `${fmt(meta.montant_paye)} FC` },
            { label: 'Reste à recouvrer', value: `${fmt(meta.montant_impaye)} FC`, alert: meta.montant_impaye > 0 },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border p-5 ${s.alert ? 'border-amber-200 bg-amber-50' : 'bg-white'}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
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
            <article key={f.id} className="flex flex-col gap-2 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{f.numero_facture}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUT_STYLES[f.statut]}`}>
                    {f.statut?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{f.patient?.user?.name}</p>
                <p className="text-xs text-slate-400">{new Date(f.date_facture).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold">{fmt(f.montant_total)} FC</p>
                <p className="text-slate-500">Payé : {fmt(f.montant_paye)} FC</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
