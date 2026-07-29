import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function PatientDossier() {
  const [data, setData] = useState({
    patient: null,
    consultations: [],
    examens: [],
    analyses: [],
    derniers_resultats: [],
  });
  const [prescriptions, setPrescriptions] = useState([]);
  const [tab, setTab] = useState('consultations');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dossierRes, prescRes] = await Promise.all([
          api.get('/patient/dossier'),
          api.get('/patient/prescriptions'),
        ]);
        setData(dossierRes.data.data || { patient: null, consultations: [] });
        setPrescriptions(prescRes.data.data || []);
      } catch {
        setData({ patient: null, consultations: [], examens: [], analyses: [], derniers_resultats: [] });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const p = data.patient;
  const examens = data.examens || data.derniers_resultats || [];
  const analyses = data.analyses || [];
  const resultats = [
    ...examens.filter((e) => e.statut === 'termine' || (e.resultats || []).length > 0),
    ...analyses,
  ];

  return (
    <Layout title="Mon Dossier Médical">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Mon dossier médical</h2>
        <p className="text-sm text-slate-500">Consultations, résultats d&apos;examens et prescriptions.</p>
      </div>

      {p && (
        <div className="mb-6 grid gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">N° Patient</p>
            <p className="font-semibold text-slate-900">{p.numero_patient}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Groupe sanguin</p>
            <p className="font-semibold text-slate-900">{p.groupe_sanguin || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Allergies</p>
            <p className="font-semibold text-red-600">{p.allergies || 'Aucune connue'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Naissance</p>
            <p className="font-semibold text-slate-900">
              {p.date_naissance ? new Date(p.date_naissance).toLocaleDateString('fr-FR') : '—'}
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: 'consultations', label: 'Consultations' },
          { key: 'resultats', label: 'Résultats' },
          { key: 'prescriptions', label: 'Prescriptions' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); setSelected(null); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === t.key ? 'bg-medical-primary text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : tab === 'consultations' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {(data.consultations || []).length === 0 ? (
              <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucune consultation enregistrée.</p>
            ) : (data.consultations || []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c)}
                className={`w-full rounded-xl border p-4 text-left transition hover:shadow-md ${selected?.id === c.id ? 'border-medical-primary bg-blue-50' : 'bg-white'}`}
              >
                <p className="font-semibold text-slate-900">{c.motif}</p>
                <p className="text-xs text-slate-500">
                  {c.departement?.nom} · {c.medecin?.user?.name}
                </p>
                <p className="text-xs text-slate-400">
                  {c.date_consultation ? new Date(c.date_consultation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            {selected ? (
              <>
                <h3 className="text-lg font-bold text-slate-900">{selected.motif}</h3>
                <p className="mt-1 text-sm text-slate-500">{selected.medecin?.user?.name} — {selected.departement?.nom}</p>
                {selected.anamnese && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase text-slate-400">Anamnèse</p>
                    <p className="mt-1 text-sm text-slate-700">{selected.anamnese}</p>
                  </div>
                )}
                {selected.examen_clinique && (
                  <div className="mt-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Examen clinique</p>
                    <p className="mt-1 text-sm text-slate-700">{selected.examen_clinique}</p>
                  </div>
                )}
                {selected.diagnostics?.map((d) => (
                  <div key={d.id} className="mt-3 rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs font-bold text-emerald-700">Diagnostic {d.code_cim10 ? `(${d.code_cim10})` : ''}</p>
                    <p className="mt-0.5 text-sm text-slate-800">{d.libelle}</p>
                  </div>
                ))}
                {selected.observations && (
                  <div className="mt-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Observations</p>
                    <p className="mt-1 text-sm text-slate-700">{selected.observations}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="py-12 text-center text-slate-400">Sélectionnez une consultation pour voir le détail.</p>
            )}
          </div>
        </div>
      ) : tab === 'resultats' ? (
        <div className="space-y-4">
          {resultats.length === 0 ? (
            <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucun résultat disponible pour le moment.</p>
          ) : resultats.map((ex) => (
            <article key={`${ex.id}-${ex.type_examen || ex.type_analyse || 'ex'}`} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{ex.type_examen || ex.type_analyse || 'Examen'}</p>
                  <p className="text-xs text-slate-500">
                    {ex.statut_label || ex.statut || 'terminé'}
                    {ex.termine_at || ex.date_analyse
                      ? ` · ${new Date(ex.termine_at || ex.date_analyse).toLocaleDateString('fr-FR')}`
                      : ''}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Résultat
                </span>
              </div>
              {(ex.resultats || []).length > 0 && (
                <table className="mt-3 w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-400">
                      <th className="py-1">Paramètre</th>
                      <th>Valeur</th>
                      <th>Unité</th>
                      <th>Norme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ex.resultats.map((r, i) => (
                      <tr key={i} className="border-t border-slate-50">
                        <td className="py-1.5 font-medium">{r.parametre}</td>
                        <td className={r.flag === 'critique' || r.flag === 'H' ? 'font-bold text-red-700' : ''}>{r.valeur}</td>
                        <td>{r.unite || '—'}</td>
                        <td className="text-slate-500">{r.norme || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {(ex.resultat || ex.interpretation) && (
                <p className="mt-3 text-sm text-slate-700">{ex.interpretation || ex.resultat}</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucune prescription.</p>
          ) : prescriptions.map((pr) => (
            <article key={`${pr.source || 'd'}-${pr.id}`} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  {pr.numero_ordonnance || 'Prescription'}
                  {pr.date_prescription
                    ? ` · ${new Date(pr.date_prescription).toLocaleDateString('fr-FR')}`
                    : ''}
                </p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pr.statut === 'active' || pr.statut === 'delivree' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {pr.statut_label || pr.statut}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Par {pr.medecin?.user?.name || 'Médecin'}
                {pr.source === 'parcours' ? ' · Parcours' : ''}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(pr.medicaments || []).map((m, i) => (
                  <div key={i} className="rounded-lg bg-blue-50 p-3">
                    <p className="font-medium text-slate-900">{m.nom_dci || m.nom || m.nom_commercial}</p>
                    <p className="text-xs text-slate-600">{m.dosage} · {m.frequence || m.posologie} · {m.duree}</p>
                  </div>
                ))}
              </div>
              {(pr.instructions_generales || pr.diagnostic_motif) && (
                <p className="mt-3 text-xs italic text-slate-500">{pr.instructions_generales || pr.diagnostic_motif}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
