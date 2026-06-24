import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import JitsiMeet from '../../components/JitsiMeet';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUT_COLORS = {
  confirme: 'bg-emerald-100 text-emerald-700',
  en_cours: 'bg-blue-100 text-blue-700',
};

export default function PatientTeleconsultation() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <Layout title="Téléconsultation">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Téléconsultation</h2>
        <p className="text-sm text-slate-500">
          Rejoignez votre consultation vidéo sécurisée via Jitsi Meet.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {active ? (
        <div className="space-y-4">
          <button
            onClick={() => setActive(null)}
            className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            ← Retour à la liste
          </button>
          <JitsiMeet
            roomUrl={active.room_url}
            roomName={active.room_name}
            displayName={user?.name}
          />
        </div>
      ) : loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : salles.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <p className="text-4xl">🎥</p>
          <p className="mt-3 font-medium text-slate-700">Aucune téléconsultation planifiée</p>
          <p className="mt-1 text-sm text-slate-500">
            Réservez un rendez-vous de type « téléconsultation » depuis Mes rendez-vous.
          </p>
          <button
            onClick={() => navigate('/patient/rendez-vous')}
            className="mt-4 rounded-xl bg-medical-primary px-5 py-2 text-sm font-semibold text-white"
          >
            Mes rendez-vous
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {salles.map((r) => (
            <article key={r.id} className="flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">
                    {new Date(r.date_rdv).toLocaleDateString('fr-FR')} à {String(r.heure_rdv).slice(0, 5)}
                  </p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUT_COLORS[r.statut] ?? 'bg-slate-100'}`}>
                    {r.statut?.replace(/_/g, ' ')}
                  </span>
                  {r.paiement_statut === 'paye' ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Payé</span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Paiement requis</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {r.medecin?.user?.name || 'Médecin'} — {r.departement?.nom}
                </p>
                {r.motif && <p className="mt-1 text-xs text-slate-400">{r.motif}</p>}
              </div>
              <div className="flex gap-2">
                {r.paiement_statut !== 'paye' && (
                  <button
                    onClick={() => navigate('/patient/rendez-vous')}
                    className="rounded-lg border border-amber-200 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50"
                  >
                    Payer
                  </button>
                )}
                <button
                  onClick={() => rejoindre(r)}
                  disabled={joining || r.paiement_statut !== 'paye'}
                  className="rounded-xl bg-medical-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {joining ? 'Connexion...' : 'Rejoindre'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
