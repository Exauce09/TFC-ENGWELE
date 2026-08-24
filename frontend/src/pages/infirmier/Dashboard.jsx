import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InfirmierLayout from '../../components/layout/InfirmierLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function urgenceBadge(niveau) {
  const map = {
    critique: 'bg-red-100 text-red-800',
    urgent: 'bg-orange-100 text-orange-800',
    modere: 'bg-amber-100 text-amber-800',
    moins_urgent: 'bg-amber-100 text-amber-800',
    leger: 'bg-emerald-100 text-emerald-800',
    non_urgent: 'bg-emerald-100 text-emerald-800',
  };
  return map[niveau] || 'bg-slate-100 text-slate-600';
}

export default function InfirmierDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/infirmier/dashboard');
      setData(res.data.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger le tableau de bord');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <InfirmierLayout title="Tableau de bord">
        <p className="text-[#7A8FA8]">Chargement…</p>
      </InfirmierLayout>
    );
  }

  const file = data?.file_triage || [];
  const prelevements = data?.file_prelevement || [];
  const recentes = data?.constantes_recentes || [];

  return (
    <InfirmierLayout title="Tableau de bord">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E07A5F]">Unité de soins</p>
          <h2 className="font-infirmier-display text-3xl text-[#152238]">
            Bonjour, {user?.name?.split(' ')[0] || 'Infirmier(e)'}
          </h2>
          <p className="mt-1 text-sm text-[#7A8FA8]">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/infirmier/triage" className="infirmier-btn">File de triage →</Link>
          <Link to="/infirmier/prelevements" className="infirmier-btn-ghost">Prélèvements</Link>
          <Link to="/infirmier/constantes" className="infirmier-btn-ghost">Constantes</Link>
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'File triage', value: data?.file_triage_count ?? 0, hint: 'Après accueil', to: '/infirmier/triage' },
          { label: 'Prélèvements', value: data?.file_prelevement_count ?? 0, hint: 'En attente', to: '/infirmier/prelevements' },
          { label: 'Constantes du jour', value: data?.constantes_du_jour ?? 0, hint: 'Toutes saisies', to: '/infirmier/constantes' },
          { label: 'Mes saisies', value: data?.mes_constantes_du_jour ?? 0, hint: "Aujourd'hui", to: '/infirmier/constantes' },
        ].map((s) => {
          const inner = (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8FA3BE]">{s.label}</p>
              <p className="mt-1 font-infirmier-display text-3xl text-[#152238]">{s.value}</p>
              <p className="text-xs text-[#7A8FA8]">{s.hint}</p>
              {s.to && <p className="mt-2 text-xs font-semibold text-[#E07A5F]">Voir →</p>}
            </>
          );
          return s.to ? (
            <Link key={s.label} to={s.to} className="infirmier-card block p-4 transition hover:border-[#E07A5F]/40">
              {inner}
            </Link>
          ) : (
            <div key={s.label} className="infirmier-card p-4">{inner}</div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="infirmier-card-accent overflow-hidden lg:col-span-3">
          <div className="flex items-center justify-between border-b border-[#C9D4E3] px-5 py-4">
            <div>
              <h3 className="font-infirmier-display text-lg text-[#152238]">File de triage</h3>
              <p className="text-xs text-[#7A8FA8]">Patients orientés après l&apos;accueil</p>
            </div>
            <Link to="/infirmier/triage" className="text-xs font-semibold text-[#E07A5F] hover:underline">
              Tout voir →
            </Link>
          </div>
          {file.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#8FA3BE]">Aucun patient en file de triage.</p>
          ) : (
            <div className="divide-y divide-[#C9D4E3]/80">
              {file.map((a) => (
                <Link
                  key={a.id}
                  to="/infirmier/triage"
                  className="flex items-start justify-between gap-3 px-5 py-3.5 transition hover:bg-[#F8E8E2]/50"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#152238]">{a.patient?.user?.name}</p>
                    <p className="truncate text-xs text-[#7A8FA8]">
                      {a.numero_admission} · {a.motif_arrivee}
                      {a.departement?.nom ? ` · ${a.departement.nom}` : ''}
                    </p>
                    {a.niveau_urgence_accueil && (
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${urgenceBadge(a.niveau_urgence_accueil)}`}>
                        {String(a.niveau_urgence_accueil).replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-[#F8E8E2] px-2.5 py-1 text-xs font-semibold text-[#C9654B]">
                    {a.statut_label || a.statut}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className="infirmier-card overflow-hidden">
            <div className="border-b border-[#C9D4E3] px-5 py-4">
              <h3 className="font-infirmier-display text-lg text-[#152238]">Prélèvements</h3>
            </div>
            {prelevements.length === 0 ? (
              <p className="p-6 text-center text-sm text-[#8FA3BE]">Aucun prélèvement en attente.</p>
            ) : (
              <div className="divide-y divide-[#C9D4E3]/80">
                {prelevements.map((a) => (
                  <Link key={a.id} to={`/parcours/${a.id}`} className="block px-5 py-3 hover:bg-slate-50">
                    <p className="text-sm font-medium text-[#152238]">{a.patient?.user?.name}</p>
                    <p className="text-xs text-[#7A8FA8]">{a.numero_admission} · {a.departement?.nom || '—'}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="infirmier-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#C9D4E3] px-5 py-4">
              <h3 className="font-infirmier-display text-lg text-[#152238]">Constantes récentes</h3>
              <Link to="/infirmier/constantes" className="text-xs font-semibold text-[#E07A5F] hover:underline">
                Saisir →
              </Link>
            </div>
            {recentes.length === 0 ? (
              <p className="p-6 text-center text-sm text-[#8FA3BE]">Aucune saisie récente.</p>
            ) : (
              <div className="divide-y divide-[#C9D4E3]/80">
                {recentes.map((c) => (
                  <div key={c.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-[#152238]">{c.patient?.user?.name}</p>
                    <p className="text-xs text-[#7A8FA8]">
                      {c.date_soin ? new Date(c.date_soin).toLocaleString('fr-FR') : '—'}
                      {c.temperature ? ` · ${c.temperature}°C` : ''}
                      {c.tension_arterielle ? ` · TA ${c.tension_arterielle}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </InfirmierLayout>
  );
}
