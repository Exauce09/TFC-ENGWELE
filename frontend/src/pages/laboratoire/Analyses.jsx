import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const STATUT_COLORS = {
  en_attente: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-blue-100 text-blue-700',
  resultat_disponible: 'bg-emerald-100 text-emerald-700',
};

const URGENCE = {
  critique: 'bg-red-100 text-red-700',
  urgent: 'bg-orange-100 text-orange-700',
  moins_urgent: 'bg-amber-100 text-amber-700',
  non_urgent: 'bg-emerald-100 text-emerald-700',
};

export default function LaboratoireAnalyses() {
  const [analyses, setAnalyses] = useState([]);
  const [filePatients, setFilePatients] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    patient_id: '',
    dossier_id: '',
    episode_id: '',
    type_analyse: '',
    date_prelevement: new Date().toISOString().slice(0, 10),
    urgent: false,
  });
  const [patientLabel, setPatientLabel] = useState('');
  const [resultForm, setResultForm] = useState({ parametre: '', valeur: '', norme: '' });
  const [resultats, setResultats] = useState([]);
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, pRes] = await Promise.all([
        api.get('/laboratoire/analyses'),
        api.get('/laboratoire/patients'),
      ]);
      setAnalyses(aRes.data.data || []);
      setFilePatients(pRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const searchPatients = async (q) => {
    setSearch(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await api.get('/laboratoire/patients', { params: { q } });
    setSearchResults(res.data.data || []);
  };

  const pickPatient = (p) => {
    setForm((f) => ({
      ...f,
      patient_id: p.id,
      dossier_id: p.dossier_id || '',
      episode_id: p.episode_id || '',
      urgent: p.niveau_urgence === 'critique' || p.niveau_urgence === 'urgent',
    }));
    setPatientLabel(
      `${p.user?.name || 'Patient'}${p.numero_dossier ? ` · ${p.numero_dossier}` : ''}${p.numero_patient ? ` · ${p.numero_patient}` : ''}`
    );
    setSearch(p.user?.name || '');
    setSearchResults([]);
    setShowForm(true);
  };

  const creer = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.patient_id) {
      setError('Sélectionnez un patient (file parcours ou recherche).');
      return;
    }
    try {
      await api.post('/laboratoire/analyses', {
        ...form,
        dossier_id: form.dossier_id || null,
        episode_id: form.episode_id || null,
      });
      setMsg('Analyse enregistrée et liée au dossier de réception.');
      setShowForm(false);
      setForm({
        patient_id: '',
        dossier_id: '',
        episode_id: '',
        type_analyse: '',
        date_prelevement: new Date().toISOString().slice(0, 10),
        urgent: false,
      });
      setPatientLabel('');
      setSearch('');
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur enregistrement.');
    }
  };

  const ajouterParam = () => {
    if (!resultForm.parametre) return;
    setResultats((r) => [...r, { ...resultForm }]);
    setResultForm({ parametre: '', valeur: '', norme: '' });
  };

  const publier = async () => {
    if (!selected || resultats.length === 0) return;
    try {
      await api.put(`/laboratoire/analyses/${selected.id}/resultats`, { resultats, interpretation });
      setMsg('Résultats publiés — patient renvoyé vers le médecin.');
      setSelected(null);
      setResultats([]);
      void load();
    } catch {
      setError('Erreur publication.');
    }
  };

  return (
    <Layout title="Analyses Laboratoire">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analyses biologiques</h2>
          <p className="text-sm text-slate-500">
            Patients créés à la réception et orientés dans le parcours. Liez chaque analyse au dossier.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(true); setError(''); }}
          className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white"
        >
          + Nouvelle analyse
        </button>
      </div>

      {msg && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div>}
      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="mb-6">
        <h3 className="mb-3 font-bold text-slate-900">Patients du parcours (réception)</h3>
        {loading ? (
          <p className="text-slate-500">Chargement...</p>
        ) : filePatients.length === 0 ? (
          <p className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">
            Aucun patient dans le parcours. L&apos;accueil doit d&apos;abord enregistrer le patient à son arrivée.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filePatients.map((p) => (
              <button
                key={`${p.id}-${p.episode_id || 'x'}`}
                type="button"
                onClick={() => pickPatient(p)}
                className={`rounded-xl border p-4 text-left transition hover:shadow-md ${
                  p.priorite_examens ? 'border-violet-300 bg-violet-50' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{p.user?.name}</p>
                  {p.niveau_urgence && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${URGENCE[p.niveau_urgence] || 'bg-slate-100'}`}>
                      {p.niveau_urgence}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {p.numero_patient}
                  {p.numero_dossier ? ` · ${p.numero_dossier}` : ''}
                </p>
                <p className="mt-1 text-xs font-medium text-medical-primary">
                  {p.etape_label || p.etape}
                  {p.priorite_examens ? ' · à traiter' : ''}
                </p>
                {p.motif_arrivee && <p className="mt-1 text-xs text-slate-400">{p.motif_arrivee}</p>}
              </button>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <form onSubmit={creer} className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="font-bold">Nouveau prélèvement</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium">Patient (recherche ou sélection ci-dessus)</span>
              <input
                value={search}
                onChange={(e) => searchPatients(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Nom, téléphone ou n° patient..."
              />
              {patientLabel && (
                <p className="mt-1 text-xs text-emerald-700">Sélectionné : {patientLabel}</p>
              )}
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPatient(p)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                >
                  {p.user?.name} — {p.numero_patient}
                  {p.numero_dossier ? ` · ${p.numero_dossier}` : ''}
                </button>
              ))}
            </label>
            <label className="block">
              <span className="text-sm font-medium">Type d&apos;analyse *</span>
              <input
                required
                value={form.type_analyse}
                onChange={(e) => setForm((f) => ({ ...f, type_analyse: e.target.value }))}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="NFS, Glycémie..."
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Date prélèvement *</span>
              <input
                type="date"
                required
                value={form.date_prelevement}
                onChange={(e) => setForm((f) => ({ ...f, date_prelevement: e.target.value }))}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.urgent}
                onChange={(e) => setForm((f) => ({ ...f, urgent: e.target.checked }))}
              />
              Urgent
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
            <button type="submit" className="rounded-xl bg-medical-primary px-6 py-2 text-sm font-bold text-white">Enregistrer</button>
          </div>
        </form>
      )}

      <h3 className="mb-3 font-bold">Analyses enregistrées</h3>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {loading ? <p>Chargement...</p> : analyses.length === 0 ? (
            <p className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">Aucune analyse pour l&apos;instant.</p>
          ) : analyses.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => { setSelected(a); setResultats(a.resultats || []); setInterpretation(a.interpretation || ''); }}
              className={`w-full rounded-xl border p-4 text-left ${selected?.id === a.id ? 'border-medical-primary bg-blue-50' : 'bg-white'}`}
            >
              <div className="flex justify-between">
                <p className="font-semibold">{a.type_analyse}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUT_COLORS[a.statut]}`}>
                  {a.statut?.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-slate-600">{a.patient?.user?.name}</p>
              <p className="text-xs text-slate-400">
                {a.dossier?.numero_dossier ? `${a.dossier.numero_dossier} · ` : ''}
                {new Date(a.date_prelevement).toLocaleDateString('fr-FR')}
              </p>
            </button>
          ))}
        </div>

        <div className="min-h-[280px] rounded-2xl border bg-white p-5 shadow-sm">
          {selected ? (
            selected.statut === 'resultat_disponible' ? (
              <div>
                <h3 className="font-bold">{selected.type_analyse}</h3>
                <p className="text-sm text-slate-500">{selected.patient?.user?.name}</p>
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400">
                      <th>Paramètre</th><th>Valeur</th><th>Norme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.resultats || []).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-2">{r.parametre}</td>
                        <td className="font-medium">{r.valeur}</td>
                        <td className="text-slate-400">{r.norme}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selected.interpretation && (
                  <p className="mt-3 text-sm text-slate-600">
                    <strong>Interprétation :</strong> {selected.interpretation}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <h3 className="font-bold">Publier résultats — {selected.type_analyse}</h3>
                <p className="text-sm text-slate-500">{selected.patient?.user?.name}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <input placeholder="Paramètre" value={resultForm.parametre} onChange={(e) => setResultForm((f) => ({ ...f, parametre: e.target.value }))} className="rounded-lg border px-2 py-1.5 text-sm" />
                  <input placeholder="Valeur" value={resultForm.valeur} onChange={(e) => setResultForm((f) => ({ ...f, valeur: e.target.value }))} className="rounded-lg border px-2 py-1.5 text-sm" />
                  <input placeholder="Norme" value={resultForm.norme} onChange={(e) => setResultForm((f) => ({ ...f, norme: e.target.value }))} className="rounded-lg border px-2 py-1.5 text-sm" />
                </div>
                <button type="button" onClick={ajouterParam} className="mt-2 text-sm font-medium text-medical-primary">+ Ajouter paramètre</button>
                {resultats.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {resultats.map((r, i) => <li key={i}>{r.parametre}: {r.valeur} ({r.norme})</li>)}
                  </ul>
                )}
                <textarea
                  rows={2}
                  placeholder="Interprétation médicale..."
                  value={interpretation}
                  onChange={(e) => setInterpretation(e.target.value)}
                  className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
                />
                <button type="button" onClick={publier} className="mt-4 rounded-xl bg-emerald-500 px-6 py-2 text-sm font-bold text-white">
                  Publier les résultats
                </button>
              </div>
            )
          ) : (
            <p className="py-16 text-center text-slate-400">Sélectionnez une analyse.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
