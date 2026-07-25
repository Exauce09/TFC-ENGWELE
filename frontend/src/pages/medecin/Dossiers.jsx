import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const EMPTY_CONSULT = {
  motif: '',
  anamnese: '',
  examen_clinique: '',
  observations: '',
  diagnostic: { libelle: '', code_cim10: '', description: '' },
  cloturer: false,
};

export default function MedecinDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_CONSULT);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const dRes = await api.get('/medecin/dossiers');
      setDossiers(dRes.data.data || []);
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
      motif: d.motif || '',
      anamnese: d.anamnese || '',
      examen_clinique: d.examen_clinique || '',
      observations: d.observations || '',
      diagnostic: { libelle: '', code_cim10: '', description: '' },
      cloturer: false,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.diagnostic?.libelle) delete payload.diagnostic;
      await api.put(`/medecin/dossiers/${selected.id}`, payload);
      setSuccess('Consultation enregistrée sur le dossier ouvert à la réception.');
      setEditing(false);
      void openDetail(selected.id);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const addPrescription = async (dossier) => {
    const nom = prompt('Nom du médicament :');
    if (!nom) return;
    try {
      await api.post('/medecin/prescriptions', {
        dossier_id: dossier.id,
        patient_id: dossier.patient_id,
        date_prescription: new Date().toISOString().slice(0, 10),
        medicaments: [{ nom, dosage: '500mg', frequence: '2x/jour', duree: '7 jours' }],
      });
      setSuccess('Prescription ajoutée.');
      void openDetail(dossier.id);
    } catch {
      setError('Impossible d\'ajouter la prescription.');
    }
  };

  return (
    <Layout title="Dossiers Médicaux">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Dossiers médicaux</h2>
        <p className="text-sm text-slate-500">
          Les dossiers sont <strong>ouverts à la réception</strong>. Ici vous complétez la consultation (anamnèse, examen, diagnostic).
        </p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {loading ? <p className="text-slate-500">Chargement...</p> : dossiers.length === 0 ? (
            <p className="rounded-xl border bg-white p-8 text-center text-slate-500">
              Aucun dossier. L&apos;accueil doit d&apos;abord enregistrer le patient à son arrivée.
            </p>
          ) : dossiers.map((d) => (
            <button key={d.id} type="button" onClick={() => openDetail(d.id)}
              className={`w-full rounded-xl border p-4 text-left transition hover:shadow-md ${selected?.id === d.id ? 'border-medical-primary bg-blue-50' : 'bg-white'}`}>
              <div className="flex justify-between gap-2">
                <p className="font-semibold text-slate-900">{d.patient?.user?.name || 'Patient'}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{d.statut || 'ouvert'}</span>
              </div>
              <p className="text-sm text-slate-600">{d.motif}</p>
              <p className="text-xs text-slate-400">
                {d.numero_dossier || `DOS-${d.id}`} · {d.departement?.nom} · {new Date(d.date_consultation).toLocaleDateString('fr-FR')}
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm min-h-[300px]">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold">{selected.patient?.user?.name}</h3>
                  <p className="text-sm text-slate-500">{selected.numero_dossier} · {selected.motif}</p>
                  {selected.ouvert_par && (
                    <p className="text-xs text-slate-400">Ouvert à l&apos;accueil par {selected.ouvert_par.name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing(true)}
                    className="rounded-lg bg-medical-primary px-3 py-1.5 text-xs font-bold text-white">
                    Compléter consultation
                  </button>
                  <button type="button" onClick={() => addPrescription(selected)}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">
                    + Prescription
                  </button>
                </div>
              </div>

              {editing ? (
                <form onSubmit={submit} className="mt-4 space-y-3 border-t pt-4">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Motif</span>
                    <input value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
                      className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Anamnèse</span>
                    <textarea rows={2} value={form.anamnese} onChange={(e) => setForm((f) => ({ ...f, anamnese: e.target.value }))}
                      className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Examen clinique</span>
                    <textarea rows={2} value={form.examen_clinique} onChange={(e) => setForm((f) => ({ ...f, examen_clinique: e.target.value }))}
                      className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">Diagnostic</span>
                    <input placeholder="Libellé" value={form.diagnostic.libelle}
                      onChange={(e) => setForm((f) => ({ ...f, diagnostic: { ...f.diagnostic, libelle: e.target.value } }))}
                      className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.cloturer}
                      onChange={(e) => setForm((f) => ({ ...f, cloturer: e.target.checked }))} />
                    Clôturer le dossier
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditing(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
                    <button type="submit" disabled={submitting} className="rounded-xl bg-medical-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
                      {submitting ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {selected.anamnese && <p className="mt-3 text-sm"><strong>Anamnèse :</strong> {selected.anamnese}</p>}
                  {selected.examen_clinique && <p className="mt-2 text-sm"><strong>Examen :</strong> {selected.examen_clinique}</p>}
                  {selected.diagnostics?.map((diag) => (
                    <div key={diag.id} className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm">
                      <strong>Diagnostic :</strong> {diag.libelle}
                    </div>
                  ))}
                  {selected.prescriptions?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase text-slate-400">Prescriptions</p>
                      {selected.prescriptions.map((pr) => (
                        <p key={pr.id} className="mt-1 text-sm text-slate-600">
                          {(pr.medicaments || []).map((m) => m.nom).join(', ')}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <p className="py-16 text-center text-slate-400">Sélectionnez un dossier ouvert à la réception.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
