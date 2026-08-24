import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Icon from '../../components/Icon';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ROLE_THEMES } from '../../constants/roleThemes';
import { downloadDocx, downloadPdf, ordonnanceDocxChildren, ordonnancePrintBody, printHtml } from '../../utils/printDoc';

const T = ROLE_THEMES.patient;

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUT_COLORS = {
  confirme: 'bg-emerald-100 text-emerald-700',
  en_attente: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-blue-100 text-blue-700',
  termine: 'bg-slate-100 text-slate-600',
  annule: 'bg-red-100 text-red-700',
  absent: 'bg-orange-100 text-orange-700',
};

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, to }) {
  const inner = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        {to && <p className="mt-2 text-xs font-semibold text-medical-primary">Voir →</p>}
      </div>
      <Icon name={icon} className="h-7 w-7 text-slate-400" />
    </div>
  );
  const cls = `rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${color ?? ''}`;
  return to ? <Link to={to} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

function Badge({ statut }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUT_COLORS[statut] ?? 'bg-slate-100 text-slate-600'}`}>
      {statut?.replace('_', ' ')}
    </span>
  );
}

function deptLabel(value) {
  if (!value) return '—';
  return typeof value === 'object' ? value.nom : value;
}

// ── dashboard ─────────────────────────────────────────────────────────────────

export default function PatientDashboard() {
  const { user } = useAuth();
  const [rdv, setRdv] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [factures, setFactures] = useState([]);
  const [accueil, setAccueil] = useState(null);
  const [showCreation, setShowCreation] = useState(true);
  const [tab, setTab] = useState('prescriptions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [dashRes, rdvRes, dosRes, rxRes, facRes] = await Promise.allSettled([
          api.get('/patient/dashboard'),
          api.get('/patient/rendez-vous'),
          api.get('/patient/dossier'),
          api.get('/patient/prescriptions'),
          api.get('/patient/factures'),
        ]);
        if (cancelled) return;

        if (dashRes.status === 'fulfilled') {
          const data = dashRes.value.data.data || null;
          setAccueil(data);
          const key = `amen_seen_creation_${data?.numero_patient || user?.id}`;
          if (localStorage.getItem(key) === '1') setShowCreation(false);
        } else {
          setAccueil(null);
        }

        setRdv(rdvRes.status === 'fulfilled' ? (rdvRes.value.data.data || []) : []);
        setDossiers(dosRes.status === 'fulfilled' ? (dosRes.value.data.data?.consultations || []) : []);
        setPrescriptions(rxRes.status === 'fulfilled' ? (rxRes.value.data.data || []) : []);
        setFactures(facRes.status === 'fulfilled' ? (facRes.value.data.data || []) : []);

        const rx = rxRes.status === 'fulfilled' ? (rxRes.value.data.data || []) : [];
        const hasActiveRx = rx.some((p) => p.statut === 'active');
        const hasAdmission = dashRes.status === 'fulfilled' && dashRes.value.data.data?.admission_en_cours;
        if (hasActiveRx || hasAdmission) setTab('prescriptions');
        else if ((dosRes.status === 'fulfilled' ? (dosRes.value.data.data?.consultations || []) : []).length > 0) setTab('dossier');
        else setTab('rdv');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const masquerCreation = () => {
    const key = `amen_seen_creation_${accueil?.numero_patient || user?.id}`;
    localStorage.setItem(key, '1');
    setShowCreation(false);
  };

  const prochainRdv = rdv.filter((r) => ['confirme', 'en_attente'].includes(r.statut));
  const facturesImpayees = factures.filter((f) => ['emise', 'partiellement_payee'].includes(f.statut)).length;
  const prescriptionsActives = prescriptions.filter((p) => p.statut === 'active');
  const prescriptionsDelivrees = prescriptions.filter((p) => p.statut === 'delivree');
  const delivrees = accueil?.ordonnances_delivrees || [];
  const visite = accueil?.admission_en_cours;

  const medLabel = (m) => m.nom_dci || m.nom || m.nom_commercial || 'Médicament';
  const medPosologie = (m) => m.posologie || m.frequence || '—';

  if (loading) {
    return (
      <Layout title="Mon Espace Patient">
        <p className="text-sm text-slate-500">Chargement de votre dossier…</p>
      </Layout>
    );
  }

  return (
    <Layout title="Mon Espace Patient">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-patient-display text-3xl" style={{ color: T.titleColor }}>
            Bonjour, {user?.name?.split(' ')[0]}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {accueil?.numero_patient
              ? `N° patient ${accueil.numero_patient} — Centre Médical AMEN`
              : 'Voici un aperçu de votre santé aujourd’hui.'}
          </p>
        </div>
        <Link
          to="/patient/rendez-vous"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
          style={{ background: T.accent }}
        >
          <Icon name="calendar" className="h-4 w-4" /> Nouveau rendez-vous
        </Link>
      </div>

      {/* Toujours visible : visite / ordonnance en cours */}
      {visite && (
        <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950 shadow-sm">
          <p className="font-bold text-sky-900">Votre visite est en cours</p>
          <p className="mt-1">
            <span className="font-mono font-semibold">{visite.numero_admission}</span>
            {' · '}{visite.statut_label || visite.statut}
            {visite.service ? ` · ${visite.service}` : ''}
          </p>
          {visite.motif && <p className="mt-1 text-sky-800/90">Motif : {visite.motif}</p>}
          {visite.statut === 'prelevement' && (
            <p className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-semibold text-amber-800">
              Étape actuelle : rendez-vous au prélèvement (infirmier), puis au laboratoire pour vos analyses.
            </p>
          )}
          {visite.statut === 'examens_laboratoire' && (
            <p className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-semibold text-amber-800">
              Étape actuelle : analyses en cours au laboratoire. Présentez-vous au labo si on vous le demande.
            </p>
          )}
          {visite.statut === 'diagnostic_prescription' && (
            <p className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-semibold text-amber-800">
              Étape actuelle : attente de la délivrance des médicaments à la pharmacie.
            </p>
          )}
        </div>
      )}

      {showCreation && accueil?.compte_cree && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold text-emerald-900">Votre dossier patient est créé</p>
              <p className="mt-1 text-emerald-800/90">
                {accueil.message_creation || 'Votre dossier a été ouvert à la réception du Centre Médical AMEN.'}
              </p>
              <p className="mt-2 font-mono text-base font-bold tracking-wide text-emerald-900">
                N° patient : {accueil.numero_patient || '—'}
              </p>
            </div>
            <button
              type="button"
              onClick={masquerCreation}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              J&apos;ai compris
            </button>
          </div>
        </div>
      )}

      {prescriptionsActives.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 shadow-sm">
          <p className="font-bold text-amber-900">Ordonnance en attente à la pharmacie</p>
          <p className="mt-1 text-xs text-amber-800">Présentez-vous à la pharmacie interne pour retirer vos médicaments.</p>
          <ul className="mt-3 space-y-2">
            {prescriptionsActives.map((p) => (
              <li key={`${p.source}-${p.id}`} className="rounded-xl border border-amber-100 bg-white px-3 py-2">
                <p className="font-mono text-xs font-bold text-emerald-700">{p.numero_ordonnance || `ORD-${p.id}`}</p>
                <p className="text-xs text-slate-600">
                  {(p.medicaments || []).map((m) => medLabel(m)).join(', ') || 'Médicaments prescrits'}
                </p>
              </li>
            ))}
          </ul>
          <Link to="/patient/dossier" className="mt-3 inline-block text-xs font-semibold text-amber-900 underline">
            Voir le détail des prescriptions →
          </Link>
        </div>
      )}

      {(delivrees.length > 0 || prescriptionsDelivrees.length > 0) && (
        <div className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
          <p className="font-bold text-teal-900">Médicaments déjà délivrés</p>
          <ul className="mt-2 space-y-1 text-xs text-teal-800">
            {(delivrees.length ? delivrees : prescriptionsDelivrees.map((p) => ({
              id: p.id,
              numero_ordonnance: p.numero_ordonnance,
              delivree_at: p.delivree_at || p.updated_at,
            }))).map((o) => (
              <li key={o.id}>
                <span className="font-mono font-semibold">{o.numero_ordonnance}</span>
                {o.delivree_at
                  ? ` — délivré le ${new Date(o.delivree_at).toLocaleString('fr-FR')}`
                  : ' — délivré'}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="calendar" label="Prochains RDV" value={prochainRdv.length} sub="rendez-vous à venir" to="/patient/rendez-vous" />
        <StatCard icon="pill" label="À retirer" value={prescriptionsActives.length} sub="ordonnance(s) pharmacie" to="/patient/dossier" />
        <StatCard icon="receipt" label="Factures impayées" value={facturesImpayees} sub="en attente de paiement" to="/patient/factures" />
        <StatCard icon="clipboard" label="Consultations" value={dossiers.length} sub="dans votre dossier" to="/patient/dossier" />
      </div>

      {/* Prochain RDV */}
      {prochainRdv[0] && (
        <div
          className="mb-6 overflow-hidden rounded-2xl p-5 text-white shadow-xl"
          style={{ background: `linear-gradient(105deg, ${T.sidebarFrom}, ${T.accent})` }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Prochain rendez-vous</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-bold">{prochainRdv[0].medecin?.user?.name}</p>
              <p className="text-sm opacity-90">{deptLabel(prochainRdv[0].departement)}</p>
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
            { key: 'rdv', label: 'Rendez-vous', icon: 'calendar' },
            { key: 'dossier', label: 'Dossier médical', icon: 'clipboard' },
            { key: 'prescriptions', label: 'Prescriptions', icon: 'pill' },
            { key: 'factures', label: 'Factures', icon: 'receipt' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-medium transition border-b-2 ${tab === t.key ? 'border-medical-primary text-medical-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Icon name={t.icon} className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* RDV */}
          {tab === 'rdv' && (
            <div className="space-y-3">
              {rdv.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Aucun rendez-vous pour le moment.</p>
              ) : rdv.map((r) => (
                <div key={r.id} className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50">
                  <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-center">
                    <span className="text-xs font-bold text-medical-primary">{new Date(r.date_rdv).toLocaleDateString('fr-FR', { day: '2-digit' })}</span>
                    <span className="text-[10px] uppercase text-slate-400">{new Date(r.date_rdv).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{r.medecin?.user?.name}</p>
                    <p className="text-xs text-slate-500 inline-flex flex-wrap items-center gap-1">
                      {deptLabel(r.departement)} · {String(r.heure_rdv).slice(0, 5)} ·{' '}
                      {r.type === 'teleconsultation' ? (
                        <span className="inline-flex items-center gap-1"><Icon name="video" className="h-3 w-3" /> Téléconsultation</span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Icon name="hospital" className="h-3 w-3" /> Présentiel</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{r.motif}</p>
                  </div>
                  <Badge statut={r.statut} />
                </div>
              ))}
            </div>
          )}

          {/* Dossier */}
          {tab === 'dossier' && (
            <div className="space-y-3">
              {dossiers.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Aucune consultation enregistrée pour l’instant.</p>
              ) : dossiers.map((d) => (
                <div key={d.id} className="rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{d.motif || 'Consultation'}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{d.departement?.nom || d.departement} · {d.medecin?.user?.name || 'Médecin'}</p>
                      <p className="text-xs text-slate-400">{d.date_consultation ? new Date(d.date_consultation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
                    </div>
                  </div>
                  {d.diagnostics?.[0] && (
                    <div className="mt-3 rounded-lg bg-emerald-50 p-3">
                      <p className="text-xs font-semibold text-emerald-700">Diagnostic</p>
                      <p className="mt-0.5 text-sm text-slate-700">{d.diagnostics[0].libelle}</p>
                    </div>
                  )}
                </div>
              ))}
              <Link to="/patient/dossier" className="block text-center text-sm font-medium text-medical-primary hover:underline">
                Voir le dossier complet →
              </Link>
            </div>
          )}

          {/* Prescriptions */}
          {tab === 'prescriptions' && (
            <div className="space-y-4">
              {prescriptions.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Aucune ordonnance pour le moment.</p>
              ) : prescriptions.map((p) => (
                <div key={`${p.source || 'rx'}-${p.id}`} className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-bold text-emerald-700">{p.numero_ordonnance || `ORD-${p.id}`}</p>
                      <p className="font-semibold text-slate-900">
                        Prescription du {p.date_prescription ? new Date(p.date_prescription).toLocaleDateString('fr-FR') : '—'}
                      </p>
                      <p className="text-xs text-slate-500">Par {p.medecin?.user?.name || (typeof p.medecin === 'string' ? p.medecin : 'Médecin')}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.statut === 'active' ? 'bg-amber-100 text-amber-800'
                          : p.statut === 'delivree' ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.statut_label || (p.statut === 'active' ? 'À retirer à la pharmacie' : p.statut)}
                      </span>
                      <button
                        type="button"
                        onClick={() => printHtml(p.numero_ordonnance || 'Ordonnance', ordonnancePrintBody(p))}
                        className="rounded-lg border px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Imprimer
                      </button>
                      <button
                        type="button"
                        onClick={() => void downloadPdf(
                          `${p.numero_ordonnance || 'ordonnance'}.pdf`,
                          p.numero_ordonnance || 'Ordonnance',
                          ordonnancePrintBody(p),
                        )}
                        className="rounded-lg border px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void downloadDocx(`${p.numero_ordonnance || 'ordonnance'}.docx`, () =>
                            ordonnanceDocxChildren(p),
                          )
                        }
                        className="rounded-lg border px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Word
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(p.medicaments ?? []).map((m, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                        <Icon name="pill" className="h-5 w-5 shrink-0 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{medLabel(m)} {m.dosage || ''}</p>
                          <p className="text-xs text-slate-500">{medPosologie(m)}{m.duree ? ` · ${m.duree}` : ''}</p>
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
