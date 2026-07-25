import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const URGENCES = [
  { value: 'critique', label: 'Critique (rouge)', color: 'bg-red-100 text-red-800' },
  { value: 'urgent', label: 'Urgent (orange)', color: 'bg-orange-100 text-orange-800' },
  { value: 'moins_urgent', label: 'Moins urgent (jaune)', color: 'bg-amber-100 text-amber-800' },
  { value: 'non_urgent', label: 'Non urgent (vert)', color: 'bg-emerald-100 text-emerald-800' },
];

const EMPTY = {
  niveau_urgence: 'moins_urgent',
  notes_triage: '',
  temperature: '',
  tension_arterielle: '',
  frequence_cardiaque: '',
  frequence_respiratoire: '',
  saturation_02: '',
  glycemie: '',
  poids_kg: '',
  observations: '',
};

export default function InfirmierTriage() {
  const [file, setFile] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/infirmier/file-triage');
      setFile(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/infirmier/episodes/${selected.id}/triage`, form);
      setSuccess(`Triage terminé pour ${selected.patient?.user?.name} — orienté vers consultation.`);
      setSelected(null);
      setForm(EMPTY);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur triage');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Triage">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Triage à l&apos;arrivée</h2>
        <p className="mt-1 text-sm text-slate-500">
          Étape 2 — Constantes vitales et niveau d&apos;urgence. Puis orientation vers la consultation médicale.
        </p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-bold">File d&apos;attente triage</h3>
          {loading ? <p className="text-slate-500">Chargement...</p> : file.length === 0 ? (
            <p className="rounded-xl border bg-white p-6 text-center text-slate-500">Aucun patient en attente de triage.</p>
          ) : (
            <div className="space-y-2">
              {file.map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => { setSelected(ep); setSuccess(''); }}
                  className={`w-full rounded-xl border p-4 text-left transition ${selected?.id === ep.id ? 'border-medical-primary bg-blue-50' : 'bg-white hover:bg-slate-50'}`}
                >
                  <p className="font-semibold">{ep.patient?.user?.name}</p>
                  <p className="text-xs text-slate-500">{ep.numero_episode} · {ep.motif_arrivee}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(ep.created_at).toLocaleString('fr-FR')}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {selected ? (
            <form onSubmit={submit} className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold">Triage — {selected.patient?.user?.name}</h3>
              <p className="text-sm text-slate-500">Motif : {selected.motif_arrivee}</p>

              <fieldset className="mt-4">
                <legend className="mb-2 text-sm font-medium">Niveau d&apos;urgence *</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {URGENCES.map((u) => (
                    <label key={u.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${form.niveau_urgence === u.value ? u.color : ''}`}>
                      <input type="radio" name="urgence" value={u.value} checked={form.niveau_urgence === u.value}
                        onChange={set('niveau_urgence')} />
                      {u.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Température (°C)', field: 'temperature', type: 'number', step: '0.1' },
                  { label: 'Tension', field: 'tension_arterielle', type: 'text', placeholder: '120/80' },
                  { label: 'FC', field: 'frequence_cardiaque', type: 'number' },
                  { label: 'FR', field: 'frequence_respiratoire', type: 'number' },
                  { label: 'SpO₂ (%)', field: 'saturation_02', type: 'number' },
                  { label: 'Poids (kg)', field: 'poids_kg', type: 'number', step: '0.1' },
                ].map(({ label, field, type, step, placeholder }) => (
                  <label key={field} className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
                    <input type={type} step={step} placeholder={placeholder} value={form[field]} onChange={set(field)}
                      className="w-full rounded-xl border px-3 py-2 text-sm" />
                  </label>
                ))}
              </div>

              <label className="mt-4 block">
                <span className="mb-1 block text-sm font-medium">Notes de triage</span>
                <textarea rows={2} value={form.notes_triage} onChange={set('notes_triage')}
                  className="w-full rounded-xl border px-3 py-2 text-sm" />
              </label>

              <button type="submit" disabled={submitting}
                className="mt-4 rounded-xl bg-medical-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {submitting ? 'Enregistrement...' : 'Valider triage → Consultation'}
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed bg-slate-50 p-10 text-center text-slate-500">
              Sélectionnez un patient dans la file pour démarrer le triage.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
