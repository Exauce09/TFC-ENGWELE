import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MedecinLayout from '../../components/layout/MedecinLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { nomMedecin } from '../../utils/format';

const STATUT_RDV = {
  confirme: { bg: 'bg-emerald-100 text-emerald-700', label: 'Confirmé' },
  en_attente: { bg: 'bg-amber-100 text-amber-700', label: 'En attente' },
  en_cours: { bg: 'bg-teal-100 text-teal-800', label: 'En cours' },
  termine: { bg: 'bg-slate-100 text-slate-500', label: 'Terminé' },
  absent: { bg: 'bg-orange-100 text-orange-700', label: 'Absent' },
};

export default function MedecinDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/medecin/dashboard');
      setData(res.data.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger le tableau de bord');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const searchPatients = async (q) => {
    setSearch(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/medecin/patients', { params: { q } });
      setSearchResults(res.data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const marquerAbsent = async (rdvId) => {
    if (!window.confirm('Marquer ce patient comme absent ?')) return;
    try {
      await api.put(`/medecin/rendez-vous/${rdvId}/statut`, { statut: 'absent' });
      void load();
    } catch {
      setError('Impossible de marquer le patient absent.');
    }
  };

  const demarrerRdv = async (rdvId) => {
    try {
      await api.put(`/medecin/rendez-vous/${rdvId}/statut`, { statut: 'en_cours' });
      void load();
      navigate('/medecin/dossiers');
    } catch {
      setError('Impossible de démarrer la consultation.');
    }
  };

  const prochain = useMemo(() => {
    if (!data) return null;
    if (data.prochain_file) {
      return {
        type: 'file',
        name: data.prochain_file.patient?.user?.name,
        motif: data.prochain_file.motif_arrivee,
        heure: data.prochain_file.arrivee_at
          ? new Date(data.prochain_file.arrivee_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : null,
        link: `/parcours/${data.prochain_file.id}`,
      };
    }
    if (data.prochain_rdv) {
      return {
        type: 'rdv',
        name: data.prochain_rdv.patient?.user?.name,
        motif: data.prochain_rdv.motif,
        heure: data.prochain_rdv.heure_rdv ? String(data.prochain_rdv.heure_rdv).slice(0, 5) : null,
        id: data.prochain_rdv.id,
        link: '/medecin/dossiers',
      };
    }
    return null;
  }, [data]);

  if (loading) {
    return (
      <MedecinLayout title="Tableau de bord">
        <p className="text-[#5A8A7A]">Chargement…</p>
      </MedecinLayout>
    );
  }

  const planning = data?.planning_du_jour || [];
  const dossiers = data?.dossiers_recents || [];
  const alertes = data?.examens_disponibles || [];
  const enAttente = data?.rdv_en_attente ?? 0;
  const vus = data?.rdv_termines ?? 0;
  const restants = data?.rdv_restants ?? 0;

  return (
    <MedecinLayout title="Tableau de bord">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A7A6D]">Cabinet</p>
          <h2 className="font-medecin-display text-3xl text-[#0D3B3A]">
            Bonjour, {nomMedecin(user?.name).replace(/^Dr\s+/i, '') || 'Docteur'}
          </h2>
          <p className="mt-1 text-sm text-[#5A8A7A]">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {prochain?.type === 'file' && (
            <Link to={prochain.link} className="medecin-btn">Démarrer le prochain →</Link>
          )}
          {prochain?.type === 'rdv' && prochain.id && (
            <button type="button" onClick={() => demarrerRdv(prochain.id)} className="medecin-btn">
              Démarrer le prochain →
            </button>
          )}
          <Link to="/medecin/dossiers" className="medecin-btn-ghost">Consultations</Link>
        </div>
      </div>

      {/* Recherche rapide */}
      <div className="relative mb-6 max-w-xl">
        <input
          type="search"
          value={search}
          onChange={(e) => void searchPatients(e.target.value)}
          placeholder="Recherche rapide dossier (nom, n° patient…)"
          className="w-full rounded-xl border border-[#C5D9D0] bg-white px-4 py-2.5 text-sm text-[#0D3B3A]"
        />
        {(searching || searchResults.length > 0) && search.trim().length >= 2 && (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-[#C5D9D0] bg-white shadow-lg">
            {searching ? (
              <p className="px-4 py-3 text-sm text-[#5A8A7A]">Recherche…</p>
            ) : searchResults.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[#5A8A7A]">Aucun patient.</p>
            ) : (
              searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/medecin/patients/${p.id}`)}
                  className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[#E8F5F2]"
                >
                  <span className="font-medium text-[#0D3B3A]">{p.user?.name}</span>
                  <span className="text-[#5A8A7A]"> — {p.numero_patient}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {/* Compteurs jour */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'En attente', value: enAttente, hint: 'RDV à voir' },
          { label: 'Vus', value: vus, hint: 'Terminés aujourd\'hui' },
          { label: 'Restants', value: restants, hint: 'Confirmés / attente' },
          { label: 'File consultation', value: data?.file_count ?? 0, hint: 'Après triage', to: '/medecin/dossiers' },
          { label: 'Examens en attente', value: data?.examens_en_attente ?? 0, hint: 'Labo / imagerie' },
        ].map((s) => {
          const inner = (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A9A90]">{s.label}</p>
              <p className="mt-1 font-medecin-display text-3xl text-[#0D3B3A]">{s.value}</p>
              <p className="text-xs text-[#5A8A7A]">{s.hint}</p>
            </>
          );
          return s.to ? (
            <Link key={s.label} to={s.to} className="medecin-card block p-4 transition hover:border-[#1A7A6D]/40">{inner}</Link>
          ) : (
            <div key={s.label} className="medecin-card p-4">{inner}</div>
          );
        })}
      </div>

      {/* Prochain patient + stats */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="medecin-card-accent p-5 lg:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A7A6D]">Prochain patient</p>
          {prochain ? (
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-medecin-display text-2xl text-[#0D3B3A]">{prochain.name}</h3>
                <p className="text-sm text-[#5A8A7A]">
                  {prochain.motif || 'Consultation'}
                  {prochain.heure ? ` · ${prochain.heure}` : ''}
                  {prochain.type === 'file' ? ' · File triage' : ' · RDV'}
                </p>
              </div>
              {prochain.type === 'file' ? (
                <Link to={prochain.link} className="medecin-btn text-xs">Démarrer</Link>
              ) : (
                <button type="button" onClick={() => demarrerRdv(prochain.id)} className="medecin-btn text-xs">Démarrer</button>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#7A9A90]">Aucun patient en attente pour le moment.</p>
          )}
        </section>

        <section className="medecin-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A9A90]">Statistiques</p>
          <p className="mt-2 text-sm text-[#0D3B3A]">
            <strong className="font-medecin-display text-2xl">{data?.dossiers_semaine ?? 0}</strong>
            <span className="text-[#5A8A7A]"> consultations cette semaine</span>
          </p>
          <p className="mt-2 text-sm text-[#0D3B3A]">
            <strong className="font-medecin-display text-2xl">{data?.dossiers_mois ?? 0}</strong>
            <span className="text-[#5A8A7A]"> ce mois</span>
          </p>
          <p className="mt-2 text-xs text-[#5A8A7A]">
            {data?.ordonnances_actives ?? 0} ordonnance(s) active(s)
          </p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* RDV chronologique */}
        <section className="medecin-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#C5D9D0] px-5 py-4">
            <h3 className="font-medecin-display text-lg text-[#0D3B3A]">RDV du jour</h3>
            <Link to="/medecin/planning" className="text-xs font-semibold text-[#1A7A6D] hover:underline">Planning →</Link>
          </div>
          {planning.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#7A9A90]">Aucun rendez-vous aujourd&apos;hui.</p>
          ) : (
            <div className="divide-y divide-[#C5D9D0]/80">
              {planning.map((rdv) => {
                const cfg = STATUT_RDV[rdv.statut] || STATUT_RDV.en_attente;
                return (
                  <div key={rdv.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span className="w-12 font-mono text-sm font-bold text-[#1A7A6D]">
                      {String(rdv.heure_rdv).slice(0, 5)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#0D3B3A]">{rdv.patient?.user?.name}</p>
                      <p className="truncate text-xs text-[#7A9A90]">{rdv.motif || 'Consultation'}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg}`}>{cfg.label}</span>
                    {['confirme', 'en_attente'].includes(rdv.statut) && (
                      <>
                        <button type="button" onClick={() => demarrerRdv(rdv.id)} className="text-[10px] font-bold text-[#1A7A6D] hover:underline">
                          Démarrer
                        </button>
                        <button type="button" onClick={() => marquerAbsent(rdv.id)} className="text-[10px] font-bold text-orange-700 hover:underline">
                          Absent
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Alertes résultats + consultations récentes */}
        <div className="flex flex-col gap-4">
          <section className="medecin-card overflow-hidden">
            <div className="border-b border-[#C5D9D0] px-5 py-4">
              <h3 className="font-medecin-display text-lg text-[#0D3B3A]">Alertes — résultats disponibles</h3>
            </div>
            {alertes.length === 0 ? (
              <p className="p-6 text-center text-sm text-[#7A9A90]">Aucun nouveau résultat.</p>
            ) : (
              <div className="divide-y divide-[#C5D9D0]/80">
                {alertes.map((ex) => (
                  <Link
                    key={ex.id}
                    to={ex.admission?.id ? `/parcours/${ex.admission.id}` : '/medecin/dossiers'}
                    className="block px-5 py-3 hover:bg-[#E8F5F2]/60"
                  >
                    <p className="text-sm font-medium text-[#0D3B3A]">
                      {ex.admission?.patient?.user?.name || 'Patient'} — {ex.type_examen}
                    </p>
                    <p className="text-xs text-[#5A8A7A]">
                      {ex.termine_at ? new Date(ex.termine_at).toLocaleString('fr-FR') : 'Résultat prêt'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="medecin-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#C5D9D0] px-5 py-4">
              <h3 className="font-medecin-display text-lg text-[#0D3B3A]">Consultations récentes</h3>
              <Link to="/medecin/dossiers" className="text-xs font-semibold text-[#1A7A6D] hover:underline">Tout voir →</Link>
            </div>
            {dossiers.length === 0 ? (
              <p className="p-6 text-center text-sm text-[#7A9A90]">Aucune consultation récente.</p>
            ) : (
              <div className="divide-y divide-[#C5D9D0]/80">
                {dossiers.map((d) => (
                  <Link
                    key={d.id}
                    to={d.patient_id ? `/medecin/patients/${d.patient_id}` : '/medecin/dossiers'}
                    className="block px-5 py-3 transition hover:bg-[#E8F5F2]/60"
                  >
                    <p className="text-sm font-medium text-[#0D3B3A]">{d.patient?.user?.name}</p>
                    <p className="text-xs text-[#5A8A7A]">
                      {d.diagnostics?.[0]?.libelle || d.motif || '—'}
                      {' · '}
                      {d.date_consultation ? new Date(d.date_consultation).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </MedecinLayout>
  );
}
