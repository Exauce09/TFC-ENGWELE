import { useEffect, useState } from 'react';
import InfirmierLayout from '../../components/layout/InfirmierLayout';
import api from '../../services/api';

const EMPTY = {
  patient_id: '',
  temperature: '',
  tension_arterielle: '',
  frequence_cardiaque: '',
  frequence_respiratoire: '',
  saturation_02: '',
  glycemie: '',
  poids_kg: '',
  observations: '',
};

export default function InfirmierConstantes() {
  const [constantes, setConstantes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/infirmier/constantes');
      setConstantes(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const searchPatients = async (q) => {
    setSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    const res = await api.get('/infirmier/patients', { params: { q } });
    setPatients(res.data.data || []);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.patient_id) { setError('Sélectionnez un patient.'); return; }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/infirmier/constantes', form);
      setSuccess('Constantes enregistrées.');
      setForm(EMPTY);
      setSearch('');
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const inputCls = 'w-full rounded-xl border border-[#C9D4E3] bg-white px-3 py-2.5 text-sm text-[#152238]';

  return (
    <InfirmierLayout title="Constantes vitales">
      <div className="mb-6">
        <h2 className="font-infirmier-display text-3xl text-[#152238]">Saisie des constantes</h2>
        <p className="text-sm text-[#7A8FA8]">Signes vitaux à l&apos;accueil ou en salle de soins.</p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      <form onSubmit={submit} className="infirmier-card-accent mb-8 p-6">
        <h3 className="font-infirmier-display text-lg text-[#152238]">Nouvelle saisie</h3>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-[#152238]">Patient *</span>
          <input
            value={search}
            onChange={(e) => searchPatients(e.target.value)}
            placeholder="Rechercher par nom ou n° patient…"
            className={inputCls}
          />
          {patients.length > 0 && (
            <div className="mt-1 overflow-hidden rounded-xl border border-[#C9D4E3] bg-white shadow-lg">
              {patients.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, patient_id: pt.id }));
                    setSearch(pt.user?.name || '');
                    setPatients([]);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-[#F8E8E2]"
                >
                  {pt.photo ? (
                    <img src={pt.photo} alt="" className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2F7] text-xs font-bold text-[#E07A5F]">
                      {(pt.user?.name || '?').charAt(0)}
                    </div>
                  )}
                  <span>
                    <span className="font-medium text-[#152238]">{pt.user?.name}</span>
                    <span className="text-[#7A8FA8]"> — {pt.numero_patient}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Température (°C)', field: 'temperature', type: 'number', step: '0.1' },
            { label: 'Tension artérielle', field: 'tension_arterielle', type: 'text', placeholder: '120/80' },
            { label: 'Fréq. cardiaque', field: 'frequence_cardiaque', type: 'number' },
            { label: 'Fréq. respiratoire', field: 'frequence_respiratoire', type: 'number' },
            { label: 'Saturation O₂ (%)', field: 'saturation_02', type: 'number' },
            { label: 'Glycémie (g/L)', field: 'glycemie', type: 'number', step: '0.1' },
            { label: 'Poids (kg)', field: 'poids_kg', type: 'number', step: '0.1' },
          ].map(({ label, field, type, step, placeholder }) => (
            <label key={field} className="block">
              <span className="mb-1 block text-sm font-medium text-[#152238]">{label}</span>
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
          <span className="mb-1 block text-sm font-medium text-[#152238]">Observations</span>
          <textarea rows={2} value={form.observations} onChange={set('observations')} className={inputCls} />
        </label>

        <button type="submit" disabled={submitting} className="infirmier-btn mt-4 disabled:opacity-60">
          {submitting ? 'Enregistrement…' : 'Enregistrer les constantes'}
        </button>
      </form>

      <h3 className="mb-3 font-infirmier-display text-lg text-[#152238]">Historique récent</h3>
      {loading ? (
        <p className="text-[#7A8FA8]">Chargement…</p>
      ) : constantes.length === 0 ? (
        <p className="infirmier-card p-8 text-center text-[#8FA3BE]">Aucune saisie.</p>
      ) : (
        <div className="space-y-3">
          {constantes.map((c) => (
            <article key={c.id} className="infirmier-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#152238]">{c.patient?.user?.name}</p>
                  <p className="text-xs text-[#8FA3BE]">
                    {c.date_soin ? new Date(c.date_soin).toLocaleString('fr-FR') : '—'}
                    {c.infirmier?.name ? ` · Par ${c.infirmier.name}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {c.temperature && (
                  <div className="rounded-lg bg-red-50 p-2 text-center">
                    <p className="text-[10px] uppercase text-[#8FA3BE]">Temp.</p>
                    <p className="font-bold text-red-600">{c.temperature}°C</p>
                  </div>
                )}
                {c.tension_arterielle && (
                  <div className="rounded-lg bg-sky-50 p-2 text-center">
                    <p className="text-[10px] uppercase text-[#8FA3BE]">TA</p>
                    <p className="font-bold text-[#152238]">{c.tension_arterielle}</p>
                  </div>
                )}
                {c.frequence_cardiaque && (
                  <div className="rounded-lg bg-rose-50 p-2 text-center">
                    <p className="text-[10px] uppercase text-[#8FA3BE]">FC</p>
                    <p className="font-bold text-[#152238]">{c.frequence_cardiaque} bpm</p>
                  </div>
                )}
                {c.saturation_02 && (
                  <div className="rounded-lg bg-cyan-50 p-2 text-center">
                    <p className="text-[10px] uppercase text-[#8FA3BE]">SpO₂</p>
                    <p className="font-bold text-[#152238]">{c.saturation_02}%</p>
                  </div>
                )}
              </div>
              {c.observations && <p className="mt-2 text-xs text-[#7A8FA8]">{c.observations}</p>}
            </article>
          ))}
        </div>
      )}
    </InfirmierLayout>
  );
}
