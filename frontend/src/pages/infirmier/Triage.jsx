import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InfirmierLayout from '../../components/layout/InfirmierLayout';
import { admissionsApi } from '../../services/admissionsApi';
import api from '../../services/api';

const URGENCES = [
  { value: 'critique', label: 'Critique (rouge)', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'urgent', label: 'Urgent (orange)', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'moins_urgent', label: 'Moins urgent (jaune)', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'non_urgent', label: 'Non urgent (vert)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
];

const EMPTY = {
  niveau_urgence: 'moins_urgent',
  notes: '',
  temperature: '',
  tension_arterielle: '',
  frequence_cardiaque: '',
  frequence_respiratoire: '',
  saturation_02: '',
  glycemie: '',
  poids_kg: '',
  taille_cm: '',
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
    } catch {
      setFile([]);
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
    setSuccess('');
    try {
      const payload = {
        niveau_urgence: form.niveau_urgence,
        temperature: form.temperature || null,
        tension_arterielle: form.tension_arterielle || null,
        frequence_cardiaque: form.frequence_cardiaque || null,
        frequence_respiratoire: form.frequence_respiratoire || null,
        saturation_02: form.saturation_02 || null,
        glycemie: form.glycemie || null,
        poids_kg: form.poids_kg || null,
        taille_cm: form.taille_cm || null,
        notes: form.notes || null,
      };
      await admissionsApi.triage(selected.id, payload);
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

  const inputCls = 'w-full rounded-xl border border-[#C9D4E3] bg-white px-3 py-2 text-sm text-[#152238]';

  return (
    <InfirmierLayout title="Triage">
      <div className="mb-6">
        <h2 className="font-infirmier-display text-3xl text-[#152238]">Triage à l&apos;arrivée</h2>
        <p className="mt-1 text-sm text-[#7A8FA8]">
          Constantes vitales et niveau d&apos;urgence, puis orientation vers le médecin.
        </p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-infirmier-display text-lg text-[#152238]">File d&apos;attente</h3>
            <span className="rounded-full bg-[#F8E8E2] px-2.5 py-0.5 text-xs font-bold text-[#C9654B]">
              {file.length}
            </span>
          </div>
          {loading ? (
            <p className="text-[#7A8FA8]">Chargement…</p>
          ) : file.length === 0 ? (
            <p className="infirmier-card p-8 text-center text-[#8FA3BE]">Aucun patient en attente de triage.</p>
          ) : (
            <div className="space-y-2">
              {file.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setSelected(a); setSuccess(''); setForm(EMPTY); }}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selected?.id === a.id
                      ? 'border-[#E07A5F] bg-[#F8E8E2]'
                      : 'border-[#C9D4E3] bg-white hover:border-[#E07A5F]/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {a.patient?.photo ? (
                      <img src={a.patient.photo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF2F7] font-infirmier-display text-[#E07A5F]">
                        {(a.patient?.user?.name || '?').charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#152238]">{a.patient?.user?.name}</p>
                      <p className="truncate text-xs text-[#7A8FA8]">
                        {a.numero_admission} · {a.motif_arrivee}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#8FA3BE]">
                        {a.arrivee_at ? new Date(a.arrivee_at).toLocaleString('fr-FR') : ''}
                        {a.departement?.nom ? ` · ${a.departement.nom}` : ''}
                      </p>
                      {a.patient?.allergies && (
                        <p className="mt-1 text-[11px] font-semibold text-red-700">⚠ {a.patient.allergies}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {selected ? (
            <form onSubmit={submit} className="infirmier-card-accent p-6">
              <div className="flex items-start gap-3">
                {selected.patient?.photo ? (
                  <img src={selected.patient.photo} alt="" className="h-14 w-14 rounded-xl object-cover" />
                ) : null}
                <div>
                  <h3 className="font-infirmier-display text-xl text-[#152238]">
                    {selected.patient?.user?.name}
                  </h3>
                  <p className="text-sm text-[#7A8FA8]">Motif : {selected.motif_arrivee}</p>
                  <Link to={`/parcours/${selected.id}`} className="text-xs font-semibold text-[#E07A5F] hover:underline">
                    Voir le parcours →
                  </Link>
                </div>
              </div>

              <fieldset className="mt-5">
                <legend className="mb-2 text-sm font-semibold text-[#152238]">Niveau d&apos;urgence *</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {URGENCES.map((u) => (
                    <label
                      key={u.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                        form.niveau_urgence === u.value ? u.color : 'border-[#C9D4E3] bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="urgence"
                        value={u.value}
                        checked={form.niveau_urgence === u.value}
                        onChange={set('niveau_urgence')}
                      />
                      {u.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Température (°C)', field: 'temperature', type: 'number', step: '0.1' },
                  { label: 'Tension', field: 'tension_arterielle', type: 'text', placeholder: '120/80' },
                  { label: 'FC (bpm)', field: 'frequence_cardiaque', type: 'number' },
                  { label: 'FR', field: 'frequence_respiratoire', type: 'number' },
                  { label: 'SpO₂ (%)', field: 'saturation_02', type: 'number' },
                  { label: 'Glycémie', field: 'glycemie', type: 'number', step: '0.1' },
                  { label: 'Poids (kg)', field: 'poids_kg', type: 'number', step: '0.1' },
                  { label: 'Taille (cm)', field: 'taille_cm', type: 'number', step: '0.1' },
                ].map(({ label, field, type, step, placeholder }) => (
                  <label key={field} className="block">
                    <span className="mb-1 block text-xs font-medium text-[#7A8FA8]">{label}</span>
                    <input
                      type={type}
                      step={step}
                      placeholder={placeholder}
                      value={form[field]}
                      onChange={set(field)}
                      className={inputCls}
                    />
                  </label>
                ))}
              </div>

              <label className="mt-4 block">
                <span className="mb-1 block text-sm font-medium text-[#152238]">Notes de triage</span>
                <textarea rows={2} value={form.notes} onChange={set('notes')} className={inputCls} />
              </label>

              <button type="submit" disabled={submitting} className="infirmier-btn mt-4 disabled:opacity-60">
                {submitting ? 'Enregistrement…' : 'Valider triage → Consultation'}
              </button>
            </form>
          ) : (
            <div className="infirmier-card border-dashed p-10 text-center text-[#8FA3BE]">
              Sélectionnez un patient dans la file pour démarrer le triage.
            </div>
          )}
        </div>
      </div>
    </InfirmierLayout>
  );
}
