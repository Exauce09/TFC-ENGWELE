import { useEffect, useState } from 'react';
import MedecinLayout from '../../components/layout/MedecinLayout';
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

export default function MedecinPlanning() {
  const [items, setItems] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/medecin/planning', { params: { date } });
      setItems(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur planning');
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
    <MedecinLayout title="Planning RDV">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-medecin-display text-3xl text-[#0D3B3A]">Planning RDV</h2>
          <p className="text-sm text-[#5A8A7A]">Tous vos RDV du jour (y compris demandes patient en attente).</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-[#C5D9D0] bg-white px-4 py-2 text-sm text-[#0D3B3A]"
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-[#5A8A7A]">Chargement…</p>
      ) : items.length === 0 ? (
        <div className="medecin-card border-dashed p-12 text-center">
          <p className="font-medium text-[#0D3B3A]">Aucun rendez-vous pour cette date</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="medecin-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#0D3B3A]">
                    {String(item.heure_rdv).slice(0, 5)} — {item.patient?.user?.name || 'Patient'}
                  </p>
                  <p className="text-sm text-[#5A8A7A]">{item.departement?.nom}</p>
                  <p className="text-sm text-[#7A9A90]">Motif : {item.motif || 'N/A'}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUT_COLORS[item.statut]}`}>
                    {item.statut?.replace(/_/g, ' ')}
                  </span>
                </div>
                <select
                  value={item.statut}
                  onChange={(e) => updateStatut(item.id, e.target.value)}
                  className="rounded-lg border border-[#C5D9D0] bg-white px-3 py-2 text-sm"
                >
                  {STATUTS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <div className="flex gap-2">
                  {['confirme', 'en_attente'].includes(item.statut) && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatut(item.id, 'en_cours')}
                        className="medecin-btn text-xs"
                      >
                        Démarrer
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatut(item.id, 'absent')}
                        className="medecin-btn-ghost text-xs text-orange-700"
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
    </MedecinLayout>
  );
}
