import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function WeekChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex h-32 items-end gap-2">
      {data.map((d) => (
        <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-slate-500">{d.total}</span>
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-medical-primary to-cyan-400"
            style={{ height: `${(d.total / max) * 80}px` }}
          />
          <span className="text-[10px] text-slate-400 capitalize">{d.jour}</span>
        </div>
      ))}
    </div>
  );
}

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

  const rdvStatuts = stats?.rdv_par_statut
    ? Object.entries(stats.rdv_par_statut)
    : [];

  const maxDept = Math.max(...(stats?.rdv_par_departement?.map((d) => d.total) ?? [1]), 1);

  return (
    <Layout title="Statistiques">
      <h2 className="mb-2 text-2xl font-bold text-slate-900">Statistiques & reporting</h2>
      <p className="mb-6 text-sm text-slate-500">Indicateurs clés du Centre Médical AMEN (données API en temps réel).</p>

      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Patients', value: stats?.patients_total, icon: '👥' },
              { label: 'Médecins', value: stats?.medecins_total, icon: '👨‍⚕️' },
              { label: 'Utilisateurs', value: stats?.users_total, icon: '🔐' },
              { label: 'RDV total', value: stats?.rdv_total, icon: '📅' },
              { label: 'RDV du jour', value: stats?.rdv_du_jour, icon: '🗓️' },
              { label: 'RDV en attente', value: stats?.rdv_en_attente, icon: '⏳' },
              { label: 'Demandes RDV', value: stats?.demandes_nouvelles, icon: '📩' },
              { label: 'Recouvrement', value: `${recouvrement}%`, icon: '💰' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-2xl">{s.icon}</p>
                <p className="mt-2 text-2xl font-bold">{s.value ?? '—'}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-1">
              <h3 className="font-bold text-slate-900">RDV — 7 derniers jours</h3>
              <div className="mt-4">
                <WeekChart data={stats?.rdv_semaine || []} />
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-1">
              <h3 className="font-bold text-slate-900">RDV par statut</h3>
              <div className="mt-4 space-y-2">
                {rdvStatuts.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune donnée</p>
                ) : rdvStatuts.map(([statut, total]) => (
                  <div key={statut} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-600">{statut.replace(/_/g, ' ')}</span>
                    <span className="font-semibold">{total}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-1">
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
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-medical-primary to-emerald-500"
                  style={{ width: `${recouvrement}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{recouvrement}% encaissé</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">Charge par département</h3>
              <div className="mt-4 space-y-3">
                {(stats?.rdv_par_departement || []).map((d) => (
                  <div key={d.departement}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-700">{d.departement}</span>
                      <span className="font-semibold text-slate-500">{d.total} RDV</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-medical-primary to-cyan-400"
                        style={{ width: `${(d.total / maxDept) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="border-b px-6 py-4">
                <h3 className="font-bold text-slate-900">Médecins les plus actifs</h3>
              </div>
              <div className="divide-y">
                {(stats?.top_medecins || []).length === 0 ? (
                  <p className="p-6 text-sm text-slate-400">Aucun médecin</p>
                ) : (stats?.top_medecins || []).map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 px-6 py-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${i === 0 ? 'bg-amber-500' : 'bg-slate-400'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.specialite} · {m.departement}</p>
                    </div>
                    <p className="text-sm font-bold">{m.consultations}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-6 py-4">
              <h3 className="font-bold text-slate-900">Activité récente</h3>
            </div>
            <div className="divide-y max-h-72 overflow-y-auto">
              {(stats?.activite_recente || []).length === 0 ? (
                <p className="p-6 text-sm text-slate-400">Aucune activité récente</p>
              ) : (stats?.activite_recente || []).map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-6 py-3">
                  <span className="mt-0.5 text-lg">🔔</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.titre}</p>
                    <p className="text-sm text-slate-600">{a.message}</p>
                    <p className="text-xs text-slate-400">{timeAgo(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
