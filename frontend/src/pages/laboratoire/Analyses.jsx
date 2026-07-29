import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const STATUT_COLORS = {
  prescrit: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-blue-100 text-blue-700',
  termine: 'bg-emerald-100 text-emerald-700',
  annule: 'bg-slate-100 text-slate-600',
};

const PRIORITE_COLORS = {
  stat: 'bg-red-100 text-red-800',
  urgent: 'bg-orange-100 text-orange-700',
  routine: 'bg-slate-100 text-slate-600',
};

const FLAG_COLORS = {
  N: 'text-emerald-700',
  H: 'text-orange-700 font-bold',
  L: 'text-blue-700 font-bold',
  critique: 'text-red-700 font-bold',
};

export default function LaboratoireAnalyses() {
  const [analyses, setAnalyses] = useState([]);
  const [file, setFile] = useState([]);
  const [selected, setSelected] = useState(null);
  const [resultats, setResultats] = useState([]);
  const [ligne, setLigne] = useState({ parametre: '', valeur: '', unite: '', norme: '', ref_min: '', ref_max: '', flag: 'N' });
  const [interpretation, setInterpretation] = useState('');
  const [technique, setTechnique] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, fRes] = await Promise.all([
        api.get('/laboratoire/analyses'),
        api.get('/laboratoire/file-examens'),
      ]);
      setAnalyses(aRes.data.data || []);
      setFile(fRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openResult = (examen) => {
    setSelected(examen);
    setResultats(examen.resultats || []);
    setInterpretation(examen.interpretation || '');
    setTechnique(examen.technique || '');
    setMsg('');
    setError('');
  };

  const addLigne = () => {
    if (!ligne.parametre.trim()) return;
    setResultats((r) => [...r, {
      parametre: ligne.parametre,
      valeur: ligne.valeur,
      unite: ligne.unite,
      norme: ligne.norme || (ligne.ref_min && ligne.ref_max ? `${ligne.ref_min}–${ligne.ref_max}` : ''),
      ref_min: ligne.ref_min || null,
      ref_max: ligne.ref_max || null,
      flag: ligne.flag || 'N',
    }]);
    setLigne({ parametre: '', valeur: '', unite: '', norme: '', ref_min: '', ref_max: '', flag: 'N' });
  };

  const publier = async () => {
    if (!selected || resultats.length === 0) {
      setError('Ajoutez au moins un paramètre de résultat.');
      return;
    }
    setError('');
    try {
      await api.put(`/laboratoire/analyses/${selected.id}/resultats`, {
        resultats,
        interpretation,
        technique: technique || null,
        statut: 'termine',
      });
      setMsg(`Résultats de « ${selected.type_examen} » transmis au médecin.`);
      setSelected(null);
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de publier les résultats.');
    }
  };

  return (
    <Layout title="Laboratoire">
      <h2 className="mb-1 text-2xl font-bold text-slate-900">Analyses & résultats</h2>
      <p className="mb-6 text-sm text-slate-500">
        File du parcours patient (prélèvement → labo) — résultats structurés avec unités, normes et flags.
      </p>

      {msg && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div>}
      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">File examens en attente</h3>
          {loading ? <p className="text-sm text-slate-500">Chargement…</p> : file.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun examen en file parcours.</p>
          ) : (
            <ul className="space-y-2">
              {file.map((ex) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => openResult(ex)}
                    className="w-full rounded-xl border px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{ex.admission?.patient?.user?.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITE_COLORS[ex.priorite] || PRIORITE_COLORS.routine}`}>
                        {ex.priorite_label || ex.priorite}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUT_COLORS[ex.statut]}`}>
                        {ex.statut_label || ex.statut}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-700">{ex.type_examen}</p>
                    <p className="text-xs text-slate-500">
                      {ex.admission?.numero_admission}
                      {ex.type_echantillon ? ` · ${ex.type_echantillon}` : ''}
                      {ex.numero_echantillon ? ` · ${ex.numero_echantillon}` : ''}
                      {ex.conditions_prelevement ? ` · ${ex.conditions_prelevement}` : ''}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">
            {selected ? `Saisie résultats — ${selected.type_examen}` : 'Sélectionnez un examen'}
          </h3>
          {!selected ? (
            <p className="text-sm text-slate-500">Cliquez un examen de la file pour saisir les paramètres (NFS, glycémie…).</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Patient : <strong>{selected.admission?.patient?.user?.name}</strong>
                {selected.indication ? ` · Indication : ${selected.indication}` : ''}
              </p>

              {resultats.length > 0 && (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-[10px] uppercase text-slate-400">
                      <th className="py-1">Paramètre</th>
                      <th>Valeur</th>
                      <th>Unité</th>
                      <th>Norme</th>
                      <th>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultats.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-1.5 font-medium">{r.parametre}</td>
                        <td className={FLAG_COLORS[r.flag] || ''}>{r.valeur}</td>
                        <td>{r.unite || '—'}</td>
                        <td className="text-xs text-slate-500">{r.norme || '—'}</td>
                        <td className={`text-xs ${FLAG_COLORS[r.flag] || ''}`}>{r.flag || 'N'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="grid gap-2 sm:grid-cols-3">
                <input className="rounded-lg border px-2 py-1.5 text-sm" placeholder="Paramètre" value={ligne.parametre} onChange={(e) => setLigne((l) => ({ ...l, parametre: e.target.value }))} />
                <input className="rounded-lg border px-2 py-1.5 text-sm" placeholder="Valeur" value={ligne.valeur} onChange={(e) => setLigne((l) => ({ ...l, valeur: e.target.value }))} />
                <input className="rounded-lg border px-2 py-1.5 text-sm" placeholder="Unité" value={ligne.unite} onChange={(e) => setLigne((l) => ({ ...l, unite: e.target.value }))} />
                <input className="rounded-lg border px-2 py-1.5 text-sm" placeholder="Norme / intervalle" value={ligne.norme} onChange={(e) => setLigne((l) => ({ ...l, norme: e.target.value }))} />
                <input className="rounded-lg border px-2 py-1.5 text-sm" placeholder="Ref min" value={ligne.ref_min} onChange={(e) => setLigne((l) => ({ ...l, ref_min: e.target.value }))} />
                <input className="rounded-lg border px-2 py-1.5 text-sm" placeholder="Ref max" value={ligne.ref_max} onChange={(e) => setLigne((l) => ({ ...l, ref_max: e.target.value }))} />
                <select className="rounded-lg border px-2 py-1.5 text-sm" value={ligne.flag} onChange={(e) => setLigne((l) => ({ ...l, flag: e.target.value }))}>
                  <option value="N">N (normal)</option>
                  <option value="H">H (haut)</option>
                  <option value="L">L (bas)</option>
                  <option value="critique">Critique</option>
                </select>
                <button type="button" onClick={addLigne} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white sm:col-span-2">
                  Ajouter paramètre
                </button>
              </div>

              <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Technique / automate" value={technique} onChange={(e) => setTechnique(e.target.value)} />
              <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} placeholder="Interprétation du laborantin" value={interpretation} onChange={(e) => setInterpretation(e.target.value)} />

              <div className="flex gap-2">
                <button type="button" onClick={publier} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  Publier résultats
                </button>
                <button type="button" onClick={() => setSelected(null)} className="rounded-xl border px-4 py-2 text-sm text-slate-600">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-900">Historique récent</h3>
        {analyses.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun examen.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-[10px] uppercase text-slate-400">
                  <th className="py-2">Patient</th>
                  <th>Examen</th>
                  <th>Priorité</th>
                  <th>Échantillon</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((ex) => (
                  <tr key={ex.id} className="border-b border-slate-100">
                    <td className="py-2">{ex.admission?.patient?.user?.name}</td>
                    <td>{ex.type_examen}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITE_COLORS[ex.priorite] || ''}`}>{ex.priorite}</span></td>
                    <td className="text-xs text-slate-500">{ex.numero_echantillon || ex.type_echantillon || '—'}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUT_COLORS[ex.statut]}`}>{ex.statut}</span></td>
                    <td>
                      {ex.statut !== 'termine' && (
                        <button type="button" onClick={() => openResult(ex)} className="text-xs font-semibold text-emerald-700 hover:underline">
                          Saisir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}
