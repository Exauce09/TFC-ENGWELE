import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STATUT_CONFIG = {
  confirme: { bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Confirmé' },
  en_attente: { bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'En attente' },
  en_cours: { bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', label: 'En cours' },
  termine: { bg: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400', label: 'Terminé' },
  annule: { bg: 'bg-red-100 text-red-700', dot: 'bg-red-400', label: 'Annulé' },
  absent: { bg: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400', label: 'Absent' },
};

function patientAge(patient) {
  if (!patient?.date_naissance) return null;
  const birth = new Date(patient.date_naissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function patientName(rdv) {
  return rdv?.patient?.user?.name || 'Patient';
}

function formatHeure(heure) {
  return heure ? String(heure).slice(0, 5) : '—';
}

function primaryDiagnostic(dossier) {
  return dossier?.diagnostics?.[0]?.libelle || '—';
}

export default function MedecinDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [planning, setPlanning] = useState([]);
  const [dossiersRecents, setDossiersRecents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [noteForm, setNoteForm] = useState({ diagnostic: '', observation: '' });
  const [noteSaved, setNoteSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/medecin/dashboard');
      const data = res.data.data || {};
      setStats(data);
      setPlanning(data.planning_du_jour || []);
      setDossiersRecents(data.dossiers_recents || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger le tableau de bord');
      setStats(null);
      setPlanning([]);
      setDossiersRecents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const enCours = stats?.rdv_en_cours || planning.find((p) => p.statut === 'en_cours');

  const updateStatut = async (id, statut) => {
    try {
      await api.put(`/medecin/rendez-vous/${id}/statut`, { statut });
      await load();
      if (selected?.id === id && statut === 'termine') setSelected(null);
    } catch {
      alert('Impossible de mettre à jour le statut');
    }
  };

  const saveNote = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await api.post('/medecin/dossiers', {
        patient_id: selected.patient_id,
        departement_id: selected.departement_id,
        rendez_vous_id: selected.id,
        date_consultation: selected.date_rdv?.slice?.(0, 10) || new Date().toISOString().slice(0, 10),
        motif: selected.motif || 'Consultation',
        observations: noteForm.observation || null,
        diagnostic: noteForm.diagnostic
          ? { libelle: noteForm.diagnostic }
          : undefined,
      });
      setNoteSaved(true);
      setNoteForm({ diagnostic: '', observation: '' });
      setTimeout(() => setNoteSaved(false), 3000);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const selectRdv = (rdv) => {
    setSelected(rdv);
    setNoteForm({ diagnostic: '', observation: '' });
  };

  if (loading) {
    return (
      <Layout title="Espace Médecin">
        <p className="text-slate-500">Chargement du tableau de bord...</p>
      </Layout>
    );
  }

  return (
    <Layout title="Espace Médecin">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bonjour, {user?.name?.split(' ')[0]} 👨‍⚕️</h2>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · Planning du jour
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/medecin/dossiers"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            📋 Nouveau dossier
          </Link>
          <Link to="/medecin/dossiers"
            className="rounded-full bg-medical-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5">
            💊 Nouvelle prescription
          </Link>
        </div>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: '📅', label: 'RDV du jour', value: stats?.rdv_du_jour ?? 0, sub: 'programmés' },
          { icon: '✅', label: 'Consultés', value: stats?.rdv_termines ?? 0, sub: "aujourd'hui" },
          { icon: '⏳', label: 'En attente', value: stats?.rdv_en_attente ?? 0, sub: 'à recevoir' },
          { icon: '📋', label: 'Dossiers ouverts', value: stats?.dossiers_semaine ?? 0, sub: 'cette semaine' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {enCours && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-white shadow-xl">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
            <p className="text-xs font-semibold uppercase tracking-widest opacity-90">Consultation en cours</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{patientName(enCours)}</p>
              <p className="text-sm opacity-80">
                {enCours.motif || 'Consultation'}
                {patientAge(enCours.patient) != null && ` · ${patientAge(enCours.patient)} ans`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/medecin/dossiers"
                className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/30">
                📋 Ouvrir dossier
              </Link>
              <button type="button" onClick={() => updateStatut(enCours.id, 'termine')}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow transition hover:bg-blue-50">
                ✅ Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold text-slate-900">Planning du jour</h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-medical-primary">
              {planning.length} patient{planning.length !== 1 ? 's' : ''}
            </span>
          </div>
          {planning.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <p className="text-4xl">📅</p>
              <p className="mt-3 font-medium">Aucun rendez-vous aujourd&apos;hui</p>
              <Link to="/medecin/planning" className="mt-2 inline-block text-sm text-medical-primary hover:underline">
                Voir le planning complet →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {planning.map((rdv) => {
                const cfg = STATUT_CONFIG[rdv.statut] || STATUT_CONFIG.en_attente;
                const age = patientAge(rdv.patient);
                return (
                  <div
                    key={rdv.id}
                    onClick={() => selectRdv(rdv)}
                    className={`flex cursor-pointer items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 ${selected?.id === rdv.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="w-14 text-center">
                      <span className="text-sm font-bold text-slate-700">{formatHeure(rdv.heure_rdv)}</span>
                    </div>
                    <div className={`h-2 w-2 flex-shrink-0 rounded-full ${cfg.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{patientName(rdv)}</p>
                      <p className="truncate text-xs text-slate-500">
                        {rdv.motif || 'Consultation'}
                        {age != null && ` · ${age} ans`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {rdv.type === 'teleconsultation' && <span title="Téléconsultation" className="text-base">📹</span>}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold text-slate-900">
              {selected ? `Observation — ${patientName(selected)}` : '📝 Note rapide'}
            </h3>
            {selected ? (
              <form onSubmit={saveNote} className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Diagnostic</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-blue-100"
                    placeholder="Diagnostic principal..."
                    value={noteForm.diagnostic}
                    onChange={(e) => setNoteForm((f) => ({ ...f, diagnostic: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Observations cliniques</span>
                  <textarea
                    rows={4}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-blue-100"
                    placeholder="Examen clinique, observations..."
                    value={noteForm.observation}
                    onChange={(e) => setNoteForm((f) => ({ ...f, observation: e.target.value }))}
                  />
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving}
                    className="flex-1 rounded-xl bg-medical-primary py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                    {noteSaved ? '✅ Sauvegardé !' : saving ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                  {selected.statut !== 'termine' && (
                    <button type="button" onClick={() => updateStatut(selected.id, 'en_cours')}
                      className="rounded-xl border px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                      ▶ Démarrer
                    </button>
                  )}
                  <button type="button" onClick={() => setSelected(null)}
                    className="rounded-xl border px-3 py-2 text-sm text-slate-500 hover:bg-slate-50">
                    ✕
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-400">
                Cliquez sur un patient dans le planning pour ouvrir le panneau d&apos;observation.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-slate-900">Dossiers récents</h3>
            </div>
            {dossiersRecents.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">Aucun dossier récent.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {dossiersRecents.map((d) => (
                  <Link key={d.id} to="/medecin/dossiers"
                    className="block px-5 py-3 transition hover:bg-slate-50">
                    <p className="text-sm font-medium text-slate-900">{d.patient?.user?.name || 'Patient'}</p>
                    <p className="text-xs text-slate-500">{primaryDiagnostic(d)}</p>
                    <p className="text-xs text-slate-400">
                      {d.date_consultation
                        ? new Date(d.date_consultation).toLocaleDateString('fr-FR')
                        : '—'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
