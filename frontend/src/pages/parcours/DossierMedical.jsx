import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/parcours/Modal';
import { useAuth } from '../../context/AuthContext';
import { MEDECIN_ROLES } from '../../constants/roleThemes';
import { admissionsApi, stepIndex, stepsForAdmission } from '../../services/admissionsApi';

const DOSSIER_MEDECIN_ROLES = [...MEDECIN_ROLES, 'admin'];
const CLINICIAN_ROLES = [...MEDECIN_ROLES];

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
    consultation: DOSSIER_MEDECIN_ROLES.includes(role),
    // Prélèvement = infirmier (le médecin prescrit, il ne prélève pas)
    prelevement: ['infirmier', 'admin'].includes(role),
    examens: [...DOSSIER_MEDECIN_ROLES, 'laborantin'].includes(role),
    diagnostic: DOSSIER_MEDECIN_ROLES.includes(role),
    prescription: [...DOSSIER_MEDECIN_ROLES, 'pharmacien'].includes(role),
    initiation: DOSSIER_MEDECIN_ROLES.includes(role),
    suivi: [...DOSSIER_MEDECIN_ROLES, 'receptionniste'].includes(role),
  }), [role]);

  const isMedecin = MEDECIN_ROLES.includes(role);

  const isClinician = CLINICIAN_ROLES.includes(role);
  const isInfirmier = role === 'infirmier';
  const backTo = isClinician ? '/medecin/dossiers' : isInfirmier
    ? (admission?.statut === 'prelevement' ? '/infirmier/prelevements' : '/infirmier/triage')
    : '/parcours';
  const backLabel = isClinician ? '← Consultations' : isInfirmier
    ? (admission?.statut === 'prelevement' ? '← Prélèvements' : '← Triage')
    : '← Admissions';

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
        <Link to={backTo} className="mt-4 inline-block text-medical-primary">{backLabel}</Link>
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
        <div className="flex min-w-0 items-start gap-3">
          {patient?.photo ? (
            <img
              src={patient.photo}
              alt=""
              className="h-16 w-16 shrink-0 rounded-2xl border object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed bg-slate-50 text-xl font-bold text-slate-400">
              {(patient?.user?.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <Link to={backTo} className="text-xs font-semibold text-medical-primary">{backLabel}</Link>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{patient?.user?.name}</h2>
            <p className="text-sm text-slate-500">
              {admission.numero_admission} · {patient?.numero_patient}
              {' · '}{admission.motif_arrivee}
            </p>
            {patient?.allergies && (
              <p className="mt-1 text-xs font-semibold text-red-700">Allergies : {patient.allergies}</p>
            )}
          </div>
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
          actionLabel={can.consultation && admission.statut === 'consultation_medicale' ? 'Enregistrer la consultation' : null}
          onAction={() => setModal('consultation')}
        >
          {admission.statut === 'consultation_medicale' && consultations.length === 0 && isMedecin ? (
            <p className="mb-2 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs text-teal-900">
              Étape en cours : enregistrez la consultation. Vous pourrez y demander des examens ou aller au diagnostic.
            </p>
          ) : null}
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
          actionLabel={
            (role === 'laborantin' && admission.statut === 'examens_laboratoire')
              ? '+ Saisir résultats'
              : (isMedecin && admission.statut === 'consultation_medicale')
                ? '+ Prescrire un examen'
                : null
          }
          onAction={() => setModal('examens')}
        >
          {examens.length === 0 ? <Empty text="Aucun examen." /> : (
            <ul className="space-y-3">
              {examens.map((ex) => (
                <li key={ex.id} className="rounded-xl border p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{ex.type_examen}</p>
                      <p className="text-xs text-slate-500">
                        {ex.priorite_label || ex.priorite || (ex.urgent ? 'Urgent' : 'Routine')}
                        {ex.type_echantillon ? ` · ${ex.type_echantillon}` : ''}
                        {ex.numero_echantillon ? ` · ${ex.numero_echantillon}` : ''}
                        {ex.technique ? ` · ${ex.technique}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">{ex.statut_label || ex.statut}</span>
                  </div>
                  {ex.indication && <p className="mt-1 text-xs text-slate-600">Indication : {ex.indication}</p>}
                  {(ex.resultats || []).length > 0 && (
                    <table className="mt-2 w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] uppercase text-slate-400">
                          <th className="py-1">Paramètre</th>
                          <th>Valeur</th>
                          <th>Unité</th>
                          <th>Norme</th>
                          <th>Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.resultats.map((r, i) => (
                          <tr key={i} className="border-t border-slate-50">
                            <td className="py-1 font-medium">{r.parametre}</td>
                            <td className={r.flag === 'critique' || r.flag === 'H' ? 'font-bold text-red-700' : r.flag === 'L' ? 'font-bold text-blue-700' : ''}>{r.valeur}</td>
                            <td>{r.unite || '—'}</td>
                            <td className="text-slate-500">{r.norme || (r.ref_min != null ? `${r.ref_min}–${r.ref_max}` : '—')}</td>
                            <td>{r.flag || 'N'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {ex.interpretation && <p className="mt-2 text-xs text-emerald-800">Interprétation : {ex.interpretation}</p>}
                  {ex.commentaire_medecin && <p className="mt-1 text-xs text-slate-700">Avis médecin : {ex.commentaire_medecin}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="6. Diagnostic & prescription"
          badge="Médecin — interprétation"
          actionLabel={
            can.diagnostic && ['examens_laboratoire', 'diagnostic_prescription'].includes(admission.statut)
              ? '+ Diagnostic / Rx'
              : (can.diagnostic && admission.statut === 'consultation_medicale' && examens.length === 0)
                ? '+ Diagnostic sans examen'
                : null
          }
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
          actionLabel={
            (role === 'pharmacien' && admission.statut === 'diagnostic_prescription')
              ? '+ Délivrer'
              : (isMedecin && admission.statut === 'diagnostic_prescription')
                ? '+ Ordonnance'
                : null
          }
          onAction={() => setModal('prescription')}
        >
          {prescriptions.length === 0 ? <Empty text="Aucune ordonnance." /> : (
            <ul className="space-y-2">
              {prescriptions.map((p) => (
                <li key={p.id} className="rounded-xl border p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold font-mono text-xs text-emerald-700">{p.numero_ordonnance || `ORD-${p.id}`}</p>
                    <span className="text-xs font-semibold uppercase text-slate-500">{p.statut_label || p.statut}</span>
                  </div>
                  <p className="mt-1 text-slate-600">{(p.medicaments || []).map((m) => m.nom_dci || m.nom).join(', ')}</p>
                  {p.allergies_signalees && (
                    <p className="mt-1 text-xs font-semibold text-red-700">Allergies : {p.allergies_signalees}</p>
                  )}
                  {(p.lignes_delivrance || []).length > 0 && (
                    <div className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                      {(p.lignes_delivrance || []).map((l, i) => (
                        <p key={i}>
                          {l.medicament_nom} · qté {l.quantite}
                          {l.numero_lot ? ` · lot ${l.numero_lot}` : ''}
                          {l.date_expiration ? ` · exp. ${l.date_expiration}` : ''}
                        </p>
                      ))}
                    </div>
                  )}
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
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-emerald-700">Parcours en suivi</p>
              {admission.resume_sortie && <p><strong>Résumé de sortie :</strong> {admission.resume_sortie}</p>}
              {admission.consignes_sortie && <p><strong>Consignes :</strong> {admission.consignes_sortie}</p>}
              {admission.date_suivi_prevue && <p>Contrôle prévu : {admission.date_suivi_prevue}</p>}
              {admission.rdv_suivi && (
                <p className="text-xs text-slate-600">
                  RDV créé : {admission.rdv_suivi.date_rdv} à {admission.rdv_suivi.heure_rdv} ({admission.rdv_suivi.statut})
                </p>
              )}
              {(admission.notes_suivi || []).length > 0 && (
                <ul className="mt-2 space-y-1 border-t pt-2">
                  {(admission.notes_suivi || []).map((n) => (
                    <li key={n.id} className="text-xs text-slate-600">
                      <strong>{n.date_note}</strong> — {n.evolution}
                      {n.plan ? ` · Plan : ${n.plan}` : ''}
                    </li>
                  ))}
                </ul>
              )}
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
                  <span>{l.description || l.libelle}</span>
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
      <PrescriptionModal
        open={modal === 'prescription'}
        busy={busy}
        isPharmacien={role === 'pharmacien'}
        prescriptions={prescriptions}
        onClose={() => setModal(null)}
        onSubmit={(p) => run(() => admissionsApi.prescription(admission.id, p), 'Pharmacie')}
      />
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
    anamnese: '', examen_clinique: '', diagnostic_provisoire: '', observations: '',
    prescrire_examens: false,
    examens: [{ type_examen: '', categorie: 'biologie', priorite: 'routine', type_echantillon: 'sang veineux' }],
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setEx = (idx, key, value) => setForm((f) => ({
    ...f,
    examens: f.examens.map((ex, i) => (i === idx ? { ...ex, [key]: value } : ex)),
  }));

  return (
    <Modal open={open} title="Consultation médicale" onClose={onClose} wide>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault();
        const payload = {
          anamnese: form.anamnese,
          examen_clinique: form.examen_clinique,
          diagnostic_provisoire: form.diagnostic_provisoire,
          observations: form.observations,
          prescrire_examens: form.prescrire_examens,
        };
        if (form.prescrire_examens) {
          payload.examens = form.examens
            .filter((ex) => ex.type_examen.trim())
            .map((ex) => ({
              type_examen: ex.type_examen.trim(),
              categorie: ex.categorie,
              priorite: ex.priorite,
              type_echantillon: ex.type_echantillon || null,
            }));
        }
        onSubmit(payload);
      }}>
        <Field label="Anamnèse *"><textarea required rows={3} value={form.anamnese} onChange={set('anamnese')} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Examen clinique"><textarea rows={3} value={form.examen_clinique} onChange={set('examen_clinique')} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Hypothèses diagnostiques"><input value={form.diagnostic_provisoire} onChange={set('diagnostic_provisoire')} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.prescrire_examens} onChange={set('prescrire_examens')} />
          Prescrire des examens (prélèvement → labo)
        </label>
        {form.prescrire_examens && (
          <div className="space-y-2 rounded-xl border border-amber-100 bg-amber-50/50 p-3">
            <p className="text-xs font-semibold text-amber-800">Examens à créer (obligatoire)</p>
            {form.examens.map((ex, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-4">
                <input required placeholder="Type (NFS…)" value={ex.type_examen} onChange={(e) => setEx(i, 'type_examen', e.target.value)} className="rounded-lg border px-2 py-1.5 text-sm sm:col-span-2" />
                <select value={ex.priorite} onChange={(e) => setEx(i, 'priorite', e.target.value)} className="rounded-lg border px-2 py-1.5 text-sm">
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                </select>
                <input placeholder="Échantillon" value={ex.type_echantillon} onChange={(e) => setEx(i, 'type_echantillon', e.target.value)} className="rounded-lg border px-2 py-1.5 text-sm" />
              </div>
            ))}
            <button type="button" className="text-xs font-semibold text-medical-primary"
              onClick={() => setForm((f) => ({
                ...f,
                examens: [...f.examens, { type_examen: '', categorie: 'biologie', priorite: 'routine', type_echantillon: 'sang veineux' }],
              }))}
            >
              + Ajouter un examen
            </button>
          </div>
        )}
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
    type_examen: '', categorie: 'biologie', indication: '', priorite: 'routine',
    type_echantillon: 'sang veineux', conditions_prelevement: '',
    urgent: false, interpretation: '', technique: '',
    statut: isLabo ? 'termine' : 'prescrit',
    resultats: [{ parametre: '', valeur: '', unite: '', norme: '', flag: 'N' }],
  });
  return (
    <Modal open={open} title={isLabo ? 'Saisir résultats labo' : 'Prescrire un examen'} onClose={onClose} wide>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          type_examen: form.type_examen,
          categorie: form.categorie,
          indication: form.indication,
          priorite: form.priorite,
          type_echantillon: form.type_echantillon || null,
          conditions_prelevement: form.conditions_prelevement || null,
          urgent: form.priorite !== 'routine',
          statut: form.statut,
          technique: form.technique || null,
          interpretation: form.interpretation || null,
          resultats: isLabo ? form.resultats.filter((r) => r.parametre) : undefined,
        });
      }}>
        <Field label="Type d'examen *"><input required value={form.type_examen} onChange={(e) => setForm((f) => ({ ...f, type_examen: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="NFS, Glycémie, CRP…" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Catégorie">
            <select value={form.categorie} onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm">
              <option value="biologie">Biologie</option>
              <option value="imagerie">Imagerie</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
          <Field label="Priorité">
            <select value={form.priorite} onChange={(e) => setForm((f) => ({ ...f, priorite: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm">
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT (immédiat)</option>
            </select>
          </Field>
        </div>
        <Field label="Indication"><input value={form.indication} onChange={(e) => setForm((f) => ({ ...f, indication: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        {!isLabo && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Type d'échantillon"><input value={form.type_echantillon} onChange={(e) => setForm((f) => ({ ...f, type_echantillon: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
            <Field label="Conditions"><input value={form.conditions_prelevement} onChange={(e) => setForm((f) => ({ ...f, conditions_prelevement: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="À jeun…" /></Field>
          </div>
        )}
        {isLabo && (
          <>
            <Field label="Technique / automate"><input value={form.technique} onChange={(e) => setForm((f) => ({ ...f, technique: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
            <Field label="Interprétation"><textarea rows={2} value={form.interpretation} onChange={(e) => setForm((f) => ({ ...f, interpretation: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
            <div className="grid grid-cols-5 gap-2">
              <input placeholder="Paramètre" value={form.resultats[0].parametre} onChange={(e) => setForm((f) => ({ ...f, resultats: [{ ...f.resultats[0], parametre: e.target.value }] }))} className="rounded-xl border px-2 py-2 text-sm" />
              <input placeholder="Valeur" value={form.resultats[0].valeur} onChange={(e) => setForm((f) => ({ ...f, resultats: [{ ...f.resultats[0], valeur: e.target.value }] }))} className="rounded-xl border px-2 py-2 text-sm" />
              <input placeholder="Unité" value={form.resultats[0].unite} onChange={(e) => setForm((f) => ({ ...f, resultats: [{ ...f.resultats[0], unite: e.target.value }] }))} className="rounded-xl border px-2 py-2 text-sm" />
              <input placeholder="Norme" value={form.resultats[0].norme} onChange={(e) => setForm((f) => ({ ...f, resultats: [{ ...f.resultats[0], norme: e.target.value }] }))} className="rounded-xl border px-2 py-2 text-sm" />
              <select value={form.resultats[0].flag} onChange={(e) => setForm((f) => ({ ...f, resultats: [{ ...f.resultats[0], flag: e.target.value }] }))} className="rounded-xl border px-2 py-2 text-sm">
                <option value="N">N</option>
                <option value="H">H</option>
                <option value="L">L</option>
                <option value="critique">Critique</option>
              </select>
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
        <p className="text-xs font-semibold uppercase text-slate-400">Prescription (recommandée pour la pharmacie)</p>
        <input required placeholder="Médicament *" value={form.med_nom} onChange={set('med_nom')} className="w-full rounded-xl border px-3 py-2 text-sm" />
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

function PrescriptionModal({ open, onClose, onSubmit, busy, isPharmacien, prescriptions = [] }) {
  const actives = (prescriptions || []).filter((p) => p.statut === 'active');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [nom, setNom] = useState('');
  const [dosage, setDosage] = useState('500mg');
  const [frequence, setFrequence] = useState('2x/jour');
  const [duree, setDuree] = useState('7 jours');

  useEffect(() => {
    if (open && actives[0]) setPrescriptionId(String(actives[0].id));
  }, [open, actives[0]?.id]);

  if (isPharmacien) {
    return (
      <Modal open={open} title="Délivrance pharmacie" onClose={onClose}>
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault();
          if (!prescriptionId) return;
          onSubmit({ prescription_id: Number(prescriptionId), delivrer: true });
        }}>
          {actives.length === 0 ? (
            <p className="text-sm text-amber-700">Aucune ordonnance active. Le médecin doit d&apos;abord prescrire via le diagnostic.</p>
          ) : (
            <Field label="Ordonnance à délivrer *">
              <select required value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm">
                {actives.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numero_ordonnance || `ORD-${p.id}`} — {(p.medicaments || []).map((m) => m.nom_dci || m.nom).join(', ')}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <ModalActions onClose={onClose} busy={busy || actives.length === 0} label="Délivrer → Médecin" />
        </form>
      </Modal>
    );
  }

  return (
    <Modal open={open} title="Ordonnance" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          medicaments: [{ nom, dosage, frequence, duree }],
          duree_jours: 7,
          delivrer: false,
        });
      }}>
        <Field label="Médicament *"><input required value={nom} onChange={(e) => setNom(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <div className="grid grid-cols-3 gap-2">
          <input value={dosage} onChange={(e) => setDosage(e.target.value)} className="rounded-xl border px-2 py-2 text-sm" />
          <input value={frequence} onChange={(e) => setFrequence(e.target.value)} className="rounded-xl border px-2 py-2 text-sm" />
          <input value={duree} onChange={(e) => setDuree(e.target.value)} className="rounded-xl border px-2 py-2 text-sm" />
        </div>
        <ModalActions onClose={onClose} busy={busy} label="Prescrire" />
      </form>
    </Modal>
  );
}

function InitiationModal({ open, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({
    notes_initiation: '', education_therapeutique: '', vigilance: '', date_suivi_prevue: '',
  });
  return (
    <Modal open={open} title="Initiation du traitement" onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
        <Field label="Notes / consignes"><textarea rows={2} value={form.notes_initiation} onChange={(e) => setForm((f) => ({ ...f, notes_initiation: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Éducation thérapeutique"><textarea rows={2} value={form.education_therapeutique} onChange={(e) => setForm((f) => ({ ...f, education_therapeutique: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Prise des médicaments, hydratation…" /></Field>
        <Field label="Vigilance / signes d'alerte"><input value={form.vigilance} onChange={(e) => setForm((f) => ({ ...f, vigilance: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="RDV de contrôle"><input type="date" value={form.date_suivi_prevue} onChange={(e) => setForm((f) => ({ ...f, date_suivi_prevue: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <ModalActions onClose={onClose} busy={busy} label="Démarrer le traitement" />
      </form>
    </Modal>
  );
}

function SuiviModal({ open, onClose, onSubmit, busy }) {
  const [form, setForm] = useState({
    date_suivi_prevue: '', heure_suivi: '09:00', consignes_sortie: '', resume_sortie: '',
    note_evolution: '', plan_suivi: '', creer_rdv: true,
  });
  return (
    <Modal open={open} title="Suivi / contrôle" onClose={onClose} wide>
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...form,
          creer_rdv: !!form.creer_rdv,
        });
      }}>
        <Field label="Résumé de sortie"><textarea rows={2} value={form.resume_sortie} onChange={(e) => setForm((f) => ({ ...f, resume_sortie: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Consignes patient"><textarea rows={2} value={form.consignes_sortie} onChange={(e) => setForm((f) => ({ ...f, consignes_sortie: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Note d'évolution"><textarea rows={2} value={form.note_evolution} onChange={(e) => setForm((f) => ({ ...f, note_evolution: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <Field label="Plan de suivi"><input value={form.plan_suivi} onChange={(e) => setForm((f) => ({ ...f, plan_suivi: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Date de contrôle"><input type="date" value={form.date_suivi_prevue} onChange={(e) => setForm((f) => ({ ...f, date_suivi_prevue: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
          <Field label="Heure"><input type="time" value={form.heure_suivi} onChange={(e) => setForm((f) => ({ ...f, heure_suivi: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm" /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.creer_rdv} onChange={(e) => setForm((f) => ({ ...f, creer_rdv: e.target.checked }))} />
          Créer un vrai rendez-vous de contrôle
        </label>
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
