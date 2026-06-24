import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUT_COLORS = {
  confirme: 'bg-emerald-100 text-emerald-700',
  en_attente: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-blue-100 text-blue-700',
  termine: 'bg-slate-100 text-slate-600',
  annule: 'bg-red-100 text-red-700',
  absent: 'bg-orange-100 text-orange-700',
};

const DEMO_RDV = [
  { id: 1, date_rdv: '2026-06-25', heure_rdv: '10:00', statut: 'confirme', type: 'presentiel', medecin: { user: { name: 'Dr. Jean-Pierre Kabila' } }, departement: 'Médecine Interne', motif: 'Consultation de suivi' },
  { id: 2, date_rdv: '2026-06-28', heure_rdv: '14:30', statut: 'en_attente', type: 'presentiel', medecin: { user: { name: 'Dr. Esperance Mbuyi' } }, departement: 'Gynécologie', motif: 'Visite prénatale' },
  { id: 3, date_rdv: '2026-06-15', heure_rdv: '09:00', statut: 'termine', type: 'teleconsultation', medecin: { user: { name: 'Dr. Celestine Nkosi' } }, departement: 'Pédiatrie', motif: 'Fièvre persistante' },
];

const DEMO_PRESCRIPTIONS = [
  { id: 1, date_prescription: '2026-06-15', statut: 'active', medicaments: [{ nom: 'Amoxicilline', dosage: '500mg', frequence: '3×/jour', duree: '7 jours' }, { nom: 'Paracétamol', dosage: '1000mg', frequence: '2×/jour', duree: '5 jours' }], medecin: 'Dr. Kabila' },
  { id: 2, date_prescription: '2026-05-20', statut: 'expiree', medicaments: [{ nom: 'Ibuprofène', dosage: '400mg', frequence: '3×/jour', duree: '5 jours' }], medecin: 'Dr. Nkosi' },
];

const DEMO_DOSSIER = [
  { id: 1, date_consultation: '2026-06-15', departement: 'Médecine Interne', motif: 'Fièvre et douleurs articulaires', diagnostic: 'Grippe saisonnière', medecin: 'Dr. Kabila' },
  { id: 2, date_consultation: '2026-05-10', departement: 'Gynécologie', motif: 'Consultation de routine', diagnostic: 'Etat de santé satisfaisant', medecin: 'Dr. Mbuyi' },
];

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${color ?? ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function Badge({ statut }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUT_COLORS[statut] ?? 'bg-slate-100 text-slate-600'}`}>
      {statut?.replace('_', ' ')}
    </span>
  );
}

// ── dashboard ─────────────────────────────────────────────────────────────────

export default function PatientDashboard() {
  const { user } = useAuth();
  const [rdv, setRdv] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [factures, setFactures] = useState([]);
  const [tab, setTab] = useState('rdv');

  useEffect(() => {
    api.get('/patient/rendez-vous').then((res) => setRdv(res.data.data || [])).catch(() => setRdv(DEMO_RDV));
    api.get('/patient/dossier').then((res) => setDossiers(res.data.data?.consultations || [])).catch(() => setDossiers(DEMO_DOSSIER));
    api.get('/patient/prescriptions').then((res) => setPrescriptions(res.data.data || [])).catch(() => setPrescriptions(DEMO_PRESCRIPTIONS));
    api.get('/patient/factures').then((res) => setFactures(res.data.data || [])).catch(() => setFactures([]));
  }, []);

  const prochainRdv = rdv.filter(r => ['confirme', 'en_attente'].includes(r.statut));
  const facturesImpayees = factures.filter(f => ['emise', 'partiellement_payee'].includes(f.statut)).length;
  const prescriptionsActives = prescriptions.filter(p => p.statut === 'active').length;

  return (
    <Layout title="Mon Espace Patient">
      {/* Welcome */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bonjour, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="mt-1 text-sm text-slate-500">Voici un aperçu de votre santé aujourd'hui.</p>
        </div>
        <Link
          to="/patient/rendez-vous"
          className="rounded-full bg-medical-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5"
        >
          📅 Nouveau rendez-vous
        </Link>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="📅" label="Prochains RDV" value={prochainRdv.length} sub="rendez-vous à venir" />
        <StatCard icon="💊" label="Prescriptions actives" value={prescriptionsActives} sub="en cours de traitement" />
        <StatCard icon="🧾" label="Factures impayées" value={facturesImpayees} sub="en attente de paiement" />
        <StatCard icon="📋" label="Consultations" value={dossiers.length} sub="dans votre dossier" />
      </div>

      {/* Prochain RDV */}
      {prochainRdv[0] && (
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-medical-primary to-cyan-500 p-5 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Prochain rendez-vous</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-bold">{prochainRdv[0].medecin?.user?.name}</p>
              <p className="text-sm opacity-90">{prochainRdv[0].departement}</p>
              <p className="mt-1 text-sm opacity-75">{prochainRdv[0].motif}</p>
            </div>
            <div className="rounded-xl bg-white/20 px-5 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-extrabold">{prochainRdv[0].heure_rdv}</p>
              <p className="text-xs opacity-80">{new Date(prochainRdv[0].date_rdv).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {[
            { key: 'rdv', label: '📅 Rendez-vous' },
            { key: 'dossier', label: '📋 Dossier médical' },
            { key: 'prescriptions', label: '💊 Prescriptions' },
            { key: 'factures', label: '🧾 Factures' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap px-5 py-3.5 text-sm font-medium transition border-b-2 ${tab === t.key ? 'border-medical-primary text-medical-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* RDV */}
          {tab === 'rdv' && (
            <div className="space-y-3">
              {rdv.map(r => (
                <div key={r.id} className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition">
                  <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-center">
                    <span className="text-xs font-bold text-medical-primary">{new Date(r.date_rdv).toLocaleDateString('fr-FR', { day: '2-digit' })}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{new Date(r.date_rdv).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{r.medecin?.user?.name}</p>
                    <p className="text-xs text-slate-500">{r.departement} · {r.heure_rdv} · {r.type === 'teleconsultation' ? '📹 Téléconsultation' : '🏥 Présentiel'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.motif}</p>
                  </div>
                  <Badge statut={r.statut} />
                </div>
              ))}
            </div>
          )}

          {/* Dossier */}
          {tab === 'dossier' && (
            <div className="space-y-3">
              {dossiers.map(d => (
                <div key={d.id} className="rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{d.motif}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{d.departement?.nom} · {d.medecin?.user?.name}</p>
                      <p className="text-xs text-slate-400">{new Date(d.date_consultation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  {d.diagnostics?.[0] && (
                    <div className="mt-3 rounded-lg bg-emerald-50 p-3">
                      <p className="text-xs font-semibold text-emerald-700">Diagnostic</p>
                      <p className="text-sm text-slate-700 mt-0.5">{d.diagnostics[0].libelle}</p>
                    </div>
                  )}
                </div>
              ))}
              <Link to="/patient/dossier" className="block text-center text-sm text-medical-primary font-medium hover:underline">
                Voir le dossier complet →
              </Link>
            </div>
          )}

          {/* Prescriptions */}
          {tab === 'prescriptions' && (
            <div className="space-y-4">
              {prescriptions.map(p => (
                <div key={p.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">Prescription du {new Date(p.date_prescription).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-slate-500">Par {p.medecin?.user?.name || p.medecin}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.statut === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.statut}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {p.medicaments.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                        <span className="text-xl">💊</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{m.nom} {m.dosage}</p>
                          <p className="text-xs text-slate-500">{m.frequence} · {m.duree}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Factures */}
          {tab === 'factures' && (
            <div className="space-y-3">
              {factures.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-6">Aucune facture.</p>
              ) : factures.map(f => (
                <div key={f.id} className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{f.numero_facture}</p>
                    <p className="text-xs text-slate-500">{f.lignes?.map((l) => l.description).join(', ')}</p>
                    <p className="text-xs text-slate-400">{new Date(f.date_facture).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{Number(f.montant_total).toLocaleString()} FC</p>
                    <p className="text-xs text-slate-400">Payé: {Number(f.montant_paye).toLocaleString()} FC</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${f.statut === 'payee' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {f.statut?.replace(/_/g, ' ')}
                    </span>
                    {['emise', 'partiellement_payee'].includes(f.statut) && (
                      <Link to="/patient/factures" className="rounded-full bg-medical-primary px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition">
                        Payer
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              <Link to="/patient/factures" className="block text-center text-sm text-medical-primary font-medium hover:underline">
                Voir toutes les factures →
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
