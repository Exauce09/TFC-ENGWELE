import { useEffect, useMemo, useState } from 'react';
import Icon from '../Icon';
import api from '../../services/api';
import { buildOrdonnanceHtml, downloadPdf, printHtml } from '../../utils/printDownload';
import { downloadDocx, ordonnanceDocxChildren } from '../../utils/printDoc';

const FORMES = [
  'Comprimé',
  'Gélule',
  'Sirop',
  'Injectable',
  'Pommade',
  'Gouttes',
  'Inhalateur',
  'Sachet',
  'Suppositoire',
  'Autre',
];

const EMPTY_LIGNE = () => ({
  nom_dci: '',
  nom_commercial: '',
  dosage: '',
  forme: 'Comprimé',
  posologie: '',
  duree: '7 jours',
  quantite: '',
  instructions: '',
});

function ageFrom(patient) {
  if (patient?.date_naissance) {
    const birth = new Date(patient.date_naissance);
    if (!Number.isNaN(birth.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
      return age;
    }
  }
  if (patient?.age_declare != null) return patient.age_declare;
  return null;
}

function statutClass(statut) {
  if (statut === 'active') return 'bg-amber-100 text-amber-800';
  if (statut === 'delivree') return 'bg-emerald-100 text-emerald-800';
  if (statut === 'annulee') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-600';
}

/** Formulaire complet d'ordonnance (selon cahier des charges). */
export function OrdonnanceFormModal({ open, dossier, onClose, onSaved }) {
  const patient = dossier?.patient;
  const diagPrincipal = dossier?.diagnostics?.[0]?.libelle || dossier?.motif || '';

  const [lignes, setLignes] = useState([EMPTY_LIGNE()]);
  const [form, setForm] = useState({
    date_prescription: new Date().toISOString().slice(0, 10),
    validite_jours: 30,
    poids_kg: '',
    diagnostic_motif: '',
    instructions_generales: '',
    renouvellement: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !dossier) return;
    setLignes([EMPTY_LIGNE()]);
    setError('');
    setForm({
      date_prescription: new Date().toISOString().slice(0, 10),
      validite_jours: 30,
      poids_kg: '',
      diagnostic_motif: diagPrincipal,
      instructions_generales: '',
      renouvellement: false,
    });
  }, [open, dossier?.id, diagPrincipal]);

  if (!open || !dossier) return null;

  const age = ageFrom(patient);
  const setField = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const updateLigne = (idx, key, value) => {
    setLignes((rows) => rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const medicaments = lignes
      .map((l) => ({
        nom_dci: l.nom_dci.trim(),
        nom_commercial: l.nom_commercial.trim(),
        dosage: l.dosage.trim(),
        forme: l.forme,
        posologie: l.posologie.trim(),
        frequence: l.posologie.trim(),
        duree: l.duree.trim(),
        quantite: l.quantite.trim() || null,
        instructions: l.instructions.trim() || null,
      }))
      .filter((l) => l.nom_dci || l.nom_commercial);

    if (medicaments.length === 0) {
      setError('Ajoutez au moins un médicament (DCI ou nom commercial).');
      return;
    }
    if (medicaments.some((m) => !m.dosage || !m.posologie || !m.duree)) {
      setError('Chaque médicament doit avoir dosage, posologie et durée.');
      return;
    }

    setSubmitting(true);
    try {
      // Toujours via le dossier : l'API crée aussi le parcours pharmacie si besoin
      await api.post('/medecin/prescriptions', {
        dossier_id: dossier.id,
        patient_id: dossier.patient_id || patient?.id,
        date_prescription: form.date_prescription,
        validite_jours: Number(form.validite_jours) || 30,
        poids_kg: form.poids_kg ? Number(form.poids_kg) : null,
        diagnostic_motif: form.diagnostic_motif || null,
        instructions_generales: form.instructions_generales || null,
        renouvellement: form.renouvellement,
        medicaments,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible d\'émettre l\'ordonnance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-[#0B2E2C]/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#C5D9D0] bg-[#F4FAF8] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#C5D9D0] bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A7A6D]">Ordonnance</p>
            <h3 className="font-medecin-display text-xl text-[#0D3B3A]">Nouvelle prescription</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-[#5A8A7A] hover:bg-[#E8F5F2]">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5">
          {/* Rappel patient */}
          <section className="rounded-xl border border-[#C5D9D0] bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A7A6D]">Patient</p>
            <p className="mt-1 font-semibold text-[#0D3B3A]">{patient?.user?.name}</p>
            <p className="text-sm text-[#5A8A7A]">
              {dossier.numero_dossier || `DOS-${dossier.id}`}
              {age != null ? ` · ${age} ans` : ''}
              {patient?.sexe ? ` · ${patient.sexe === 'F' ? 'F' : 'M'}` : ''}
              {patient?.date_naissance
                ? ` · né(e) le ${new Date(patient.date_naissance).toLocaleDateString('fr-FR')}`
                : ''}
            </p>
            {patient?.allergies ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
                <Icon name="alert" className="h-3.5 w-3.5 shrink-0" /> Allergies : {patient.allergies}
              </p>
            ) : (
              <p className="mt-2 text-xs text-[#7A9A90]">Aucune allergie connue déclarée.</p>
            )}
          </section>

          {/* En-tête */}
          <section className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm text-[#0D3B3A]">
              <span className="mb-1 block font-medium">Date d&apos;émission</span>
              <input type="date" required value={form.date_prescription} onChange={setField('date_prescription')}
                className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
            </label>
            <label className="block text-sm text-[#0D3B3A]">
              <span className="mb-1 block font-medium">Validité (jours)</span>
              <input type="number" min={1} max={365} value={form.validite_jours} onChange={setField('validite_jours')}
                className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
            </label>
            <label className="block text-sm text-[#0D3B3A]">
              <span className="mb-1 block font-medium">Poids (kg)</span>
              <input type="number" step="0.1" min={0.5} value={form.poids_kg} onChange={setField('poids_kg')}
                placeholder="Optionnel" className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
            </label>
          </section>

          <label className="block text-sm text-[#0D3B3A]">
            <span className="mb-1 block font-medium">Diagnostic / motif de prescription</span>
            <textarea rows={2} value={form.diagnostic_motif} onChange={setField('diagnostic_motif')}
              className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
          </label>

          {/* Lignes médicaments */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A7A6D]">Médicaments</p>
              <button
                type="button"
                onClick={() => setLignes((rows) => [...rows, EMPTY_LIGNE()])}
                className="text-xs font-semibold text-[#1A7A6D] hover:underline"
              >
                + Ajouter une ligne
              </button>
            </div>
            <div className="space-y-3">
              {lignes.map((l, idx) => (
                <div key={idx} className="rounded-xl border border-[#C5D9D0] bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A8A7A]">Ligne {idx + 1}</span>
                    {lignes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLignes((rows) => rows.filter((_, i) => i !== idx))}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-[#5A8A7A]">DCI *</span>
                      <input value={l.nom_dci} onChange={(e) => updateLigne(idx, 'nom_dci', e.target.value)}
                        placeholder="ex. Amoxicilline" className="w-full rounded-lg border border-[#C5D9D0] px-3 py-2 text-sm" />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-[#5A8A7A]">Nom commercial</span>
                      <input value={l.nom_commercial} onChange={(e) => updateLigne(idx, 'nom_commercial', e.target.value)}
                        placeholder="ex. Clamoxyl" className="w-full rounded-lg border border-[#C5D9D0] px-3 py-2 text-sm" />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-[#5A8A7A]">Dosage / concentration *</span>
                      <input required value={l.dosage} onChange={(e) => updateLigne(idx, 'dosage', e.target.value)}
                        placeholder="500 mg" className="w-full rounded-lg border border-[#C5D9D0] px-3 py-2 text-sm" />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-[#5A8A7A]">Forme</span>
                      <select value={l.forme} onChange={(e) => updateLigne(idx, 'forme', e.target.value)}
                        className="w-full rounded-lg border border-[#C5D9D0] px-3 py-2 text-sm">
                        {FORMES.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-[#5A8A7A]">Posologie *</span>
                      <input required value={l.posologie} onChange={(e) => updateLigne(idx, 'posologie', e.target.value)}
                        placeholder="1 cp 3×/jour" className="w-full rounded-lg border border-[#C5D9D0] px-3 py-2 text-sm" />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-[#5A8A7A]">Durée *</span>
                      <input required value={l.duree} onChange={(e) => updateLigne(idx, 'duree', e.target.value)}
                        placeholder="7 jours" className="w-full rounded-lg border border-[#C5D9D0] px-3 py-2 text-sm" />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-[#5A8A7A]">Quantité à délivrer</span>
                      <input value={l.quantite} onChange={(e) => updateLigne(idx, 'quantite', e.target.value)}
                        placeholder="21 comprimés" className="w-full rounded-lg border border-[#C5D9D0] px-3 py-2 text-sm" />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs font-medium text-[#5A8A7A]">Instructions particulières</span>
                      <input value={l.instructions} onChange={(e) => updateLigne(idx, 'instructions', e.target.value)}
                        placeholder="Après repas, à jeun…" className="w-full rounded-lg border border-[#C5D9D0] px-3 py-2 text-sm" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <label className="block text-sm text-[#0D3B3A]">
            <span className="mb-1 block font-medium">Instructions générales</span>
            <textarea rows={2} value={form.instructions_generales} onChange={setField('instructions_generales')}
              placeholder="Repos, hydratation, consignes de suivi…"
              className="w-full rounded-xl border border-[#C5D9D0] bg-white px-3 py-2" />
          </label>

          <label className="flex items-center gap-2 text-sm text-[#0D3B3A]">
            <input type="checkbox" checked={form.renouvellement} onChange={setField('renouvellement')} />
            Renouvellement autorisé
          </label>

          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

          <div className="flex flex-wrap justify-end gap-2 border-t border-[#C5D9D0] pt-4">
            <button type="button" onClick={onClose} className="medecin-btn-ghost">Annuler</button>
            <button type="submit" disabled={submitting} className="medecin-btn disabled:opacity-60">
              {submitting ? 'Émission…' : 'Émettre l\'ordonnance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Affichage / impression / téléchargement d'une ordonnance complète. */
export function OrdonnanceCard({ prescription, patient, dossier, onAnnuler, onDupliquer, compact = false }) {
  const age = ageFrom(patient);
  const label = prescription.statut_label
    || ({ active: 'Émise', delivree: 'Délivrée', annulee: 'Annulée', expiree: 'Expirée' }[prescription.statut] || prescription.statut);

  const printId = useMemo(() => `ord-print-${prescription.id}`, [prescription.id]);
  const title = prescription.numero_ordonnance || `ORD-${prescription.id}`;
  const bodyHtml = () => buildOrdonnanceHtml({ prescription, patient, dossier });

  const handlePrint = () => printHtml(title, bodyHtml());
  const handleDownloadPdf = () => void downloadPdf(`${title}.pdf`, title, bodyHtml());
  const handleDownloadWord = () =>
    void downloadDocx(`${title}.docx`, () => ordonnanceDocxChildren(prescription));

  if (compact) {
    return (
      <li className="rounded-lg border border-[#C5D9D0] bg-white px-3 py-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] text-[#7A9A90]">
              {prescription.numero_ordonnance || `ORD-${prescription.id}`}
              {' · '}
              {prescription.date_prescription
                ? new Date(prescription.date_prescription).toLocaleDateString('fr-FR')
                : '—'}
            </p>
            <p className="font-medium text-[#0D3B3A]">
              {(prescription.medicaments || []).map((m) => m.nom || m.nom_dci).filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statutClass(prescription.statut)}`}>
              {label}
            </span>
            <button type="button" onClick={handlePrint} className="text-[10px] font-semibold text-[#1A7A6D] hover:underline">Imprimer</button>
            <button type="button" onClick={handleDownloadPdf} className="text-[10px] font-semibold text-[#1A7A6D] hover:underline">PDF</button>
            <button type="button" onClick={handleDownloadWord} className="text-[10px] font-semibold text-[#1A7A6D] hover:underline">Word</button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <article className="rounded-xl border border-[#C5D9D0] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-bold text-[#1A7A6D]">
            {prescription.numero_ordonnance || `ORD-${prescription.id}`}
          </p>
          <p className="text-xs text-[#5A8A7A]">
            Émise le{' '}
            {prescription.date_prescription
              ? new Date(prescription.date_prescription).toLocaleDateString('fr-FR')
              : '—'}
            {prescription.date_expiration
              ? ` · Valide jusqu'au ${new Date(prescription.date_expiration).toLocaleDateString('fr-FR')}`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statutClass(prescription.statut)}`}>
            {label}
          </span>
          <button type="button" onClick={handlePrint} className="text-xs font-semibold text-[#1A7A6D] hover:underline">
            Imprimer
          </button>
          <button type="button" onClick={handleDownloadPdf} className="text-xs font-semibold text-[#1A7A6D] hover:underline">
            PDF
          </button>
          <button type="button" onClick={handleDownloadWord} className="text-xs font-semibold text-[#1A7A6D] hover:underline">
            Word
          </button>
          {onDupliquer && (
            <button type="button" onClick={() => onDupliquer(prescription)} className="text-xs font-semibold text-[#1A7A6D] hover:underline">
              Dupliquer
            </button>
          )}
          {prescription.statut === 'active' && onAnnuler && (
            <button type="button" onClick={() => onAnnuler(prescription)} className="text-xs font-semibold text-red-600 hover:underline">
              Annuler
            </button>
          )}
        </div>
      </div>

      <div id={printId} className="space-y-3 text-sm text-[#0D3B3A]">
        <div>
          <h1 className="font-medecin-display text-lg">Centre Médical AMEN — Ordonnance</h1>
          <p className="muted text-xs text-[#5A8A7A]">
            {prescription.medecin?.user?.name || 'Médecin'}
            {prescription.medecin?.numero_ordre ? ` · Ordre n° ${prescription.medecin.numero_ordre}` : ''}
            {prescription.medecin?.departement?.nom || dossier?.departement?.nom
              ? ` · ${prescription.medecin?.departement?.nom || dossier?.departement?.nom}`
              : ''}
          </p>
        </div>

        <div className="rounded-lg bg-[#F4FAF8] p-3 text-xs">
          <p className="font-semibold">{patient?.user?.name}</p>
          <p className="text-[#5A8A7A]">
            {dossier?.numero_dossier || patient?.numero_patient || ''}
            {age != null ? ` · ${age} ans` : ''}
            {patient?.sexe ? ` · ${patient.sexe === 'F' ? 'F' : 'M'}` : ''}
            {prescription.poids_kg ? ` · ${prescription.poids_kg} kg` : ''}
          </p>
          {patient?.allergies && (
            <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-800">
              Allergies : {patient.allergies}
            </p>
          )}
        </div>

        {prescription.diagnostic_motif && (
          <p><strong>Diagnostic / motif :</strong> {prescription.diagnostic_motif}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#C5D9D0] text-[10px] uppercase tracking-wide text-[#7A9A90]">
                <th className="py-2 pr-2">Médicament</th>
                <th className="py-2 pr-2">Dosage</th>
                <th className="py-2 pr-2">Forme</th>
                <th className="py-2 pr-2">Posologie</th>
                <th className="py-2 pr-2">Durée</th>
                <th className="py-2">Qté</th>
              </tr>
            </thead>
            <tbody>
              {(prescription.medicaments || []).map((m, i) => (
                <tr key={i} className="border-b border-[#E8F2EF]">
                  <td className="py-2 pr-2 font-medium">
                    {m.nom_dci || m.nom}
                    {m.nom_commercial ? <span className="block text-[10px] font-normal text-[#5A8A7A]">{m.nom_commercial}</span> : null}
                    {m.instructions ? <span className="block text-[10px] text-[#1A7A6D]">{m.instructions}</span> : null}
                  </td>
                  <td className="py-2 pr-2">{m.dosage}</td>
                  <td className="py-2 pr-2">{m.forme || '—'}</td>
                  <td className="py-2 pr-2">{m.posologie || m.frequence}</td>
                  <td className="py-2 pr-2">{m.duree}</td>
                  <td className="py-2">{m.quantite || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {prescription.instructions_generales && (
          <p className="text-xs"><strong>Instructions :</strong> {prescription.instructions_generales}</p>
        )}
        {prescription.renouvellement && (
          <p className="text-xs font-semibold text-[#1A7A6D]">Renouvellement autorisé</p>
        )}

        <div className="mt-4 flex justify-between border-t border-dashed border-[#C5D9D0] pt-4 text-[11px] text-[#5A8A7A]">
          <span>Signature du médecin</span>
          <span>Cachet — Centre Médical AMEN</span>
        </div>
      </div>
    </article>
  );
}
