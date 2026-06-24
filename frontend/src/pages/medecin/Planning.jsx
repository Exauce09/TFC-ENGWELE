import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
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
    <Layout title="Mon Planning">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Planning du jour</h2>
          <p className="text-sm text-slate-500">Consultations et gestion des statuts.</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border px-4 py-2 text-sm" />
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <p className="text-4xl">📅</p>
          <p className="mt-3 font-medium text-slate-700">Aucun rendez-vous pour cette date</p>
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
                  <p className="text-sm text-slate-600">{item.departement?.nom}</p>
                  <p className="text-sm text-slate-500">Motif : {item.motif || 'N/A'}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUT_COLORS[item.statut]}`}>
                    {item.statut?.replace(/_/g, ' ')}
                  </span>
                </div>
                <select value={item.statut} onChange={(e) => updateStatut(item.id, e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm">
                  {STATUTS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
