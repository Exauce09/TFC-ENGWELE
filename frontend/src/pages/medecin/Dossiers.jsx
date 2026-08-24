import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MedecinLayout from '../../components/layout/MedecinLayout';
import { OrdonnanceCard, OrdonnanceFormModal } from '../../components/medecin/OrdonnanceForm';
import api from '../../services/api';
import { admissionsApi } from '../../services/admissionsApi';

const EMPTY = {
  motif: '',
  anamnese: '',
  histoire_maladie: '',
  antecedents_personnels: '',
  antecedents_chirurgicaux: '',
  antecedents_familiaux: '',
  allergies: '',
  traitement_en_cours: '',
  examen_clinique: '',
  observations: '',
  diagnostic: { libelle: '', code_cim10: '', description: '' },
  decision: '',
  recommandations: '',
  cloturer: false,
};

const DECISIONS = [
  { value: '', label: '— Choisir —' },
  { value: 'ordonnance', label: 'Ordonnance' },
  { value: 'examen', label: 'Demande d’examen' },
  { value: 'hospitalisation', label: 'Hospitalisation' },
  { value: 'renvoi', label: 'Renvoi / suivi' },
  { value: 'certificat', label: 'Certificat' },
];

function urgenceBadge(niveau) {
  const map = {
    critique: 'bg-red-100 text-red-800',
    urgent: 'bg-orange-100 text-orange-800',
    moins_urgent: 'bg-amber-100 text-amber-800',
    non_urgent: 'bg-teal-50 text-teal-800',
  };
  return map[niveau] || 'bg-slate-100 text-slate-600';
}

export default function MedecinDossiers() {
  const [file, setFile] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOrdonnance, setShowOrdonnance] = useState(false);
  const [filtreDept, setFiltreDept] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [fileRes, dRes] = await Promise.all([
        api.get('/medecin/file-consultation'),
        api.get('/medecin/dossiers'),
      ]);
      const fileData = fileRes.data.data;
      setFile(Array.isArray(fileData) ? fileData : (fileData?.data || []));
      setDossiers(dRes.data.data || []);
    } catch (err) {
      setFile([]);
      setDossiers([]);
      setError(
        err.response?.data?.message
          || 'Impossible de charger la file de consultation. Vérifiez votre connexion ou le profil médecin.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openDetail = async (id) => {
    const res = await api.get(`/medecin/dossiers/${id}`);
    const d = res.data.data;
    setSelected(d);
    setEditing(false);
    setForm({
      ...EMPTY,
      motif: d.motif || '',
      anamnese: d.anamnese || '',
      examen_clinique: d.examen_clinique || '',
      observations: d.observations || '',
      allergies: d.patient?.allergies || '',
      antecedents_personnels: d.patient?.antecedents_medicaux || '',
    });
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const observations = [
        form.observations,
        form.histoire_maladie && `HMA : ${form.histoire_maladie}`,
        form.antecedents_chirurgicaux && `ATCD chir. : ${form.antecedents_chirurgicaux}`,
        form.antecedents_familiaux && `ATCD fam. : ${form.antecedents_familiaux}`,
        form.traitement_en_cours && `Traitement : ${form.traitement_en_cours}`,
        form.decision && `Décision : ${form.decision}`,
        form.recommandations && `Recommandations : ${form.recommandations}`,
      ].filter(Boolean).join('\n');

      const admissionId = selected.admission_active?.id;
      const admissionStatut = selected.admission_active?.statut;

      // Demande d'analyses sur une admission déjà en diagnostic / labo (2e passage labo / contrôle)
      if (
        admissionId
        && form.decision === 'examen'
        && ['examens_laboratoire', 'diagnostic_prescription'].includes(admissionStatut)
      ) {
        await admissionsApi.examens(admissionId, {
          type_examen: form.diagnostic?.libelle || form.motif || 'Bilan de contrôle',
          categorie: 'biologie',
          priorite: 'routine',
          indication: observations || 'Contrôle / nouvel examen demandé',
        });
        setSuccess('Nouveaux examens prescrits — le patient retourne au prélèvement / laboratoire.');
        setEditing(false);
        void load();
        return;
      }

      if (admissionId && admissionStatut === 'consultation_medicale') {
        const consultPayload = {
          motif: form.motif,
          anamnese: [
            form.anamnese,
            form.allergies && `Allergies : ${form.allergies}`,
            form.antecedents_personnels && `ATCD : ${form.antecedents_personnels}`,
          ].filter(Boolean).join('\n'),
          examen_clinique: form.examen_clinique,
          diagnostic_provisoire: form.diagnostic?.libelle || null,
          observations,
          prescrire_examens: form.decision === 'examen',
        };
        if (form.decision === 'examen') {
          consultPayload.examens = [{
            type_examen: form.diagnostic?.libelle || form.motif || 'Bilan demandé',
            categorie: 'biologie',
            priorite: 'routine',
          }];
        }
        await admissionsApi.consultation(admissionId, consultPayload);
        setSuccess('Consultation enregistrée sur le parcours — ouvrez le dossier parcours pour la suite.');
        setEditing(false);
        void load();
        return;
      }

      const payload = {
        motif: form.motif,
        anamnese: [
          form.anamnese,
          form.allergies && `Allergies : ${form.allergies}`,
          form.antecedents_personnels && `ATCD : ${form.antecedents_personnels}`,
        ].filter(Boolean).join('\n'),
        examen_clinique: form.examen_clinique,
        observations,
        cloturer: form.cloturer,
      };
      if (form.diagnostic?.libelle) {
        payload.diagnostic = form.diagnostic;
      }
      await api.put(`/medecin/dossiers/${selected.id}`, payload);
      setSuccess(admissionId
        ? 'Notes dossier enregistrées. Pour avancer le parcours, utilisez le dossier parcours.'
        : 'Consultation enregistrée.');
      setEditing(false);
      void openDetail(selected.id);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const addPrescription = () => {
    if (!selected) return;
    setShowOrdonnance(true);
  };

  const annulerOrdonnance = async (pr) => {
    if (!window.confirm(`Annuler l'ordonnance ${pr.numero_ordonnance || pr.id} ?`)) return;
    try {
      await api.put(`/medecin/prescriptions/${pr.id}/annuler`);
      setSuccess('Ordonnance annulée.');
      void openDetail(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Annulation impossible.');
    }
  };

  const dupliquerOrdonnance = async (pr) => {
    if (!selected) return;
    if (!window.confirm('Dupliquer cette ordonnance (renouvellement) ?')) return;
    try {
      await api.post('/medecin/prescriptions', {
        dossier_id: selected.id,
        patient_id: selected.patient_id || selected.patient?.id,
        date_prescription: new Date().toISOString().slice(0, 10),
        validite_jours: pr.validite_jours || 30,
        diagnostic_motif: pr.diagnostic_motif || selected.motif,
        instructions_generales: pr.instructions_generales,
        renouvellement: true,
        medicaments: (pr.medicaments || []).map((m) => ({
          nom: m.nom,
          nom_dci: m.nom_dci,
          nom_commercial: m.nom_commercial,
          dosage: m.dosage,
          forme: m.forme,
          posologie: m.posologie || m.frequence,
          frequence: m.frequence || m.posologie,
          duree: m.duree,
          quantite: m.quantite,
          instructions: m.instructions,
        })),
      });
      setSuccess('Ordonnance dupliquée.');
      void openDetail(selected.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Duplication impossible.');
    }
  };

  const departements = useMemo(() => {
    const set = new Set(file.map((a) => a.departement?.nom).filter(Boolean));
    return [...set].sort();
  }, [file]);

  const fileFiltree = useMemo(() => {
    if (!filtreDept) return file;
    return file.filter((a) => a.departement?.nom === filtreDept);
  }, [file, filtreDept]);

  return (
    <MedecinLayout title="Consultations">
      <div className="mb-6">
        <h2 className="font-medecin-display text-3xl text-[#0D3B3A]">Consultations</h2>
        <p className="mt-1 text-sm text-[#5A8A7A]">
          File du jour : ouvrez un patient, consultez-le, puis revenez à la file pour le suivant.
          Plusieurs patients peuvent attendre en même temps — chacun a son dossier.
        </p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      {/* File de consultation — entrée principale */}
      <section className="medecin-card-accent mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A7A6D]">Aujourd&apos;hui</p>
            <h3 className="font-medecin-display text-xl text-[#0D3B3A]">File de consultation</h3>
            <p className="text-xs text-[#5A8A7A]">
              Patients qui vous sont affectés (après triage ou encore en triage). Les autres médecins ne les voient pas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {departements.length > 0 && (
              <select
                value={filtreDept}
                onChange={(e) => setFiltreDept(e.target.value)}
                className="rounded-lg border border-[#C5D9D0] bg-white px-3 py-1.5 text-xs text-[#0D3B3A]"
              >
                <option value="">Tous les services</option>
                {departements.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <span className="rounded-full bg-[#1A7A6D]/12 px-3 py-1 text-xs font-bold text-[#1A7A6D]">
              {fileFiltree.length} en file
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#5A8A7A]">Chargement…</p>
        ) : fileFiltree.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#B8D4C8] bg-[#F4FAF8] px-4 py-8 text-center text-sm text-[#5A8A7A]">
            <p className="font-medium text-[#0D3B3A]">Aucun patient en file pour le moment.</p>
            <p className="mt-2 text-xs">
              Seuls les patients assignés à vous à l&apos;accueil (statut triage ou consultation médicale) apparaissent ici.
              Vérifiez l&apos;affectation à l&apos;accueil et le passage au triage infirmier.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {fileFiltree.map((a, i) => (
              <Link
                key={a.id}
                to={`/parcours/${a.id}`}
                className="group relative overflow-hidden rounded-xl border border-[#C5D9D0] bg-white p-4 transition hover:border-[#1A7A6D] hover:shadow-md"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#0D3B3A] group-hover:text-[#1A7A6D]">
                      {a.patient?.user?.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#5A8A7A]">
                      {a.numero_admission} · {a.motif_arrivee || 'Consultation'}
                    </p>
                    {a.departement?.nom && (
                      <p className="text-[11px] text-[#7A9A90]">{a.departement.nom}</p>
                    )}
                    {a.arrivee_at && (
                      <p className="text-[11px] text-[#7A9A90]">
                        Arrivée {new Date(a.arrivee_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-[#E8F5F2] px-2 py-0.5 text-[10px] font-bold text-[#1A7A6D]">
                    {a.statut_label || a.statut}
                  </span>
                </div>
                {a.triage?.niveau_urgence && (
                  <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${urgenceBadge(a.triage.niveau_urgence)}`}>
                    {String(a.triage.niveau_urgence).replace(/_/g, ' ')}
                  </span>
                )}
                <p className="mt-3 text-[11px] font-semibold text-[#1A7A6D] opacity-0 transition group-hover:opacity-100">
                  Ouvrir le dossier →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Dossiers / consultations */}
      <div className="mb-3">
        <h3 className="font-medecin-display text-xl text-[#0D3B3A]">Dossiers de consultation</h3>
        <p className="text-xs text-[#5A8A7A]">Complétez anamnèse, examen, diagnostic — ordonnances dans le détail</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {loading ? (
            <p className="text-[#5A8A7A]">Chargement…</p>
          ) : dossiers.length === 0 ? (
            <p className="medecin-card p-8 text-center text-[#5A8A7A]">
              Aucun dossier. L&apos;accueil doit d&apos;abord enregistrer le patient.
            </p>
          ) : (
            dossiers.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => openDetail(d.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selected?.id === d.id
                    ? 'border-[#1A7A6D] bg-[#E8F5F2] shadow-sm'
                    : 'border-[#C5D9D0] bg-white/90 hover:border-[#1A7A6D]/50'
                }`}
              >
                <div className="flex justify-between gap-2">
                  <p className="font-semibold text-[#0D3B3A]">{d.patient?.user?.name || 'Patient'}</p>
                  <span className="rounded-full bg-[#0D3B3A]/8 px-2 py-0.5 text-xs font-semibold text-[#0D3B3A]">
                    {d.statut || 'ouvert'}
                  </span>
                </div>
                <p className="text-sm text-[#5A8A7A]">{d.motif}</p>
                <p className="text-xs text-[#7A9A90]">
                  {d.numero_dossier || `DOS-${d.id}`} · {d.departement?.nom} ·{' '}
                  {d.date_consultation ? new Date(d.date_consultation).toLocaleDateString('fr-FR') : '—'}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="medecin-card min-h-[300px] p-5">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-3">
                  {selected.patient?.photo ? (
                    <img
                      src={selected.patient.photo}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl border border-[#C5D9D0] object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#B8D4C8] bg-[#F4FAF8] font-medecin-display text-xl text-[#1A7A6D]">
                      {(selected.patient?.user?.name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-medecin-display text-xl text-[#0D3B3A]">{selected.patient?.user?.name}</h3>
                    <p className="text-sm text-[#5A8A7A]">{selected.numero_dossier} · {selected.motif}</p>
                    {selected.patient?.allergies && (
                      <p className="mt-1 text-xs font-semibold text-red-700">Allergies : {selected.patient.allergies}</p>
                    )}
                    {selected.patient_id && (
                      <Link
                        to={`/medecin/patients/${selected.patient_id}`}
                        className="mt-1 inline-block text-xs font-semibold text-[#1A7A6D] hover:underline"
                      >
                        Voir le dossier complet →
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.admission_active?.id && (
                    <Link
                      to={`/parcours/${selected.admission_active.id}`}
                      className="medecin-btn text-xs"
                    >
                      Ouvrir parcours →
                    </Link>
                  )}
                  <button type="button" onClick={() => setEditing(true)} className="medecin-btn text-xs">
                    Compléter consultation
                  </button>
                  <button type="button" onClick={addPrescription} className="medecin-btn-ghost text-xs">
                    + Ordonnance
                  </button>
                </div>
              </div>

              {editing ? (
                <form onSubmit={submit} className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto border-t border-[#C5D9D0] pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A7A6D]">Anamnèse</p>
                  <label className="block text-sm text-[#0D3B3A]">
                    <span className="mb-1 block font-medium">Motif de consultation</span>
                    <input value={form.motif} onChange={set('motif')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
                  </label>
                  <label className="block text-sm text-[#0D3B3A]">
                    <span className="mb-1 block font-medium">Histoire de la maladie actuelle</span>
                    <textarea rows={2} value={form.histoire_maladie} onChange={set('histoire_maladie')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm text-[#0D3B3A]">
                      <span className="mb-1 block font-medium">Antécédents personnels</span>
                      <textarea rows={2} value={form.antecedents_personnels} onChange={set('antecedents_personnels')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
                    </label>
                    <label className="block text-sm text-[#0D3B3A]">
                      <span className="mb-1 block font-medium">Antécédents chirurgicaux</span>
                      <textarea rows={2} value={form.antecedents_chirurgicaux} onChange={set('antecedents_chirurgicaux')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
                    </label>
                    <label className="block text-sm text-[#0D3B3A]">
                      <span className="mb-1 block font-medium">Antécédents familiaux</span>
                      <textarea rows={2} value={form.antecedents_familiaux} onChange={set('antecedents_familiaux')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
                    </label>
                    <label className="block text-sm text-[#0D3B3A]">
                      <span className="mb-1 block font-medium">Allergies</span>
                      <input value={form.allergies} onChange={set('allergies')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
                    </label>
                  </div>
                  <label className="block text-sm text-[#0D3B3A]">
                    <span className="mb-1 block font-medium">Traitement en cours</span>
                    <input value={form.traitement_en_cours} onChange={set('traitement_en_cours')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
                  </label>
                  <label className="block text-sm text-[#0D3B3A]">
                    <span className="mb-1 block font-medium">Anamnèse (notes)</span>
                    <textarea rows={2} value={form.anamnese} onChange={set('anamnese')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
                  </label>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A7A6D]">Examen clinique</p>
                  <label className="block text-sm text-[#0D3B3A]">
                    <span className="mb-1 block font-medium">Observations / examen par système</span>
                    <textarea rows={3} value={form.examen_clinique} onChange={set('examen_clinique')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" placeholder="Cardio, respiratoire, digestif, neuro…" />
                  </label>
                  <label className="block text-sm text-[#0D3B3A]">
                    <span className="mb-1 block font-medium">Notes libres</span>
                    <textarea rows={2} value={form.observations} onChange={set('observations')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
                  </label>

                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A7A6D]">Diagnostic et décision</p>
                  <label className="block text-sm text-[#0D3B3A]">
                    <span className="mb-1 block font-medium">Diagnostic principal</span>
                    <input
                      value={form.diagnostic.libelle}
                      onChange={(e) => setForm((f) => ({ ...f, diagnostic: { ...f.diagnostic, libelle: e.target.value } }))}
                      className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm text-[#0D3B3A]">
                      <span className="mb-1 block font-medium">Décision</span>
                      <select value={form.decision} onChange={set('decision')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2">
                        {DECISIONS.map((d) => <option key={d.value || 'x'} value={d.value}>{d.label}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm text-[#0D3B3A]">
                      <span className="mb-1 block font-medium">Recommandations</span>
                      <input value={form.recommandations} onChange={set('recommandations')} className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-[#0D3B3A]">
                    <input type="checkbox" checked={form.cloturer} onChange={set('cloturer')} />
                    Clôturer le dossier (facturation possible)
                  </label>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditing(false)} className="medecin-btn-ghost">Annuler</button>
                    <button type="submit" disabled={submitting} className="medecin-btn disabled:opacity-60">
                      {submitting ? 'Enregistrement…' : 'Enregistrer la consultation'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 space-y-3 border-t border-[#C5D9D0] pt-4 text-sm text-[#0D3B3A]">
                  {selected.anamnese && <p><strong>Anamnèse :</strong> {selected.anamnese}</p>}
                  {selected.examen_clinique && <p><strong>Examen :</strong> {selected.examen_clinique}</p>}
                  {selected.observations && <p><strong>Notes :</strong> {selected.observations}</p>}
                  {selected.diagnostics?.map((diag) => (
                    <div key={diag.id} className="rounded-lg bg-[#E8F5F2] p-3">
                      <strong>Diagnostic :</strong> {diag.libelle}
                    </div>
                  ))}

                  {/* Ordonnances — uniquement dans le dossier patient */}
                  <div className="rounded-xl border border-[#C5D9D0] bg-[#F4FAF8] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A7A6D]">Ordonnances</p>
                      <button type="button" onClick={addPrescription} className="text-xs font-semibold text-[#1A7A6D] hover:underline">
                        + Nouvelle ordonnance
                      </button>
                    </div>
                    {selected.prescriptions?.length > 0 ? (
                      <div className="space-y-3">
                        {selected.prescriptions.map((pr) => (
                          <OrdonnanceCard
                            key={pr.id}
                            prescription={pr}
                            patient={selected.patient}
                            dossier={selected}
                            onAnnuler={pr.source === 'parcours' ? undefined : annulerOrdonnance}
                            onDupliquer={pr.source === 'parcours' ? undefined : dupliquerOrdonnance}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#7A9A90]">Aucune ordonnance sur ce dossier.</p>
                    )}
                  </div>

                  {!selected.anamnese && !selected.examen_clinique && !selected.diagnostics?.length && (
                    <p className="text-[#7A9A90]">Consultation non encore complétée.</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="py-16 text-center text-[#7A9A90]">Sélectionnez un dossier à gauche.</p>
          )}
        </div>
      </div>

      <OrdonnanceFormModal
        open={showOrdonnance}
        dossier={selected}
        onClose={() => setShowOrdonnance(false)}
        onSaved={() => {
          setSuccess('Ordonnance émise et visible pour la pharmacie.');
          if (selected?.id) void openDetail(selected.id);
        }}
      />
    </MedecinLayout>
  );
}
