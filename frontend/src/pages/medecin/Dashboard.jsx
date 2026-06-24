import { useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';

const PLANNING = [
  { id: 1, heure: '08:00', patient: 'Angélique Tshimanga', motif: 'Consultation générale', statut: 'en_cours', age: 34, type: 'presentiel' },
  { id: 2, heure: '08:30', patient: 'Marcel Nkolo', motif: 'Suivi diabète type 2', statut: 'en_attente', age: 52, type: 'presentiel' },
  { id: 3, heure: '09:00', patient: 'Sandrine Mbuyamba', motif: 'Douleurs abdominales', statut: 'en_attente', age: 28, type: 'teleconsultation' },
  { id: 4, heure: '09:30', patient: 'Pierre Mukendi', motif: 'Bilan de santé annuel', statut: 'en_attente', age: 45, type: 'presentiel' },
  { id: 5, heure: '10:00', patient: 'Christelle Ilunga', motif: 'Fièvre persistante', statut: 'en_attente', age: 23, type: 'presentiel' },
  { id: 6, heure: '10:30', patient: 'Jean-Paul Lumbala', motif: 'Hypertension artérielle', statut: 'en_attente', age: 61, type: 'presentiel' },
  { id: 7, heure: '07:30', patient: 'Marie Kasongo', motif: 'Résultats analyses', statut: 'termine', age: 38, type: 'presentiel' },
];

const DOSSIERS_RECENTS = [
  { id: 1, patient: 'Angélique Tshimanga', date: '2026-06-24', diagnostic: 'Hypertension artérielle', dept: 'Médecine Interne' },
  { id: 2, patient: 'Marcel Nkolo', date: '2026-06-23', diagnostic: 'Diabète type 2 mal équilibré', dept: 'Médecine Interne' },
  { id: 3, patient: 'Sandrine Mbuyamba', date: '2026-06-22', diagnostic: 'Gastrite chronique', dept: 'Médecine Interne' },
];

const STATUT_CONFIG = {
  en_cours: { bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', label: 'En cours' },
  en_attente: { bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'En attente' },
  termine: { bg: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400', label: 'Terminé' },
};

export default function MedecinDashboard() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [noteForm, setNoteForm] = useState({ diagnostic: '', observation: '' });
  const [noteSaved, setNoteSaved] = useState(false);

  const vus = PLANNING.filter(p => p.statut === 'termine').length;
  const restants = PLANNING.filter(p => p.statut === 'en_attente').length;
  const enCours = PLANNING.find(p => p.statut === 'en_cours');

  const saveNote = (e) => {
    e.preventDefault();
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 3000);
  };

  return (
    <Layout title="Espace Médecin">
      {/* Welcome */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bonjour, {user?.name?.split(' ')[0]} 👨‍⚕️</h2>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · Planning du jour
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition">
            📋 Nouveau dossier
          </button>
          <button className="rounded-full bg-medical-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5">
            💊 Nouvelle prescription
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: '📅', label: 'RDV du jour', value: PLANNING.length, sub: 'programmés' },
          { icon: '✅', label: 'Consultés', value: vus, sub: 'ce matin' },
          { icon: '⏳', label: 'En attente', value: restants, sub: 'à recevoir' },
          { icon: '📋', label: 'Dossiers ouverts', value: 3, sub: 'cette semaine' },
        ].map(s => (
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

      {/* Patient en cours */}
      {enCours && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-white shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-widest opacity-90">Consultation en cours</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{enCours.patient}</p>
              <p className="text-sm opacity-80">{enCours.motif} · {enCours.age} ans</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/30 transition">
                📋 Ouvrir dossier
              </button>
              <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow hover:bg-blue-50 transition">
                ✅ Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Planning liste */}
        <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Planning du jour</h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-medical-primary">{PLANNING.length} patients</span>
          </div>
          <div className="divide-y divide-slate-50">
            {PLANNING.map(rdv => {
              const cfg = STATUT_CONFIG[rdv.statut];
              return (
                <div
                  key={rdv.id}
                  onClick={() => setSelected(rdv)}
                  className={`flex cursor-pointer items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 ${selected?.id === rdv.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="w-14 text-center">
                    <span className="text-sm font-bold text-slate-700">{rdv.heure}</span>
                  </div>
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{rdv.patient}</p>
                    <p className="text-xs text-slate-500 truncate">{rdv.motif} · {rdv.age} ans</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {rdv.type === 'teleconsultation' && <span title="Téléconsultation" className="text-base">📹</span>}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg}`}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel droit */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Note rapide */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-3">
              {selected ? `Observation — ${selected.patient}` : '📝 Note rapide'}
            </h3>
            {selected ? (
              <form onSubmit={saveNote} className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Diagnostic</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-blue-100"
                    placeholder="Diagnostic principal..."
                    value={noteForm.diagnostic}
                    onChange={e => setNoteForm(f => ({ ...f, diagnostic: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Observations cliniques</span>
                  <textarea
                    rows={4}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-primary focus:ring-2 focus:ring-blue-100"
                    placeholder="Examen clinique, observations..."
                    value={noteForm.observation}
                    onChange={e => setNoteForm(f => ({ ...f, observation: e.target.value }))}
                  />
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 rounded-xl bg-medical-primary py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
                    {noteSaved ? '✅ Sauvegardé !' : 'Sauvegarder'}
                  </button>
                  <button type="button" onClick={() => setSelected(null)} className="rounded-xl border px-3 py-2 text-sm text-slate-500 hover:bg-slate-50">
                    ✕
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-400">Cliquez sur un patient dans le planning pour ouvrir le panneau d'observation.</p>
            )}
          </div>

          {/* Dossiers récents */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Dossiers récents</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {DOSSIERS_RECENTS.map(d => (
                <div key={d.id} className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition">
                  <p className="text-sm font-medium text-slate-900">{d.patient}</p>
                  <p className="text-xs text-slate-500">{d.diagnostic}</p>
                  <p className="text-xs text-slate-400">{new Date(d.date).toLocaleDateString('fr-FR')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
