import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const STATUT_COLORS = {
  en_attente: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-blue-100 text-blue-700',
  resultat_disponible: 'bg-emerald-100 text-emerald-700',
};

export default function LaboratoireAnalyses() {
  const [analyses, setAnalyses] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ patient_id: '', type_analyse: '', date_prelevement: new Date().toISOString().slice(0, 10), urgent: false });
  const [resultForm, setResultForm] = useState({ parametre: '', valeur: '', norme: '' });
  const [resultats, setResultats] = useState([]);
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/laboratoire/analyses');
      setAnalyses(res.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const searchPatients = async (q) => {
    setSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    const res = await api.get('/laboratoire/patients', { params: { q } });
    setPatients(res.data.data || []);
  };

  const creer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/laboratoire/analyses', form);
      setMsg('Analyse enregistrée.');
      setShowForm(false);
      void load();
    } catch { setMsg('Erreur.'); }
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
      setMsg('Résultats publiés.');
      setSelected(null);
      setResultats([]);
      void load();
    } catch { setMsg('Erreur publication.'); }
  };

  return (
    <Layout title="Analyses Laboratoire">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analyses biologiques</h2>
          <p className="text-sm text-slate-500">Prélèvements et publication des résultats.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">+ Nouvelle analyse</button>
      </div>

      {msg && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">{msg}</div>}

      {showForm && (
        <form onSubmit={creer} className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="font-bold">Nouveau prélèvement</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium">Patient</span>
              <input value={search} onChange={(e) => searchPatients(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="Rechercher..." />
              {patients.map((p) => (
                <button key={p.id} type="button" onClick={() => { setForm((f) => ({ ...f, patient_id: p.id })); setSearch(p.user?.name); setPatients([]); }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50">{p.user?.name}</button>
              ))}
            </label>
            <label className="block">
              <span className="text-sm font-medium">Type d'analyse *</span>
              <input required value={form.type_analyse} onChange={(e) => setForm((f) => ({ ...f, type_analyse: e.target.value }))}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="NFS, Glycémie..." />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Date prélèvement *</span>
              <input type="date" required value={form.date_prelevement} onChange={(e) => setForm((f) => ({ ...f, date_prelevement: e.target.value }))}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
            <button type="submit" className="rounded-xl bg-medical-primary px-6 py-2 text-sm font-bold text-white">Enregistrer</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {loading ? <p>Chargement...</p> : analyses.map((a) => (
            <button key={a.id} onClick={() => { setSelected(a); setResultats(a.resultats || []); setInterpretation(a.interpretation || ''); }}
              className={`w-full rounded-xl border p-4 text-left ${selected?.id === a.id ? 'border-medical-primary bg-blue-50' : 'bg-white'}`}>
              <div className="flex justify-between">
                <p className="font-semibold">{a.type_analyse}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUT_COLORS[a.statut]}`}>{a.statut?.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-sm text-slate-600">{a.patient?.user?.name}</p>
              <p className="text-xs text-slate-400">{new Date(a.date_prelevement).toLocaleDateString('fr-FR')}</p>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          {selected ? (
            selected.statut === 'resultat_disponible' ? (
              <div>
                <h3 className="font-bold">{selected.type_analyse}</h3>
                <p className="text-sm text-slate-500">{selected.patient?.user?.name}</p>
                <table className="mt-4 w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-400"><th>Paramètre</th><th>Valeur</th><th>Norme</th></tr></thead>
                  <tbody>
                    {(selected.resultats || []).map((r, i) => (
                      <tr key={i} className="border-t"><td className="py-2">{r.parametre}</td><td className="font-medium">{r.valeur}</td><td className="text-slate-400">{r.norme}</td></tr>
                    ))}
                  </tbody>
                </table>
                {selected.interpretation && <p className="mt-3 text-sm text-slate-600"><strong>Interprétation :</strong> {selected.interpretation}</p>}
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
                <button type="button" onClick={ajouterParam} className="mt-2 text-sm text-medical-primary font-medium">+ Ajouter paramètre</button>
                {resultats.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">{resultats.map((r, i) => <li key={i}>{r.parametre}: {r.valeur} ({r.norme})</li>)}</ul>
                )}
                <textarea rows={2} placeholder="Interprétation médicale..." value={interpretation} onChange={(e) => setInterpretation(e.target.value)}
                  className="mt-3 w-full rounded-xl border px-3 py-2 text-sm" />
                <button onClick={publier} className="mt-4 rounded-xl bg-emerald-500 px-6 py-2 text-sm font-bold text-white">Publier les résultats</button>
              </div>
            )
          ) : <p className="text-center text-slate-400 py-16">Sélectionnez une analyse.</p>}
        </div>
      </div>
    </Layout>
  );
}
