import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const STATUTS = ['en_attente', 'confirme', 'en_cours', 'termine', 'annule', 'absent'];

const STATUT_COLORS = {
  confirme: 'bg-emerald-100 text-emerald-700',
  en_attente: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-blue-100 text-blue-700',
  termine: 'bg-slate-100 text-slate-600',
  annule: 'bg-red-100 text-red-700',
  absent: 'bg-orange-100 text-orange-700',
};

export default function AdminRendezVous() {
  const [rdv, setRdv] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [tab, setTab] = useState('rdv');
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState({ statut: '', date: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtre.statut) params.statut = filtre.statut;
      if (filtre.date) params.date = filtre.date;
      const [rdvRes, demRes] = await Promise.all([
        api.get('/admin/rendez-vous', { params }),
        api.get('/admin/demandes-rdv'),
      ]);
      setRdv(rdvRes.data.data || []);
      setDemandes(demRes.data.data || []);
    } catch {
      setRdv([]);
      setDemandes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [filtre.statut, filtre.date]);

  const changerStatut = async (id, statut, type = 'rdv') => {
    try {
      if (type === 'rdv') {
        await api.put(`/admin/rendez-vous/${id}/statut`, { statut });
      } else {
        await api.put(`/admin/demandes-rdv/${id}`, { statut });
      }
      void load();
    } catch {
      alert('Erreur lors de la mise à jour');
    }
  };

  return (
    <Layout title="Gestion des Rendez-vous">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Rendez-vous & Demandes</h2>
        <p className="text-sm text-slate-500">Vue globale de tous les rendez-vous et demandes depuis le site.</p>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('rdv')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'rdv' ? 'bg-medical-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
          Rendez-vous ({rdv.length})
        </button>
        <button onClick={() => setTab('demandes')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'demandes' ? 'bg-medical-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
          Demandes site ({demandes.length})
        </button>
      </div>

      {tab === 'rdv' && (
        <div className="mb-4 flex flex-wrap gap-3">
          <select value={filtre.statut} onChange={(e) => setFiltre((f) => ({ ...f, statut: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm">
            <option value="">Tous les statuts</option>
            {STATUTS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <input type="date" value={filtre.date} onChange={(e) => setFiltre((f) => ({ ...f, date: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm" />
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : tab === 'rdv' ? (
        <div className="space-y-3">
          {rdv.length === 0 ? (
            <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucun rendez-vous.</p>
          ) : rdv.map((r) => (
            <article key={r.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {r.patient?.user?.name || 'Patient'} — {new Date(r.date_rdv).toLocaleDateString('fr-FR')} {String(r.heure_rdv).slice(0, 5)}
                  </p>
                  <p className="text-sm text-slate-600">{r.medecin?.user?.name} · {r.departement?.nom}</p>
                  {r.motif && <p className="mt-1 text-xs text-slate-400">{r.motif}</p>}
                </div>
                <select value={r.statut} onChange={(e) => changerStatut(r.id, e.target.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${STATUT_COLORS[r.statut]}`}>
                  {STATUTS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {demandes.length === 0 ? (
            <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucune demande.</p>
          ) : demandes.map((d) => (
            <article key={d.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{d.nom} — {d.telephone}</p>
                  <p className="text-sm text-slate-600">
                    {d.service_libelle || d.departement?.nom} · {new Date(d.date_souhaitee).toLocaleDateString('fr-FR')}
                  </p>
                  {d.message && <p className="mt-1 text-xs text-slate-400">{d.message}</p>}
                </div>
                <select value={d.statut} onChange={(e) => changerStatut(d.id, e.target.value, 'demande')}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold">
                  <option value="nouvelle">nouvelle</option>
                  <option value="traitee">traitée</option>
                  <option value="annulee">annulée</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
