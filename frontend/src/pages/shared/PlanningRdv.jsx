import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import MedecinLayout from '../../components/layout/MedecinLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STATUT_COLORS = {
  confirme: 'bg-emerald-100 text-emerald-700',
  en_attente: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-blue-100 text-blue-700',
  termine: 'bg-slate-100 text-slate-600',
  annule: 'bg-red-100 text-red-700',
  absent: 'bg-orange-100 text-orange-700',
};

const STATUTS = ['en_attente', 'confirme', 'en_cours', 'termine', 'annule', 'absent'];

const MEDECIN_SHELL_ROLES = [
  'medecin_generaliste',
  'medecin_interne',
  'pediatre',
  'gynecologue',
  'ophtalmologue',
  'urgentiste',
];

export default function PlanningRdv({ title = 'Planning RDV' }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const useMedecinShell = MEDECIN_SHELL_ROLES.includes(user?.role);
  const Shell = useMedecinShell ? MedecinLayout : Layout;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/medecin/planning', { params: { date } });
      setItems(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur planning');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [date]);

  const updateStatut = async (id, statut) => {
    try {
      await api.put(`/medecin/rendez-vous/${id}/statut`, { statut });
      void load();
    } catch {
      alert('Impossible de mettre à jour le statut');
    }
  };

  return (
    <Shell title={title}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className={`text-3xl ${useMedecinShell ? 'font-medecin-display text-[#0D3B3A]' : 'font-bold text-slate-900'}`}>
            {title}
          </h2>
          <p className={`text-sm ${useMedecinShell ? 'text-[#5A8A7A]' : 'text-slate-500'}`}>
            Rendez-vous qui vous sont assignés (ou de votre service).
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <p className="font-medium text-slate-800">Aucun rendez-vous pour cette date</p>
          <p className="mt-2 text-sm text-slate-500">
            Changez la date, ou vérifiez qu&apos;un RDV vous a été assigné à l&apos;accueil pour ce service.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {String(item.heure_rdv).slice(0, 5)} — {item.patient?.user?.name || 'Patient'}
                  </p>
                  <p className="text-sm text-slate-500">{item.departement?.nom}</p>
                  <p className="text-sm text-slate-400">Motif : {item.motif || 'N/A'}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUT_COLORS[item.statut] || 'bg-slate-100'}`}>
                    {item.statut?.replace(/_/g, ' ')}
                  </span>
                </div>
                <select
                  value={item.statut}
                  onChange={(e) => updateStatut(item.id, e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  {STATUTS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <div className="flex gap-2">
                  {['confirme', 'en_attente'].includes(item.statut) && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatut(item.id, 'en_cours')}
                        className="rounded-lg bg-medical-primary px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Démarrer
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatut(item.id, 'absent')}
                        className="rounded-lg border px-3 py-1.5 text-xs font-bold text-orange-700"
                      >
                        Absent
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Shell>
  );
}
