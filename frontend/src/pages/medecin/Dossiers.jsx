import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const EMPTY = {
  patient_id: '',
  departement_id: '',
  date_consultation: new Date().toISOString().slice(0, 10),
  motif: '',
  anamnese: '',
  examen_clinique: '',
  observations: '',
  diagnostic: { libelle: '', code_cim10: '', description: '' },
};

export default function MedecinDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [dRes, deptRes] = await Promise.all([
        api.get('/medecin/dossiers'),
        api.get('/departements'),
      ]);
      setDossiers(dRes.data.data || []);
      setDepartements(deptRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const searchPatients = async (q) => {
    setSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    const res = await api.get('/medecin/patients', { params: { q } });
    setPatients(res.data.data || []);
  };

  const openDetail = async (id) => {
    const res = await api.get(`/medecin/dossiers/${id}`);
    setSelected(res.data.data);
    setShowForm(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/medecin/dossiers', form);
      setSuccess('Dossier créé avec succès.');
      setShowForm(false);
      setForm(EMPTY);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dossiers médicaux</h2>
          <p className="text-sm text-slate-500">Consulter et créer les dossiers de vos patients.</p>
        </div>
        <button onClick={() => { setShowForm(true); setSelected(null); }}
          className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-semibold text-white shadow hover:-translate-y-0.5 transition">
          + Nouveau dossier
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {showForm && (
        <form onSubmit={submit} className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Nouvelle consultation</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Rechercher un patient</span>
              <input value={search} onChange={(e) => searchPatients(e.target.value)}
                placeholder="Nom ou n° patient..." className="w-full rounded-xl border px-3 py-2.5 text-sm" />
              {patients.length > 0 && (
                <div className="mt-1 rounded-xl border bg-white shadow-lg">
                  {patients.map((pt) => (
                    <button key={pt.id} type="button"
                      onClick={() => { setForm((f) => ({ ...f, patient_id: pt.id })); setSearch(pt.user?.name || ''); setPatients([]); }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-50">
                      {pt.user?.name} — {pt.numero_patient}
                    </button>
                  ))}
                </div>
              )}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Département *</span>
              <select required value={form.departement_id} onChange={(e) => setForm((f) => ({ ...f, departement_id: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="">Choisir...</option>
                {departements.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Date *</span>
              <input type="date" required value={form.date_consultation}
                onChange={(e) => setForm((f) => ({ ...f, date_consultation: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Motif *</span>
              <input required value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Anamnèse</span>
              <textarea rows={2} value={form.anamnese} onChange={(e) => setForm((f) => ({ ...f, anamnese: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Examen clinique</span>
              <textarea rows={2} value={form.examen_clinique} onChange={(e) => setForm((f) => ({ ...f, examen_clinique: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Diagnostic</span>
              <input placeholder="Libellé du diagnostic" value={form.diagnostic.libelle}
                onChange={(e) => setForm((f) => ({ ...f, diagnostic: { ...f.diagnostic, libelle: e.target.value } }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm font-medium">Annuler</button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-medical-primary px-6 py-2 text-sm font-bold text-white disabled:opacity-60">
              {submitting ? 'Enregistrement...' : 'Enregistrer le dossier'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {loading ? <p className="text-slate-500">Chargement...</p> : dossiers.length === 0 ? (
            <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucun dossier.</p>
          ) : dossiers.map((d) => (
            <button key={d.id} onClick={() => openDetail(d.id)}
              className={`w-full rounded-xl border p-4 text-left transition hover:shadow-md ${selected?.id === d.id ? 'border-medical-primary bg-blue-50' : 'bg-white'}`}>
              <p className="font-semibold text-slate-900">{d.patient?.user?.name || 'Patient'}</p>
              <p className="text-sm text-slate-600">{d.motif}</p>
              <p className="text-xs text-slate-400">
                {d.departement?.nom} · {new Date(d.date_consultation).toLocaleDateString('fr-FR')}
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm min-h-[300px]">
          {selected ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selected.patient?.user?.name}</h3>
                  <p className="text-sm text-slate-500">{selected.motif}</p>
                </div>
                <button onClick={() => addPrescription(selected)}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">
                  + Prescription
                </button>
              </div>
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
                    <p key={pr.id} className="text-sm text-slate-600 mt-1">
                      {(pr.medicaments || []).map((m) => m.nom).join(', ')}
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-slate-400 py-16">Sélectionnez un dossier.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
