import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { nomMedecin } from '../../utils/format';

/** Les dossiers ouverts avant la numérotation n'ont pas de numéro. */
function libelleDossier(dossier) {
  if (!dossier) return 'Aucun dossier';
  return dossier.numero_dossier || `Dossier #${dossier.id}`;
}

export default function AccueilPatients() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cherche, setCherche] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async (term = '') => {
    setLoading(true);
    try {
      const res = await api.get('/accueil/patients', { params: term.trim() ? { q: term } : {} });
      setItems(res.data.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const search = async (term) => {
    setQ(term);
    if (term.trim().length === 0) {
      setCherche(false);
      void load();
      return;
    }
    if (term.trim().length < 2) {
      setCherche(false);
      return;
    }
    setCherche(true);
    await load(term);
  };

  const resetPassword = async (id) => {
    setMsg('');
    try {
      const res = await api.put(`/accueil/patients/${id}/reset-password`);
      const acces = res.data?.data?.acces;
      setItems((list) => list.map((p) => (p.id === id ? { ...p, acces } : p)));
      setMsg(`Identifiants : ${acces?.login} / ${acces?.password || 'Amen2026'}`);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Impossible de réinitialiser le mot de passe.');
    }
  };

  return (
    <Layout title="Patients">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Patients enregistrés</h2>
        <p className="mt-1 text-sm text-slate-500">
          L&apos;accueil crée le compte et peut renvoyer identifiant + mot de passe. Le patient change le mot de passe à la 1re connexion.
        </p>
      </div>

      <input
        value={q}
        onChange={(e) => search(e.target.value)}
        placeholder="Rechercher… (laissez vide pour les plus récents)"
        className="mb-5 w-full max-w-md rounded-xl border px-4 py-2.5 text-sm"
      />

      {msg && (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{msg}</p>
      )}

      {loading && <p className="text-slate-500">Chargement…</p>}

      {!loading && cherche && items.length === 0 && (
        <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucun patient trouvé — il doit être enregistré à la réception.
        </p>
      )}

      {!loading && !cherche && items.length === 0 && (
        <p className="rounded-2xl border bg-white p-8 text-center text-slate-500">
          Aucun patient enregistré pour le moment.
        </p>
      )}

      <div className="space-y-3">
        {items.map((p) => (
          <article key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate font-semibold text-slate-900">{p.user?.name}</p>
                <p className="truncate text-sm text-slate-500">
                  <span className="font-mono">{p.numero_patient}</span>
                  {p.user?.phone ? ` · ${p.user.phone}` : ''}
                  {p.commune ? ` · ${p.commune}` : ''}
                </p>
              </div>
              {p.admission_active ? (
                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Visite en cours · {p.admission_active.statut_label}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Aucune visite en cours
                </span>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Connexion patient</p>
              <p className="mt-1 break-all">
                <span className="text-slate-500">Identifiant :</span>{' '}
                <strong className="font-mono">{p.acces?.login || p.user?.login_identifiant || '—'}</strong>
              </p>
              <p>
                <span className="text-slate-500">Mot de passe :</span>{' '}
                {p.acces?.password ? (
                  <strong className="font-mono tracking-wide">{p.acces.password}</strong>
                ) : (
                  <span className="text-slate-600">déjà changé — réinitialisez si besoin</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => void resetPassword(p.id)}
                className="mt-2 text-xs font-bold text-emerald-800 underline"
              >
                Réinitialiser (Amen2026)
              </button>
            </div>

            <dl className="mt-3 grid gap-2 border-t pt-3 text-sm sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-xs uppercase tracking-wide text-slate-400">Dossier</dt>
                <dd className="break-words font-medium text-slate-800">
                  {libelleDossier(p.dossier)}
                  {p.nombre_dossiers ? ` · ${p.nombre_dossiers} visite(s)` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Médecin en charge</dt>
                <dd className="font-medium text-slate-800">
                  {nomMedecin(p.medecin_en_charge) || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Admission</dt>
                <dd className="font-medium text-slate-800">
                  {p.admission_active?.numero_admission || '—'}
                  {p.admission_active?.departement ? ` · ${p.admission_active.departement}` : ''}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </Layout>
  );
}
