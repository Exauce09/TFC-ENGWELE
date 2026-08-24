import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import {
  consultationDocxChildren,
  consultationPrintBody,
  dossierDocxChildren,
  dossierPrintBody,
  downloadDocx,
  downloadPdf,
  ordonnanceDocxChildren,
  ordonnancePrintBody,
  printHtml,
  resultatDocxChildren,
  resultatPrintBody,
} from '../../utils/printDoc';

export default function PatientDossier() {
  const [data, setData] = useState({
    patient: null,
    consultations: [],
    examens: [],
    analyses: [],
    derniers_resultats: [],
    visites: [],
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
        const payload = dossierRes.data.data || { patient: null, consultations: [] };
        setData(payload);
        setPrescriptions(prescRes.data.data || []);
        const first = (payload.consultations || [])[0];
        if (first) setSelected(first);
        if ((payload.consultations || []).length === 0 && (prescRes.data.data || []).length > 0) {
          setTab('prescriptions');
        }
      } catch {
        setData({ patient: null, consultations: [], examens: [], analyses: [], derniers_resultats: [], visites: [] });
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
  const consultations = data.consultations || [];
  const visites = data.visites || [];

  return (
    <Layout title="Mon Dossier Médical">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mon dossier médical</h2>
          <p className="text-sm text-slate-500">
            Historique de vos visites, consultations, résultats et ordonnances.
          </p>
        </div>
        {!loading && p && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => printHtml('Dossier médical', dossierPrintBody(data, prescriptions))}
              className="rounded-xl border px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Imprimer le dossier
            </button>
            <button
              type="button"
              onClick={() =>
                void downloadPdf(
                  `${p.numero_patient || 'dossier'}.pdf`,
                  'Dossier médical',
                  dossierPrintBody(data, prescriptions),
                )
              }
              className="rounded-xl border px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() =>
                void downloadDocx(`${p.numero_patient || 'dossier'}.docx`, () =>
                  dossierDocxChildren(data, prescriptions),
                )
              }
              className="rounded-xl border px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Word
            </button>
          </div>
        )}
      </div>

      {p && (
        <div className="mb-6 grid gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">N° Patient</p>
            <p className="font-semibold text-slate-900">{p.numero_patient}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Nom</p>
            <p className="font-semibold text-slate-900">{p.user?.name || '—'}</p>
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

      {visites.length > 0 && (
        <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <p className="font-bold text-sky-900">Visites enregistrées</p>
          <ul className="mt-2 space-y-1 text-xs">
            {visites.map((v) => (
              <li key={v.id}>
                <span className="font-mono font-semibold">{v.numero_admission}</span>
                {' · '}{v.statut_label || v.statut}
                {v.service ? ` · ${v.service}` : ''}
                {v.motif ? ` — ${v.motif}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: 'consultations', label: `Consultations (${consultations.length})` },
          { key: 'resultats', label: `Résultats (${resultats.length})` },
          { key: 'prescriptions', label: `Prescriptions (${prescriptions.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); if (t.key !== 'consultations') setSelected(null); }}
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
            {consultations.length === 0 ? (
              <p className="rounded-xl border bg-white p-8 text-center text-slate-500">
                Aucune consultation enregistrée pour le moment.
              </p>
            ) : consultations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c)}
                className={`w-full rounded-xl border p-4 text-left transition hover:shadow-md ${selected?.id === c.id ? 'border-medical-primary bg-blue-50' : 'bg-white'}`}
              >
                <p className="font-semibold text-slate-900">{c.motif || 'Consultation'}</p>
                <p className="text-xs text-slate-500">
                  {c.departement?.nom || '—'} · {c.medecin?.user?.name || 'Médecin'}
                </p>
                <p className="text-xs text-slate-400">
                  {c.date_consultation
                    ? new Date(c.date_consultation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'}
                  {c.numero_admission ? ` · ${c.numero_admission}` : ''}
                </p>
                {c.statut_parcours_label && (
                  <p className="mt-1 text-[11px] font-semibold text-sky-700">{c.statut_parcours_label}</p>
                )}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm text-slate-900">
            {selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selected.motif || 'Consultation'}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selected.medecin?.user?.name || 'Médecin'} — {selected.departement?.nom || '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        printHtml(selected.motif || 'Consultation', consultationPrintBody(selected))
                      }
                      className="rounded-lg border px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Imprimer
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void downloadPdf(
                          `consultation-${selected.id}.pdf`,
                          selected.motif || 'Consultation',
                          consultationPrintBody(selected),
                        )
                      }
                      className="rounded-lg border px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void downloadDocx(`consultation-${selected.id}.docx`, () =>
                          consultationDocxChildren(selected),
                        )
                      }
                      className="rounded-lg border px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Word
                    </button>
                  </div>
                </div>
                {selected.numero_admission && (
                  <p className="mt-1 font-mono text-xs text-slate-500">{selected.numero_admission}</p>
                )}

                {selected.triage && (
                  <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm">
                    <p className="text-xs font-bold uppercase text-orange-700">Triage infirmier</p>
                    <p className="mt-1">Urgence : <strong>{selected.triage.niveau_urgence}</strong></p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                      {selected.triage.temperature != null && <p>T° {selected.triage.temperature}</p>}
                      {selected.triage.tension_arterielle && <p>TA {selected.triage.tension_arterielle}</p>}
                      {selected.triage.frequence_cardiaque != null && <p>FC {selected.triage.frequence_cardiaque}</p>}
                      {selected.triage.saturation_02 != null && <p>SpO₂ {selected.triage.saturation_02}%</p>}
                    </div>
                  </div>
                )}

                {selected.anamnese && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase text-slate-400">Anamnèse</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{selected.anamnese}</p>
                  </div>
                )}
                {selected.examen_clinique && (
                  <div className="mt-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Examen clinique</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{selected.examen_clinique}</p>
                  </div>
                )}
                {(selected.diagnostics || []).map((d) => (
                  <div key={d.id} className="mt-3 rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs font-bold text-emerald-700">
                      Diagnostic {d.code_cim10 ? `(${d.code_cim10})` : ''}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-800">{d.libelle}</p>
                  </div>
                ))}
                {!selected.diagnostics?.length && selected.diagnostic_final && (
                  <div className="mt-3 rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs font-bold text-emerald-700">Diagnostic</p>
                    <p className="mt-0.5 text-sm text-slate-800">{selected.diagnostic_final}</p>
                  </div>
                )}
                {selected.observations && (
                  <div className="mt-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Observations</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{selected.observations}</p>
                  </div>
                )}
                {!selected.anamnese && !selected.examen_clinique && !(selected.diagnostics || []).length && !selected.diagnostic_final && (
                  <p className="mt-4 text-sm text-slate-500">
                    Fiche d’arrivée enregistrée. Le détail médical apparaît dès que le médecin complète la consultation.
                  </p>
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
                    {ex.numero_admission ? ` · ${ex.numero_admission}` : ''}
                    {ex.termine_at || ex.date_analyse
                      ? ` · ${new Date(ex.termine_at || ex.date_analyse).toLocaleDateString('fr-FR')}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {ex.statut === 'termine' ? 'Résultat' : (ex.statut_label || ex.statut)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      printHtml(ex.type_examen || ex.type_analyse || 'Résultat', resultatPrintBody(ex))
                    }
                    className="rounded-lg border px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Imprimer
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void downloadPdf(
                        `resultat-${ex.id}.pdf`,
                        ex.type_examen || ex.type_analyse || 'Résultat',
                        resultatPrintBody(ex),
                      )
                    }
                    className="rounded-lg border px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void downloadDocx(`resultat-${ex.id}.docx`, () => resultatDocxChildren(ex))
                    }
                    className="rounded-lg border px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Word
                  </button>
                </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  {pr.numero_ordonnance || 'Prescription'}
                  {pr.date_prescription
                    ? ` · ${new Date(pr.date_prescription).toLocaleDateString('fr-FR')}`
                    : ''}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    pr.statut === 'active' ? 'bg-amber-100 text-amber-800'
                      : pr.statut === 'delivree' ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {pr.statut_label || (pr.statut === 'active' ? 'À retirer à la pharmacie' : pr.statut)}
                  </span>
                  <button
                    type="button"
                    onClick={() => printHtml(pr.numero_ordonnance || 'Ordonnance', ordonnancePrintBody(pr))}
                    className="rounded-lg border px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Imprimer
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadPdf(
                      `${pr.numero_ordonnance || 'ordonnance'}.pdf`,
                      pr.numero_ordonnance || 'Ordonnance',
                      ordonnancePrintBody(pr),
                    )}
                    className="rounded-lg border px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void downloadDocx(`${pr.numero_ordonnance || 'ordonnance'}.docx`, () =>
                        ordonnanceDocxChildren(pr),
                      )
                    }
                    className="rounded-lg border px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Word
                  </button>
                </div>
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
