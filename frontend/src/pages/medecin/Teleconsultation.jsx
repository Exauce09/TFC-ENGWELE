import { useEffect, useState } from 'react';
import MedecinLayout from '../../components/layout/MedecinLayout';
import JitsiMeet from '../../components/JitsiMeet';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUT_COLORS = {
  confirme: 'bg-emerald-100 text-emerald-700',
  en_cours: 'bg-blue-100 text-blue-700',
};

export default function MedecinTeleconsultation() {
  const { user } = useAuth();
  const [salles, setSalles] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/teleconsultation');
      setSalles(res.data.data || []);
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
      const res = await api.post(`/teleconsultation/${rdv.id}/rejoindre`);
      setActive(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Connexion impossible');
    } finally {
      setJoining(false);
    }
  };

  return (
    <MedecinLayout title="Téléconsultation">
      <div className="mb-6">
        <h2 className="font-medecin-display text-3xl text-[#0D3B3A]">Salles de téléconsultation</h2>
        <p className="text-sm text-[#5A8A7A]">Consultations vidéo avec vos patients confirmés.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {active ? (
        <div className="space-y-4">
          <button type="button" onClick={() => setActive(null)} className="medecin-btn-ghost">
            ← Retour à la liste
          </button>
          <p className="text-sm text-[#5A8A7A]">
            Patient : <strong className="text-[#0D3B3A]">{active.rendez_vous?.patient?.user?.name}</strong>
          </p>
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
          <p className="font-medium text-[#0D3B3A]">Aucune téléconsultation à venir</p>
        </div>
      ) : (
        <div className="space-y-3">
          {salles.map((r) => (
            <article key={r.id} className="medecin-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#0D3B3A]">
                    {new Date(r.date_rdv).toLocaleDateString('fr-FR')} à {String(r.heure_rdv).slice(0, 5)}
                  </p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUT_COLORS[r.statut] ?? 'bg-slate-100'}`}>
                    {r.statut?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5A8A7A]">
                  {r.patient?.user?.name || 'Patient'} — {r.departement?.nom}
                </p>
                {r.motif && <p className="mt-1 text-xs text-[#7A9A90]">{r.motif}</p>}
              </div>
              <button
                type="button"
                onClick={() => rejoindre(r)}
                disabled={joining}
                className="medecin-btn disabled:opacity-50"
              >
                {joining ? 'Connexion…' : 'Démarrer la consultation'}
              </button>
            </article>
          ))}
        </div>
      )}
    </MedecinLayout>
  );
}
