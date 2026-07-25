import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/parcours/Modal';
import { useAuth } from '../../context/AuthContext';
import { admissionsApi, stepIndex, stepsForAdmission } from '../../services/admissionsApi';

const MEDECIN_ROLES = [
  'medecin_generaliste', 'medecin_interne', 'pediatre',
  'gynecologue', 'ophtalmologue', 'urgentiste', 'admin',
];

function Card({ title, actionLabel, onAction, children, badge }) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          {badge ? <p className="mt-0.5 text-xs text-slate-400">{badge}</p> : null}
        </div>
        {actionLabel && onAction ? (
          <button type="button" onClick={onAction}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700">
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-slate-400">{text}</p>;
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export default function DossierMedical() {
  const { id } = useParams();
  const { user } = useAuth();
  const role = user?.role;

  const [admission, setAdmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);

  const can = useMemo(() => ({
    triage: ['infirmier', 'admin'].includes(role),
    consultation: MEDECIN_ROLES.includes(role),
    prelevement: ['infirmier', 'admin', ...MEDECIN_ROLES].includes(role),
    examens: [...MEDECIN_ROLES, 'laborantin'].includes(role),
    diagnostic: MEDECIN_ROLES.includes(role),
    prescription: [...MEDECIN_ROLES, 'pharmacien'].includes(role),
    initiation: MEDECIN_ROLES.includes(role),
    suivi: [...MEDECIN_ROLES, 'receptionniste'].includes(role),
  }), [role]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await admissionsApi.get(id);
      setAdmission(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger le dossier');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const applyAdmission = (data, message) => {
    const next = data?.admission || data;
    if (next?.id) setAdmission(next);
    setModal(null);
    setToast(message || 'Enregistré');
    setTimeout(() => setToast(''), 3000);
  };

  const run = async (fn, successMsg) => {
    setBusy(true);
    setError('');
    try {
      const res = await fn();
      applyAdmission(res.data.data, successMsg || res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Layout title="Dossier médical"><p className="text-slate-500">Chargement...</p></Layout>;
  }

  if (!admission) {
    return (
      <Layout title="Dossier médical">
        <p className="text-red-600">{error || 'Dossier introuvable'}</p>
        <Link to="/parcours" className="mt-4 inline-block text-medical-primary">← Admissions</Link>
      </Layout>
    );
  }

  const patient = admission.patient;
  const idx = stepIndex(admission.statut);
  const triage = admission.triage;
  const consultations = admission.consultations || [];
  const examens = admission.examens_labo || admission.examensLabo || [];
  const prescriptions = admission.prescriptions || [];
  const factures = admission.facture_lignes || admission.factureLignes || [];
  const historique = admission.historique_statuts || admission.historiqueStatuts || [];

  return (
    <Layout title="Dossier médical">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/parcours" className="text-xs font-semibold text-medical-primary">← Admissions</Link>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">{patient?.user?.name}</h2>
          <p className="text-sm text-slate-500">
            {admission.numero_admission} · {patient?.numero_patient}
            {' · '}{admission.motif_arrivee}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">
          {admission.statut_label || admission.statut}
        </span>
      </div>

      <div className="mb-6 overflow-x-auto rounded-2xl border bg-white p-4">
        <div className="flex min-w-max gap-1">
          {stepsForAdmission(admission).map((s) => {
            const si = stepIndex(s.key);
            const active = s.key === admission.statut;
            const done = si < idx;
            return (
              <div key={s.key} className="w-24 shrink-0 text-center">
                <div className={`mx-auto h-2 rounded-full ${done || active ? 'bg-medical-primary' : 'bg-slate-200'}`} />
                <p className={`mt-2 text-[9px] font-semibold leading-tight ${active ? 'text-medical-primary' : 'text-slate-400'}`}>
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {toast && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{toast}</div>}
      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="1. Accueil" badge="Réceptionniste — identité & motif">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-xs text-slate-400">Téléphone</dt><dd>{patient?.user?.phone || '—'}</dd></div>
            <div><dt className="text-xs text-slate-400">Sexe</dt><dd>{patient?.sexe || '—'}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-slate-400">Motif</dt><dd>{admission.motif_arrivee}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-slate-400">Service</dt><dd>{admission.departement?.nom || '—'}</dd></div>
          </dl>
        </Card>

        <Card
          title="2. Triage"
          badge="Infirmier — constantes & urgence"
          actionLabel={can.triage && admission.statut === 'triage' ? '+ Triage' : can.triage && !triage ? '+ Triage' : null}
          onAction={() => setModal('triage')}
        >
          {!triage ? <Empty text="En attente de l'infirmier." /> : (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Urgence :</span> {triage.niveau_urgence}</p>
              <div className="grid grid-cols-3 gap-2">
                {triage.temperature && <div className="rounded-lg bg-red-50 p-2 text-center"><p className="text-xs text-slate-400">T°</p><p className="font-bold">{triage.temperature}</p></div>}
                {triage.tension_arterielle && <div className="rounded-lg bg-blue-50 p-2 text-center"><p className="text-xs text-slate-400">TA</p><p className="font-bold">{triage.tension_arterielle}</p></div>}
                {triage.frequence_cardiaque && <div className="rounded-lg bg-pink-50 p-2 text-center"><p className="text-xs text-slate-400">FC</p><p className="font-bold">{triage.frequence_cardiaque}</p></div>}
                {triage.saturation_02 && <div className="rounded-lg bg-cyan-50 p-2 text-center"><p className="text-xs text-slate-400">SpO₂</p><p className="font-bold">{triage.saturation_02}%</p></div>}
              </div>
            </div>
          )}
        </Card>

        <Card
          title="3. Consultation médicale"
          badge="Médecin — anamnèse & hypothèses"
          actionLabel={can.consultation ? '+ Consultation' : null}
          onAction={() => setModal('consultation')}
        >
          {consultations.length === 0 ? <Empty text="Pas encore de consultation." /> : (
            <ul className="space-y-3">
              {consultations.map((c) => (
                <li key={c.id} className="rounded-xl border p-3 text-sm">
                  <p className="font-semibold">{c.medecin?.user?.name || 'Médecin'}</p>
                  {c.anamnese && <p className="mt-1"><strong>Anamnèse :</strong> {c.anamnese}</p>}
                  {c.examen_clinique && <p><strong>Examen :</strong> {c.examen_clinique}</p>}
                  {c.diagnostic_provisoire && <p className="text-amber-700"><strong>Hypothèse :</strong> {c.diagnostic_provisoire}</p>}
                  {c.diagnostic_final && <p className="text-emerald-700"><strong>Diag. final :</strong> {c.diagnostic_final}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="4. Prélèvement"
          badge="Infirmier — optionnel"
          actionLabel={can.prelevement && admission.statut === 'prelevement' ? '+ Prélèvement' : null}
          onAction={() => setModal('prelevement')}
        >
          {admission.statut === 'prelevement' ? (
            <Empty text="En attente du prélèvement infirmier." />
          ) : ['examens_laboratoire', 'diagnostic_prescription', 'delivrance_medicaments', 'initiation_traitement', 'suivi'].includes(admission.statut) && examens.length >= 0 ? (
            <p className="text-sm text-slate-600">Étape franchie ou non requise.</p>
          ) : (
            <Empty text="Si examens prescrits par le médecin." />
          )}
        </Card>

        <Card
          title="5. Analyses de laboratoire"
          badge="Laborantin"
          actionLabel={can.examens ? '+ Examen / résultats' : null}
          onAction={() => setModal('examens')}
        >
          {examens.length === 0 ? <Empty text="Aucun examen." /> : (
            <ul className="space-y-2">
              {examens.map((ex) => (
                <li key={ex.id} className="flex justify-between gap-2 rounded-xl border p-3 text-sm">
                  <div>
                    <p className="font-semibold">{ex.type_examen}</p>
                    {ex.interpretation && <p className="text-xs text-slate-500">{ex.interpretation}</p>}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">{ex.statut}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="6. Diagnostic & prescription"
          badge="Médecin — interprétation"
          actionLabel={can.diagnostic ? '+ Diagnostic / Rx' : null}
          onAction={() => setModal('diagnostic')}
        >
          {!consultations.find((c) => c.diagnostic_final) ? (
            <Empty text="En attente d'interprétation des résultats." />
          ) : (
            <div className="text-sm">
              <p className="text-emerald-700"><strong>Diagnostic :</strong> {consultations.find((c) => c.diagnostic_final)?.diagnostic_final}</p>
            </div>
          )}
        </Card>

        <Card
          title="7. Délivrance médicaments"
          badge="Pharmacien"
          actionLabel={can.prescription ? '+ Ordonnance / délivrance' : null}
          onAction={() => setModal('prescription')}
        >
          {prescriptions.length === 0 ? <Empty text="Aucune ordonnance." /> : (
            <ul className="space-y-2">
              {prescriptions.map((p) => (
                <li key={p.id} className="rounded-xl border p-3 text-sm">
                  <div className="flex justify-between">
                    <p className="font-semibold">{p.date_prescription}</p>
                    <span className="text-xs font-semibold uppercase text-slate-500">{p.statut}</span>
                  </div>
                  <p className="mt-1 text-slate-600">{(p.medicaments || []).map((m) => m.nom).join(', ')}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="8. Initiation du traitement"
          badge="Retour médecin"
          actionLabel={can.initiation && admission.statut === 'delivrance_medicaments' ? '+ Initier le traitement' : null}
          onAction={() => setModal('initiation')}
        >
          {['initiation_traitement', 'suivi'].includes(admission.statut) ? (
            <p className="text-sm text-emerald-700">Traitement démarré{admission.consignes_sortie ? ` — ${admission.consignes_sortie}` : ''}.</p>
          ) : (
            <Empty text="Après achat pharmacie, retour chez le médecin." />
          )}
        </Card>

        <Card
          title="9. Suivi"
          badge="RDV de contrôle"
          actionLabel={can.suivi && admission.statut === 'initiation_traitement' ? '+ Passer en suivi' : null}
          onAction={() => setModal('suivi')}
        >
          {admission.statut === 'suivi' ? (
            <div className="text-sm">
              <p className="text-emerald-700 font-semibold">Parcours en suivi</p>
              {admission.date_suivi_prevue && <p className="mt-1">Contrôle prévu : {admission.date_suivi_prevue}</p>}
            </div>
          ) : (
            <Empty text="Réévaluation / rendez-vous de contrôle." />
          )}
        </Card>

        <Card title="Facturation" badge="Transversale">
          {factures.length === 0 ? <Empty text="Aucune ligne." /> : (
            <ul className="space-y-1 text-sm">
              {factures.map((l) => (
                <li key={l.id} className="flex justify-between border-b border-slate-50 py-1">
                  <span>{l.libelle}</span>
                  <span className="font-semibold">{Number(l.montant).toLocaleString('fr-FR')} FC</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Historique des statuts" badge="Audit">
          {historique.length === 0 ? <Empty text="—" /> : (
            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
              {historique.map((h) => (
                <li key={h.id} className="flex justify-between gap-2 border-b border-slate-50 py-1">
                  <span>{h.statut_avant || '—'} → <strong>{h.statut_apres}</strong></span>
                  <span className="text-slate-400">{h.user?.name}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <TriageModal open={modal === 'triage'} busy={busy} onClose={() => setModal(null)}
        onSubmit={(p) => run(() => admissionsApi.triage(admission.id, p), 'Triage enregistré')} />
      <ConsultationModal open={modal === 'consultation'} busy={busy} onClose={() => setModal(null)}
        onSubmit={(p) => run(() => admissionsApi.consultation(admission.id, p), 'Consultation enregistrée')} />
      <PrelevementModal open={modal === 'prelevement'} busy={busy} onClose={() => setModal(null)}
        onSubmit={(p) => run(() => admissionsApi.prelevement(admission.id, p), 'Prélèvement transmis au labo')} />
      <ExamenModal open={modal === 'examens'} busy={busy} role={role} onClose={() => setModal(null)}
        onSubmit={(p) => run(() => admissionsApi.examens(admission.id, p), 'Examen enregistré')} />
      <DiagnosticModal open={modal === 'diagnostic'} busy={busy} onClose={() => setModal(null)}
        onSubmit={(p) => run(() => admissionsApi.diagnostic(admission.id, p), 'Diagnostic & prescription')} />
      <PrescriptionModal open={modal === 'prescription'} busy={busy} isPharmacien={role === 'pharmacien'} onClose={() => setModal(null)}
        onSubmit={(p) => run(() => admissionsApi.prescription(admission.id, p), 'Pharmacie')} />
      <InitiationModal open={modal === 'initiation'} busy={busy} onClose={() => setModal(null)}
        onSubmit={(p) => run(() => admissionsApi.initiation(admission.id, p), 'Traitement initié')} />
      <SuiviModal open={modal === 'suivi'} busy={busy} onClose={() => setModal(null)}
        onSubmit={(p) => run(() => admissionsApi.suivi(admission.id, p), 'Passage en suivi')} />
    </Layout>
  );
}

function TriageModal({ open, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({
    niveau_urgence: 'moins_urgent', temperature: '', tension_arterielle: '',
    frequence_cardiaque: '', saturation_02: '', notes: '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open={open} title="Triage infirmier" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
        <Field label="Niveau d'urgence *">
          <select required value={form.niveau_urgence} onChange={set('niveau_urgence')} className="w-full rounded-xl border px-3 py-2">
            <option value="critique">Critique</option>
            <option value="urgent">Urgent</option>
            <option value="moins_urgent">Moins urgent</option>
            <option value="non_urgent">Non urgent</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Température" value={form.temperature} onChange={set('temperature')} className="rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="TA (120/80)" value={form.tension_arterielle} onChange={set('tension_arterielle')} className="rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="FC / pouls" value={form.frequence_cardiaque} onChange={set('frequence_cardiaque')} className="rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="SpO₂ %" value={form.saturation_02} onChange={set('saturation_02')} className="rounded-xl border px-3 py-2 text-sm" />
        </div>
        <textarea placeholder="Notes" value={form.notes} onChange={set('notes')} className="w-full rounded-xl border px-3 py-2 text-sm" rows={2} />
        <ModalActions onClose={onClose} busy={busy} />
      </form>
    </Modal>
  );
}

function ConsultationModal({ open, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({
    anamnese: '', examen_clinique: '', diagnostic_provisoire: '', observations: '', prescrire_examens: false,
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  return (
    <Modal open={open} title="Consultation médicale" onClose={onClose} wide>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
        <Field label="Anamnèse *"><textarea required rows={3} value={form.anamnese} onChange={set('anamnese')} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Examen clinique"><textarea rows={3} value={form.examen_clinique} onChange={set('examen_clinique')} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Hypothèses diagnostiques"><input value={form.diagnostic_provisoire} onChange={set('diagnostic_provisoire')} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.prescrire_examens} onChange={set('prescrire_examens')} />
          Prescrire des examens (prélèvement → labo)
        </label>
        <ModalActions onClose={onClose} busy={busy} />
      </form>
    </Modal>
  );
}

function PrelevementModal({ open, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({ types_prelevement: '', precisions_medecin: '', notes: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open={open} title="Prélèvement infirmier" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
        <Field label="Type de prélèvement"><input value={form.types_prelevement} onChange={set('types_prelevement')} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Sang, urine..." /></Field>
        <Field label="Précisions du médecin"><textarea rows={2} value={form.precisions_medecin} onChange={set('precisions_medecin')} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Notes"><textarea rows={2} value={form.notes} onChange={set('notes')} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <ModalActions onClose={onClose} busy={busy} label="Transmettre au labo" />
      </form>
    </Modal>
  );
}

function ExamenModal({ open, onClose, onSubmit, busy, role }) {
  const isLabo = role === 'laborantin';
  const [form, setForm] = useState({
    type_examen: '', indication: '', urgent: false, interpretation: '',
    statut: isLabo ? 'termine' : 'prescrit',
    resultats: [{ parametre: '', valeur: '', norme: '' }],
  });
  return (
    <Modal open={open} title={isLabo ? 'Saisir résultats labo' : 'Prescrire un examen'} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          type_examen: form.type_examen,
          indication: form.indication,
          urgent: form.urgent,
          statut: form.statut,
          interpretation: form.interpretation || null,
          resultats: isLabo ? form.resultats.filter((r) => r.parametre) : undefined,
        });
      }}>
        <Field label="Type d'examen *"><input required value={form.type_examen} onChange={(e) => setForm((f) => ({ ...f, type_examen: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Indication"><input value={form.indication} onChange={(e) => setForm((f) => ({ ...f, indication: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        {isLabo && (
          <>
            <Field label="Interprétation"><textarea rows={2} value={form.interpretation} onChange={(e) => setForm((f) => ({ ...f, interpretation: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Paramètre" value={form.resultats[0].parametre} onChange={(e) => setForm((f) => ({ ...f, resultats: [{ ...f.resultats[0], parametre: e.target.value }] }))} className="rounded-xl border px-2 py-2 text-sm" />
              <input placeholder="Valeur" value={form.resultats[0].valeur} onChange={(e) => setForm((f) => ({ ...f, resultats: [{ ...f.resultats[0], valeur: e.target.value }] }))} className="rounded-xl border px-2 py-2 text-sm" />
              <input placeholder="Norme" value={form.resultats[0].norme} onChange={(e) => setForm((f) => ({ ...f, resultats: [{ ...f.resultats[0], norme: e.target.value }] }))} className="rounded-xl border px-2 py-2 text-sm" />
            </div>
          </>
        )}
        <ModalActions onClose={onClose} busy={busy} />
      </form>
    </Modal>
  );
}

function DiagnosticModal({ open, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({
    diagnostic_final: '', code_cim10: '', decision: '', observations: '',
    med_nom: '', med_dosage: '500mg', med_frequence: '2x/jour', med_duree: '7 jours',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open={open} title="Diagnostic & prescription" onClose={onClose} wide>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault();
        const payload = {
          diagnostic_final: form.diagnostic_final,
          code_cim10: form.code_cim10,
          decision: form.decision,
          observations: form.observations,
        };
        if (form.med_nom) {
          payload.medicaments = [{
            nom: form.med_nom, dosage: form.med_dosage,
            frequence: form.med_frequence, duree: form.med_duree,
          }];
        }
        onSubmit(payload);
      }}>
        <Field label="Diagnostic définitif *"><input required value={form.diagnostic_final} onChange={set('diagnostic_final')} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Code CIM-10"><input value={form.code_cim10} onChange={set('code_cim10')} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Conduite / décision"><textarea rows={2} value={form.decision} onChange={set('decision')} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <p className="text-xs font-semibold uppercase text-slate-400">Prescription (optionnel)</p>
        <input placeholder="Médicament" value={form.med_nom} onChange={set('med_nom')} className="w-full rounded-xl border px-3 py-2 text-sm" />
        <div className="grid grid-cols-3 gap-2">
          <input value={form.med_dosage} onChange={set('med_dosage')} className="rounded-xl border px-2 py-2 text-sm" placeholder="Dosage" />
          <input value={form.med_frequence} onChange={set('med_frequence')} className="rounded-xl border px-2 py-2 text-sm" placeholder="Fréquence" />
          <input value={form.med_duree} onChange={set('med_duree')} className="rounded-xl border px-2 py-2 text-sm" placeholder="Durée" />
        </div>
        <ModalActions onClose={onClose} busy={busy} label="Valider → Pharmacie" />
      </form>
    </Modal>
  );
}

function PrescriptionModal({ open, onClose, onSubmit, busy, isPharmacien }) {
  const [nom, setNom] = useState('');
  const [dosage, setDosage] = useState('500mg');
  const [frequence, setFrequence] = useState('2x/jour');
  const [duree, setDuree] = useState('7 jours');
  return (
    <Modal open={open} title={isPharmacien ? 'Délivrance pharmacie' : 'Ordonnance'} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          medicaments: [{ nom, dosage, frequence, duree }],
          duree_jours: 7,
          delivrer: isPharmacien,
        });
      }}>
        <Field label="Médicament *"><input required value={nom} onChange={(e) => setNom(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <div className="grid grid-cols-3 gap-2">
          <input value={dosage} onChange={(e) => setDosage(e.target.value)} className="rounded-xl border px-2 py-2 text-sm" />
          <input value={frequence} onChange={(e) => setFrequence(e.target.value)} className="rounded-xl border px-2 py-2 text-sm" />
          <input value={duree} onChange={(e) => setDuree(e.target.value)} className="rounded-xl border px-2 py-2 text-sm" />
        </div>
        <ModalActions onClose={onClose} busy={busy} label={isPharmacien ? 'Délivrer → Médecin' : 'Prescrire'} />
      </form>
    </Modal>
  );
}

function InitiationModal({ open, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({ notes_initiation: '', date_suivi_prevue: '' });
  return (
    <Modal open={open} title="Initiation du traitement" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
        <Field label="Notes / consignes"><textarea rows={3} value={form.notes_initiation} onChange={(e) => setForm((f) => ({ ...f, notes_initiation: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="RDV de contrôle"><input type="date" value={form.date_suivi_prevue} onChange={(e) => setForm((f) => ({ ...f, date_suivi_prevue: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <ModalActions onClose={onClose} busy={busy} label="Démarrer le traitement" />
      </form>
    </Modal>
  );
}

function SuiviModal({ open, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({ date_suivi_prevue: '', consignes_sortie: '', resume_sortie: '' });
  return (
    <Modal open={open} title="Suivi / contrôle" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
        <Field label="Date de contrôle"><input type="date" value={form.date_suivi_prevue} onChange={(e) => setForm((f) => ({ ...f, date_suivi_prevue: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Consignes"><textarea rows={2} value={form.consignes_sortie} onChange={(e) => setForm((f) => ({ ...f, consignes_sortie: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <ModalActions onClose={onClose} busy={busy} label="Passer en suivi" />
      </form>
    </Modal>
  );
}

function ModalActions({ onClose, busy, label = 'Enregistrer' }) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
      <button type="submit" disabled={busy} className="rounded-xl bg-medical-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {busy ? '...' : label}
      </button>
    </div>
  );
}
