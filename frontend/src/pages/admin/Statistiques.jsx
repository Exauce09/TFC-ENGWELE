import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function AdminStatistiques() {
  const [stats, setStats] = useState(null);
  const [facturation, setFacturation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard/stats'),
      api.get('/admin/facturation'),
    ])
      .then(([sRes, fRes]) => {
        setStats(sRes.data.data);
        setFacturation(fRes.data.meta);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n ?? 0).toLocaleString('fr-FR');
  const recouvrement = stats?.montant_facture > 0
    ? Math.round((stats.montant_paye / stats.montant_facture) * 100)
    : 0;

  return (
    <Layout title="Statistiques">
      <h2 className="mb-2 text-2xl font-bold text-slate-900">Statistiques & reporting</h2>
      <p className="mb-6 text-sm text-slate-500">Indicateurs clés du Centre Médical AMEN (données réelles API).</p>

      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Patients', value: stats?.patients_total, icon: '👥' },
              { label: 'Utilisateurs', value: stats?.users_total, icon: '🔐' },
              { label: 'RDV total', value: stats?.rdv_total, icon: '📅' },
              { label: 'RDV du jour', value: stats?.rdv_du_jour, icon: '🗓️' },
              { label: 'RDV en attente', value: stats?.rdv_en_attente, icon: '⏳' },
              { label: 'Demandes RDV nouvelles', value: stats?.demandes_nouvelles, icon: '📩' },
              { label: 'Factures émises', value: facturation?.total, icon: '🧾' },
              { label: 'Recouvrement', value: `${recouvrement}%`, icon: '💰' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-2xl">{s.icon}</p>
                <p className="mt-2 text-2xl font-bold">{s.value ?? '—'}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">Finances</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-slate-500">Montant facturé</dt>
                  <dd className="font-semibold">{fmt(stats?.montant_facture)} FC</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-slate-500">Montant encaissé</dt>
                  <dd className="font-semibold text-emerald-600">{fmt(stats?.montant_paye)} FC</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Reste à recouvrer</dt>
                  <dd className="font-semibold text-amber-600">{fmt(facturation?.montant_impaye)} FC</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">Barre de recouvrement</h3>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-medical-primary to-emerald-500 transition-all"
                  style={{ width: `${recouvrement}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-600">{recouvrement}% des factures encaissées</p>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
