import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Icon from '../../components/Icon';
import api from '../../services/api';
import { ROLE_THEMES } from '../../constants/roleThemes';

const T = ROLE_THEMES.admin;

function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `Il y a ${h} h`;
  return d.toLocaleDateString('fr-FR');
}

function activityIcon(type) {
  if (type?.includes('rdv')) return { icon: 'calendar', color: 'bg-blue-100 text-blue-700' };
  if (type?.includes('paiement') || type?.includes('facture')) return { icon: 'banknote', color: 'bg-amber-100 text-amber-700' };
  if (type?.includes('urgence')) return { icon: 'siren', color: 'bg-red-100 text-red-700' };
  if (type?.includes('resultat') || type?.includes('labo')) return { icon: 'microscope', color: 'bg-violet-100 text-violet-700' };
  return { icon: 'user', color: 'bg-emerald-100 text-emerald-700' };
}

function BarChart({ data }) {
  const rows = Array.isArray(data) && data.length ? data : [];
  const max = Math.max(1, ...rows.map((w) => Number(w.total || w.rdv || 0)));

  if (!rows.length) {
    return <p className="py-8 text-center text-sm text-slate-400">Aucune donnée</p>;
  }

  return (
    <div className="flex h-28 items-end gap-2">
      {rows.map((w) => {
        const val = Number(w.total ?? w.rdv ?? 0);
        return (
          <div key={w.date || w.jour} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-slate-500">{val}</span>
            <div
              className="w-full rounded-t-lg transition-all duration-700"
              style={{
                height: `${(val / max) * 80}px`,
                background: `linear-gradient(to top, ${T.accent}, #7EB0D4)`,
              }}
            />
            <span className="text-[10px] capitalize text-slate-400">{w.jour}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then((r) => setStats(r.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const recouvrement = stats?.montant_facture > 0
    ? Math.round((stats.montant_paye / stats.montant_facture) * 100)
    : 0;

  const weekly = stats?.rdv_semaine || [];
  const activite = stats?.activite_recente || [];
  const depts = stats?.rdv_par_departement || [];
  const topMedecins = stats?.top_medecins || [];
  const maxDept = Math.max(1, ...depts.map((d) => Number(d.total || 0)));

  const CARDS = [
    { icon: 'users', label: 'Patients', value: stats?.patients_total ?? '—', color: 'border-l-4 border-l-blue-500', to: '/admin/patients' },
    { icon: 'calendar', label: 'RDV du jour', value: stats?.rdv_du_jour ?? '—', color: 'border-l-4 border-l-emerald-500', to: '/admin/rendez-vous' },
    { icon: 'doctor', label: 'Utilisateurs', value: stats?.users_total ?? '—', color: 'border-l-4 border-l-violet-500', to: '/admin/utilisateurs' },
    {
      icon: 'banknote',
      label: 'Recettes (FC)',
      value: stats?.montant_paye != null ? Number(stats.montant_paye).toLocaleString('fr-FR') : '—',
      color: 'border-l-4 border-l-amber-500',
      to: '/admin/facturation',
    },
  ];

  return (
    <Layout title="Administration">
      <div className="mb-6">
        <h2 className="font-admin-display text-3xl" style={{ color: T.titleColor }}>Tableau de bord</h2>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CARDS.map((c) => (
              <Link
                key={c.label}
                to={c.to}
                aria-label={`Voir ${c.label}`}
                className={`group block rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-medical-primary ${c.color}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 group-hover:text-slate-700">{c.label}</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{c.value}</p>
                  </div>
                  <Icon name={c.icon} className="h-7 w-7 text-slate-400 transition group-hover:text-slate-600" />
                </div>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-1">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">RDV (7 jours)</h3>
                <span className="text-xs text-slate-400">
                  {weekly.reduce((a, b) => a + Number(b.total || 0), 0)}
                </span>
              </div>
              <BarChart data={weekly} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-2">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-slate-900">Activité récente</h3>
              </div>
              <div className="max-h-64 divide-y divide-slate-50 overflow-y-auto">
                {activite.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-400">Aucune activité</p>
                ) : activite.map((a) => {
                  const meta = activityIcon(a.type);
                  return (
                    <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                      <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${meta.color}`}>
                        <Icon name={meta.icon} className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700">{a.titre || a.message}</p>
                        {a.message && a.titre ? (
                          <p className="truncate text-xs text-slate-400">{a.message}</p>
                        ) : null}
                        <p className="text-xs text-slate-400">{timeAgo(a.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-900">Charge par département</h3>
              <div className="space-y-3">
                {depts.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune donnée</p>
                ) : depts.map((d) => {
                  const pct = Math.round((Number(d.total) / maxDept) * 100);
                  return (
                    <div key={d.departement}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-slate-700">{d.departement}</span>
                        <span className="text-xs font-semibold text-slate-500">{d.total} RDV</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-medical-primary to-cyan-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-slate-900">Médecins les plus actifs</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {topMedecins.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-400">Aucune donnée</p>
                ) : topMedecins.map((m, i) => (
                  <div key={m.id || m.name} className="flex items-center gap-3 px-5 py-3">
                    <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-orange-400'}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.specialite || m.departement || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{m.consultations}</p>
                      <p className="text-[10px] text-slate-400">RDV</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Recouvrement</p>
                <p className="mt-1 text-3xl font-extrabold">
                  {Number(stats?.montant_paye || 0).toLocaleString('fr-FR')} FC
                </p>
                <p className="text-sm text-slate-400">
                  sur {Number(stats?.montant_facture || 0).toLocaleString('fr-FR')} FC facturés
                </p>
              </div>
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="2.5" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="url(#gradAdmin)" strokeWidth="2.5"
                      strokeDasharray={`${recouvrement} ${100 - recouvrement}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradAdmin" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0070C0" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute text-xl font-extrabold">{recouvrement}%</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/statistiques" className="text-sm text-cyan-300 hover:underline">
                Voir les statistiques détaillées →
              </Link>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
