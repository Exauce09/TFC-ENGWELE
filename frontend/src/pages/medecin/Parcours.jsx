import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

const URGENCE_COLORS = {
  critique: 'bg-red-100 text-red-800',
  urgent: 'bg-orange-100 text-orange-800',
  moins_urgent: 'bg-amber-100 text-amber-800',
  non_urgent: 'bg-emerald-100 text-emerald-800',
};

export default function MedecinParcours() {
  const [file, setFile] = useState([]);
  const [selected, setSelected] = useState(null);
  const [circuit, setCircuit] = useState('ambulatoire');
  const [decision, setDecision] = useState('');
  const [service, setService] = useState('');
  const [lit, setLit] = useState('');
  const [suivi, setSuivi] = useState('');
  const [consignes, setConsignes] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const res = await api.get('/medecin/file-consultation');
    setFile(res.data.data || []);
  };

  useEffect(() => { void load(); }, []);

  const avancerExamens = async () => {
    if (!selected) return;
    await api.put(`/medecin/episodes/${selected.id}/avancer`, { etape: 'examens' });
    setMsg('Patient orienté vers laboratoire / imagerie.');
    void load();
  };

  const retourDecision = async () => {
    if (!selected) return;
    await api.put(`/medecin/episodes/${selected.id}/avancer`, { etape: 'decision' });
    setMsg('Étape décision ouverte.');
    void load();
  };

  const validerDecision = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/medecin/episodes/${selected.id}/decision`, {
        circuit,
        decision_medicale: decision,
        service_hospitalisation: circuit === 'hospitalisation' ? service : null,
        lit: circuit === 'hospitalisation' ? lit : null,
        consignes_sortie: consignes || null,
        date_suivi_prevue: suivi || null,
      });
      setMsg(`Circuit ${circuit} enregistré.`);
      setSelected(null);
      setDecision('');
      void load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <Layout title="Parcours patient">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Parcours après triage</h2>
        <p className="text-sm text-slate-500">
          Étapes 3 à 6 — Consultation, examens, décision (ambulatoire ou hospitalisation), sortie / suivi.
        </p>
      </div>

      {msg && <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{msg}</div>}
      {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="font-bold">File consultation / examens / décision</h3>
          {file.length === 0 ? (
            <p className="rounded-xl border bg-white p-6 text-center text-slate-500">Aucun patient dans le parcours.</p>
          ) : file.map((ep) => (
            <button key={ep.id} type="button" onClick={() => setSelected(ep)}
              className={`w-full rounded-xl border p-4 text-left ${selected?.id === ep.id ? 'border-medical-primary bg-blue-50' : 'bg-white'}`}>
              <div className="flex justify-between gap-2">
                <p className="font-semibold">{ep.patient?.user?.name}</p>
                {ep.niveau_urgence && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${URGENCE_COLORS[ep.niveau_urgence]}`}>
                    {ep.niveau_urgence}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{ep.etape_label} · {ep.motif_arrivee}</p>
            </button>
          ))}
        </div>

        <div>
          {selected ? (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold">{selected.patient?.user?.name}</h3>
              <p className="text-sm text-slate-500">{selected.patient?.user?.name}</p>
              <p className="mt-2 text-sm"><strong>Étape :</strong> {selected.etape_label}</p>
              <p className="text-sm"><strong>Dossier :</strong> {selected.dossier?.numero_dossier || '—'}</p>
              <p className="text-sm"><strong>Motif :</strong> {selected.motif_arrivee}</p>
              {selected.notes_triage && <p className="text-sm"><strong>Triage :</strong> {selected.notes_triage}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={avancerExamens} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                  → Examens (labo / imagerie)
                </button>
                <button type="button" onClick={retourDecision} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                  → Décision médicale
                </button>
                  <a href={`/medecin/dossiers`} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    Compléter le dossier {selected.dossier?.numero_dossier || ''}
                  </a>
              </div>

              <form onSubmit={validerDecision} className="mt-6 border-t pt-4">
                <h4 className="font-bold">Décision (étape 5 → 6)</h4>
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={circuit === 'ambulatoire'} onChange={() => setCircuit('ambulatoire')} />
                    6a Ambulatoire (ordonnance → pharmacie → sortie)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={circuit === 'hospitalisation'} onChange={() => setCircuit('hospitalisation')} />
                    6b Hospitalisation
                  </label>
                </div>
                <textarea required rows={3} value={decision} onChange={(e) => setDecision(e.target.value)}
                  placeholder="Diagnostic final / décision thérapeutique..."
                  className="mt-3 w-full rounded-xl border px-3 py-2 text-sm" />
                {circuit === 'hospitalisation' ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input required value={service} onChange={(e) => setService(e.target.value)}
                      placeholder="Service / salle" className="rounded-xl border px-3 py-2 text-sm" />
                    <input value={lit} onChange={(e) => setLit(e.target.value)}
                      placeholder="Lit (ex. L-12)" className="rounded-xl border px-3 py-2 text-sm" />
                  </div>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input type="date" value={suivi} onChange={(e) => setSuivi(e.target.value)}
                      className="rounded-xl border px-3 py-2 text-sm" title="Date suivi post-sortie" />
                    <input value={consignes} onChange={(e) => setConsignes(e.target.value)}
                      placeholder="Consignes de sortie" className="rounded-xl border px-3 py-2 text-sm" />
                  </div>
                )}
                <button type="submit" className="mt-4 rounded-xl bg-medical-primary px-6 py-2.5 text-sm font-bold text-white">
                  Valider la décision
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-slate-50 p-10 text-center text-slate-500">
              Sélectionnez un patient pour continuer le parcours.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
