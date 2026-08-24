import { useEffect, useState } from 'react';
import MedecinLayout from '../../components/layout/MedecinLayout';
import JitsiMeet from '../../components/JitsiMeet';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUT = {
  en_attente: 'bg-amber-100 text-amber-800',
  confirme: 'bg-emerald-100 text-emerald-700',
  en_cours: 'bg-blue-100 text-blue-700',
};

const EMPTY_FORM = {
  patient_id: '',
  date_rdv: '',
  heure_rdv: '10:00',
  motif: 'Téléconsultation',
};

export default function MedecinTeleconsultation() {
  const { user } = useAuth();
  const [salles, setSalles] = useState([]);
  const [patients, setPatients] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [closing, setClosing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [salleRes, patientRes] = await Promise.all([
        api.get('/teleconsultation'),
        api.get('/medecin/patients').catch(() => ({ data: { data: [] } })),
      ]);
      setSalles(salleRes.data.data || []);
      const plist = patientRes.data.data;
      setPatients(Array.isArray(plist) ? plist : (plist?.data || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les salles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const rejoindre = async (rdv) => {
    setJoining(true);
    setError('');
    try {
      if (rdv.statut === 'en_attente') {
        await api.put(`/medecin/rendez-vous/${rdv.id}/statut`, { statut: 'confirme' });
      }
      const res = await api.post(`/teleconsultation/${rdv.id}/rejoindre`);
      setActive(res.data.data);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion impossible');
    } finally {
      setJoining(false);
    }
  };

  const fermer = async () => {
    if (!active?.rendez_vous?.id) {
      setActive(null);
      return;
    }
    setClosing(true);
    try {
      await api.post(`/teleconsultation/${active.rendez_vous.id}/fermer`);
      setActive(null);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de clôturer');
    } finally {
      setClosing(false);
    }
  };

  const creer = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/medecin/rendez-vous', {
        patient_id: Number(form.patient_id),
        date_rdv: form.date_rdv,
        heure_rdv: form.heure_rdv,
        motif: form.motif || 'Téléconsultation',
        type: 'teleconsultation',
        confirmer: true,
      });
      setSuccess('Téléconsultation créée et confirmée. Le patient doit régler le paiement avant de rejoindre.');
      setForm(EMPTY_FORM);
      setShowForm(false);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Création impossible');
    } finally {
      setCreating(false);
    }
  };

  return (
    <MedecinLayout title="Téléconsultation">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-medecin-display text-3xl text-[#0D3B3A]">Téléconsultation</h2>
          <p className="mt-1 text-sm text-[#5A8A7A]">
            Confirmez ou créez un RDV vidéo, puis ouvrez la salle Jitsi avec le patient.
          </p>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="medecin-btn">
          {showForm ? 'Fermer' : '+ Créer une téléconsultation'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>
      )}

      {showForm && (
        <form onSubmit={creer} className="medecin-card mb-6 grid gap-3 p-5 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-[#0D3B3A]">Patient *</span>
            <select
              required
              value={form.patient_id}
              onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value }))}
              className="w-full rounded-xl border border-[#C5D9D0] px-3 py-2 text-sm"
            >
              <option value="">— Choisir —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user?.name || p.numero_patient || `Patient #${p.id}`}
                  {p.numero_patient ? ` (${p.numero_patient})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#0D3B3A]">Date *</span>
            <input
              type="date"
              required
              value={form.date_rdv}
              onChange={(e) => setForm((f) => ({ ...f, date_rdv: e.target.value }))}
              className="w-full rounded-xl border border-[#C5D9D0] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#0D3B3A]">Heure *</span>
            <input
              type="time"
              required
              value={form.heure_rdv}
              onChange={(e) => setForm((f) => ({ ...f, heure_rdv: e.target.value }))}
              className="w-full rounded-xl border border-[#C5D9D0] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-[#0D3B3A]">Motif</span>
            <input
              value={form.motif}
              onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
              className="w-full rounded-xl border border-[#C5D9D0] px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={creating} className="medecin-btn disabled:opacity-50">
              {creating ? 'Création…' : 'Créer et confirmer'}
            </button>
          </div>
        </form>
      )}

      {active ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[#5A8A7A]">
                Patient : <strong className="text-[#0D3B3A]">{active.rendez_vous?.patient?.user?.name}</strong>
              </p>
              {active.room_name && (
                <p className="mt-1 font-mono text-xs text-[#7A9A90]">{active.room_name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setActive(null)} className="medecin-btn-ghost">
                Quitter
              </button>
              <button type="button" onClick={fermer} disabled={closing} className="medecin-btn disabled:opacity-50">
                {closing ? 'Clôture…' : 'Clôturer la séance'}
              </button>
            </div>
          </div>
          <JitsiMeet
            roomUrl={active.room_url}
            roomName={active.room_name}
            displayName={user?.name}
          />
        </div>
      ) : loading ? (
        <p className="text-[#5A8A7A]">Chargement…</p>
      ) : salles.length === 0 ? (
        <div className="medecin-card border-dashed p-12 text-center">
          <p className="font-medium text-[#0D3B3A]">Aucune téléconsultation</p>
          <p className="mt-1 text-sm text-[#5A8A7A]">Créez-en une ou attendez une demande patient.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {salles.map((r) => (
            <article key={r.id} className="medecin-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#0D3B3A]">
                    {new Date(r.date_rdv).toLocaleDateString('fr-FR')} · {String(r.heure_rdv).slice(0, 5)}
                  </p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUT[r.statut] ?? 'bg-slate-100'}`}>
                    {r.statut?.replace(/_/g, ' ')}
                  </span>
                  {r.paiement_statut === 'paye' ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Payé</span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">En attente paiement</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[#5A8A7A]">
                  {r.patient?.user?.name || 'Patient'}
                  {r.departement?.nom ? ` — ${r.departement.nom}` : ''}
                </p>
                {r.room_name && (
                  <p className="mt-1 font-mono text-[10px] text-[#7A9A90]">{r.room_name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => rejoindre(r)}
                disabled={joining}
                className="medecin-btn disabled:opacity-50"
              >
                {joining ? 'Connexion…' : r.statut === 'en_attente' ? 'Confirmer & ouvrir' : 'Ouvrir la salle'}
              </button>
            </article>
          ))}
        </div>
      )}
    </MedecinLayout>
  );
}
