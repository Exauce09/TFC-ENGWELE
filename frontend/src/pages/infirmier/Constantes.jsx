import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
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

  return (
    <Layout title="Constantes Vitales">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Saisie des constantes vitales</h2>
        <p className="text-sm text-slate-500">Enregistrez les signes vitaux des patients à l'accueil ou en salle de soins.</p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <form onSubmit={submit} className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Nouvelle saisie</h3>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">Patient *</span>
          <input value={search} onChange={(e) => searchPatients(e.target.value)}
            placeholder="Rechercher par nom..." className="w-full rounded-xl border px-3 py-2.5 text-sm" />
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
              <span className="mb-1 block text-sm font-medium">{label}</span>
              <input type={type} step={step} placeholder={placeholder} value={form[field]} onChange={set(field)}
                className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium">Observations</span>
          <textarea rows={2} value={form.observations} onChange={set('observations')}
            className="w-full rounded-xl border px-3 py-2.5 text-sm" />
        </label>
        <button type="submit" disabled={submitting}
          className="mt-4 rounded-xl bg-medical-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {submitting ? 'Enregistrement...' : 'Enregistrer les constantes'}
        </button>
      </form>

      <h3 className="mb-3 text-lg font-bold text-slate-900">Historique récent</h3>
      {loading ? <p className="text-slate-500">Chargement...</p> : constantes.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucune saisie.</p>
      ) : (
        <div className="space-y-3">
          {constantes.map((c) => (
            <article key={c.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{c.patient?.user?.name}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(c.date_soin).toLocaleString('fr-FR')} · Par {c.infirmier?.name}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {c.temperature && <div className="rounded-lg bg-red-50 p-2 text-center"><p className="text-xs text-slate-400">Temp.</p><p className="font-bold text-red-600">{c.temperature}°C</p></div>}
                {c.tension_arterielle && <div className="rounded-lg bg-blue-50 p-2 text-center"><p className="text-xs text-slate-400">TA</p><p className="font-bold">{c.tension_arterielle}</p></div>}
                {c.frequence_cardiaque && <div className="rounded-lg bg-pink-50 p-2 text-center"><p className="text-xs text-slate-400">FC</p><p className="font-bold">{c.frequence_cardiaque} bpm</p></div>}
                {c.saturation_02 && <div className="rounded-lg bg-cyan-50 p-2 text-center"><p className="text-xs text-slate-400">SpO₂</p><p className="font-bold">{c.saturation_02}%</p></div>}
              </div>
              {c.observations && <p className="mt-2 text-xs text-slate-500">{c.observations}</p>}
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
