import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

// ── demo data ─────────────────────────────────────────────────────────────────

const DEMO_STATS = {
  users_total: 25,
  patients_total: 340,
  rdv_total: 1280,
  rdv_du_jour: 18,
  montant_facture: 25400000,
  montant_paye: 20150000,
};

const ACTIVITE_RECENTE = [
  { id: 1, type: 'rdv', msg: 'Nouveau RDV — Angélique T. avec Dr. Kabila', time: 'Il y a 5 min', icon: '📅', color: 'bg-blue-100 text-blue-700' },
  { id: 2, type: 'patient', msg: 'Nouveau patient inscrit — Marcel Nkolo', time: 'Il y a 12 min', icon: '👤', color: 'bg-emerald-100 text-emerald-700' },
  { id: 3, type: 'paiement', msg: 'Paiement reçu — FAC-2026-00078 · 45 000 FC', time: 'Il y a 28 min', icon: '💵', color: 'bg-amber-100 text-amber-700' },
  { id: 4, type: 'urgence', msg: 'Patient urgence admis — Salle 3', time: 'Il y a 45 min', icon: '🚨', color: 'bg-red-100 text-red-700' },
  { id: 5, type: 'labo', msg: 'Résultats labo disponibles — Pierre M.', time: 'Il y a 1h', icon: '🔬', color: 'bg-violet-100 text-violet-700' },
  { id: 6, type: 'rdv', msg: 'RDV annulé — Christelle I. (15h00)', time: 'Il y a 1h20', icon: '❌', color: 'bg-slate-100 text-slate-600' },
];

const DEPTS = [
  { nom: 'Médecine Générale', rdv: 24, pct: 88 },
  { nom: 'Maternité', rdv: 18, pct: 72 },
  { nom: 'Laboratoire', rdv: 32, pct: 95 },
  { nom: 'Gynécologie', rdv: 14, pct: 60 },
  { nom: 'Pédiatrie', rdv: 20, pct: 78 },
  { nom: 'Urgences', rdv: 11, pct: 45 },
];

const MEDECINS_TOP = [
  { name: 'Dr. Jean-Pierre Kabila', specialite: 'Médecine Interne', consultations: 38, img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=60&q=80' },
  { name: 'Dr. Esperance Mbuyi', specialite: 'Gynécologie', consultations: 29, img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=60&q=80' },
  { name: 'Dr. Celestine Nkosi', specialite: 'Pédiatrie', consultations: 24, img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=60&q=80' },
  { name: 'Dr. François Mutombo', specialite: 'Chirurgie', consultations: 19, img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=60&q=80' },
];

// ── mini bar chart ────────────────────────────────────────────────────────────

const WEEKLY = [
  { jour: 'Lun', rdv: 22 },
  { jour: 'Mar', rdv: 30 },
  { jour: 'Mer', rdv: 18 },
  { jour: 'Jeu', rdv: 35 },
  { jour: 'Ven', rdv: 28 },
  { jour: 'Sam', rdv: 14 },
];
const MAX_RDV = Math.max(...WEEKLY.map(w => w.rdv));

function BarChart() {
  return (
    <div className="flex items-end gap-2 h-28">
      {WEEKLY.map(w => (
        <div key={w.jour} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-slate-500">{w.rdv}</span>
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-medical-primary to-cyan-400 transition-all duration-700"
            style={{ height: `${(w.rdv / MAX_RDV) * 80}px` }}
          />
          <span className="text-[10px] text-slate-400">{w.jour}</span>
        </div>
      ))}
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState(DEMO_STATS);

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then(r => setStats(r.data.data))
      .catch(() => {});
  }, []);

  const recouvrement = stats.montant_facture > 0
    ? Math.round((stats.montant_paye / stats.montant_facture) * 100)
    : 0;

  const CARDS = [
    { icon: '👥', label: 'Patients enregistrés', value: stats.patients_total, delta: '+12 ce mois', color: 'border-l-4 border-l-blue-500' },
    { icon: '📅', label: 'RDV du jour', value: stats.rdv_du_jour, delta: `sur ${stats.rdv_total} total`, color: 'border-l-4 border-l-emerald-500' },
    { icon: '👨‍⚕️', label: 'Utilisateurs actifs', value: stats.users_total, delta: 'personnel + patients', color: 'border-l-4 border-l-violet-500' },
    { icon: '💵', label: 'Recettes (FC)', value: stats.montant_paye?.toLocaleString(), delta: `${recouvrement}% recouvré`, color: 'border-l-4 border-l-amber-500' },
  ];

  return (
    <Layout title="Administration Générale">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tableau de bord Admin 📊</h2>
          <p className="mt-1 text-sm text-slate-500">Vue d'ensemble du Centre Médical AMEN</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition">
            📥 Exporter
          </button>
          <button className="rounded-full bg-medical-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5">
            + Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map(c => (
          <div key={c.label} className={`rounded-2xl bg-white p-5 shadow-sm ${c.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{c.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{c.value}</p>
                <p className="mt-0.5 text-xs text-emerald-600">{c.delta}</p>
              </div>
              <span className="text-3xl">{c.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Graphique RDV semaine */}
        <div className="lg:col-span-1 rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">RDV cette semaine</h3>
            <span className="text-xs text-slate-400">Total: {WEEKLY.reduce((a, b) => a + b.rdv, 0)}</span>
          </div>
          <BarChart />
        </div>

        {/* Activité récente */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Activité récente</h3>
            <button className="text-xs text-medical-primary hover:underline">Voir tout</button>
          </div>
          <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
            {ACTIVITE_RECENTE.map(a => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition">
                <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm ${a.color}`}>{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{a.msg}</p>
                  <p className="text-xs text-slate-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Charge par département */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Charge par département</h3>
          <div className="space-y-3">
            {DEPTS.map(d => (
              <div key={d.nom}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700">{d.nom}</span>
                  <span className="text-xs font-semibold text-slate-500">{d.rdv} RDV · {d.pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-medical-primary to-cyan-400 transition-all duration-700"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top médecins */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Médecins les plus actifs</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {MEDECINS_TOP.map((m, i) => (
              <div key={m.name} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition">
                <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-orange-400'}`}>
                  {i + 1}
                </span>
                <img src={m.img} alt={m.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{m.name}</p>
                  <p className="text-xs text-slate-400">{m.specialite}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{m.consultations}</p>
                  <p className="text-[10px] text-slate-400">consultations</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recouvrement financier */}
      <div className="mt-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Recouvrement financier</p>
            <p className="mt-1 text-3xl font-extrabold">{stats.montant_paye?.toLocaleString()} FC</p>
            <p className="text-sm text-slate-400">sur {stats.montant_facture?.toLocaleString()} FC facturés</p>
          </div>
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="2.5" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="url(#grad)" strokeWidth="2.5"
                  strokeDasharray={`${recouvrement} ${100 - recouvrement}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0070C0" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute text-xl font-extrabold">{recouvrement}%</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">taux de recouvrement</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
