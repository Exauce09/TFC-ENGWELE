import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MedecinLayout from '../../components/layout/MedecinLayout';
import { OrdonnanceCard } from '../../components/medecin/OrdonnanceForm';
import api from '../../services/api';
import { nomMedecin } from '../../utils/format';
import { buildDossierHtml, downloadDossierDocx, downloadDossierPdf, printHtml } from '../../utils/printDownload';

function ageFrom(patient) {
  if (patient?.date_naissance) {
    const birth = new Date(patient.date_naissance);
    if (!Number.isNaN(birth.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
      return age;
    }
  }
  if (patient?.age_declare != null) return patient.age_declare;
  return null;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function Section({ title, children, action }) {
  return (
    <section className="medecin-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#C5D9D0] px-5 py-3.5">
        <h3 className="font-medecin-display text-lg text-[#0D3B3A]">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-[#7A9A90]">{text}</p>;
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A9A90]">{label}</dt>
      <dd className="font-medium text-[#0D3B3A]">{value || '—'}</dd>
    </div>
  );
}

function InfoBlock({ label, value, alert }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A9A90]">{label}</p>
      <p className={`mt-0.5 ${alert ? 'font-semibold text-red-700' : 'text-[#0D3B3A]'}`}>
        {value || 'Non renseigné'}
      </p>
    </div>
  );
}

export default function MedecinPatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/medecin/patients/${id}`);
        if (!cancelled) setData(res.data.data || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Impossible de charger le dossier patient.');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const patient = data?.patient;
  const age = useMemo(() => ageFrom(patient), [patient]);
  const derniereVisite = data?.derniere_visite;
  const examens = data?.examens || [];
  const analyses = data?.analyses || [];
  const derniersResultats = data?.derniers_resultats || [];
  const consultations = data?.consultations || [];
  const admissions = data?.admissions || [];
  const ordonnances = data?.ordonnances || [];

  if (loading) {
    return (
      <MedecinLayout title="Dossier patient">
        <p className="text-[#5A8A7A]">Chargement du dossier…</p>
      </MedecinLayout>
    );
  }

  if (!patient) {
    return (
      <MedecinLayout title="Dossier patient">
        <p className="text-red-700">{error || 'Patient introuvable'}</p>
        <button type="button" onClick={() => navigate('/medecin/patients')} className="medecin-btn-ghost mt-4">
          ← Retour aux patients
        </button>
      </MedecinLayout>
    );
  }

  return (
    <MedecinLayout title="Dossier patient">
      <button
        type="button"
        onClick={() => navigate('/medecin/patients')}
        className="mb-4 text-xs font-semibold text-[#1A7A6D] hover:underline"
      >
        ← Retour aux patients
      </button>

      <section className="medecin-card-accent mb-6 p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="shrink-0">
            {patient.photo ? (
              <img
                src={patient.photo}
                alt={patient.user?.name || 'Patient'}
                className="h-28 w-28 rounded-2xl border-2 border-[#1A7A6D]/30 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-dashed border-[#B8D4C8] bg-[#F4FAF8] font-medecin-display text-3xl text-[#1A7A6D]">
                {(patient.user?.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A7A6D]">
              {patient.numero_patient}
            </p>
            <h2 className="font-medecin-display text-3xl text-[#0D3B3A]">{patient.user?.name}</h2>
            <p className="mt-1 text-sm text-[#5A8A7A]">
              {age != null ? `${age} ans` : 'Âge —'}
              {patient.sexe ? ` · ${patient.sexe === 'F' ? 'Femme' : 'Homme'}` : ''}
              {patient.groupe_sanguin ? ` · Groupe ${patient.groupe_sanguin}` : ''}
              {patient.user?.phone ? ` · ${patient.user.phone}` : ''}
            </p>
            <p className="mt-1 text-xs text-[#7A9A90]">
              {[patient.adresse, patient.quartier, patient.commune, patient.ville].filter(Boolean).join(' · ') || 'Adresse non renseignée'}
            </p>

            {patient.allergies && (
              <p className="mt-3 inline-block rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800">
                Allergies : {patient.allergies}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {patient.admission_active && (
                <Link to={`/parcours/${patient.admission_active.id}`} className="medecin-btn text-xs">
                  Visite en cours →
                </Link>
              )}
              <Link to="/medecin/dossiers" className="medecin-btn-ghost text-xs">
                Consultations
              </Link>
              <button
                type="button"
                className="medecin-btn-ghost text-xs"
                onClick={() => {
                  const title = `Dossier ${patient.numero_patient || patient.id}`;
                  printHtml(title, buildDossierHtml(data));
                }}
              >
                Imprimer le dossier
              </button>
              <button
                type="button"
                className="medecin-btn-ghost text-xs"
                onClick={() => void downloadDossierPdf(data)}
              >
                PDF
              </button>
              <button
                type="button"
                className="medecin-btn-ghost text-xs"
                onClick={() => void downloadDossierDocx(data)}
              >
                Word
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Section title="Informations administratives">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Date de naissance" value={formatDate(patient.date_naissance)} />
            <Info label="Lieu de naissance" value={patient.lieu_naissance} />
            <Info label="Nationalité" value={patient.nationalite} />
            <Info label="Profession" value={patient.profession} />
            <Info label="État civil" value={patient.etat_civil} />
            <Info
              label="Pièce d'identité"
              value={
                patient.piece_identite_type
                  ? `${patient.piece_identite_type}${patient.piece_identite_numero ? ` · ${patient.piece_identite_numero}` : ''}`
                  : null
              }
            />
            <Info
              label="Assurance"
              value={
                patient.assurance_type || patient.mutuelle
                  ? `${patient.assurance_type || patient.mutuelle || ''}${
                      patient.assurance_numero || patient.numero_mutuelle
                        ? ` · ${patient.assurance_numero || patient.numero_mutuelle}`
                        : ''
                    }`
                  : null
              }
            />
            <Info
              label="Contact d'urgence"
              value={
                patient.contact_urgence_nom
                  ? `${patient.contact_urgence_nom}${
                      patient.contact_urgence_tel ? ` · ${patient.contact_urgence_tel}` : ''
                    }${patient.contact_urgence_lien ? ` (${patient.contact_urgence_lien})` : ''}`
                  : null
              }
            />
          </dl>
        </Section>

        <Section title="Antécédents">
          <div className="space-y-3 text-sm">
            <InfoBlock label="Antécédents médicaux" value={patient.antecedents_medicaux} />
            <InfoBlock label="Antécédents familiaux" value={patient.antecedents_familiaux} />
            <InfoBlock label="Allergies" value={patient.allergies} alert={!!patient.allergies} />
          </div>
        </Section>
      </div>

      <div className="mb-6">
        <Section
          title="Dernière visite à l'hôpital"
          action={
            derniereVisite ? (
              <Link to={`/parcours/${derniereVisite.id}`} className="text-xs font-semibold text-[#1A7A6D] hover:underline">
                Ouvrir →
              </Link>
            ) : null
          }
        >
          {!derniereVisite ? (
            <Empty text="Aucune visite enregistrée." />
          ) : (
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Info label="N° admission" value={derniereVisite.numero_admission} />
              <Info label="Arrivée" value={formatDateTime(derniereVisite.arrivee_at)} />
              <Info label="Statut" value={derniereVisite.statut_label || derniereVisite.statut} />
              <Info label="Département" value={derniereVisite.departement?.nom} />
              <Info label="Motif" value={derniereVisite.motif_arrivee} />
              <Info
                label="Médecin"
                value={
                  derniereVisite.medecin_referent?.user?.name
                    ? nomMedecin(derniereVisite.medecin_referent.user.name)
                    : null
                }
              />
              <Info label="Mode d'arrivée" value={derniereVisite.mode_arrivee} />
              <Info
                label="Urgence"
                value={derniereVisite.triage?.niveau_urgence || derniereVisite.niveau_urgence_accueil}
              />
            </div>
          )}
        </Section>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Section title="Derniers résultats">
          {derniersResultats.length === 0 ? (
            <Empty text="Aucun résultat disponible." />
          ) : (
            <ul className="space-y-3">
              {derniersResultats.map((r, i) => (
                <li key={r.id || i} className="rounded-xl border border-[#C5D9D0] bg-[#F4FAF8] p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[#0D3B3A]">
                      {r.type_examen || r.type_analyse || 'Examen'}
                    </p>
                    <span className="text-[11px] text-[#7A9A90]">
                      {formatDateTime(r.termine_at || r.date_resultat || r.prescrit_at || r.date_prelevement)}
                    </span>
                  </div>
                  {r.interpretation && <p className="mt-1 text-xs text-[#5A8A7A]">{r.interpretation}</p>}
                  {r.resultats && (
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-2 text-[11px] text-[#0D3B3A]">
                      {typeof r.resultats === 'string' ? r.resultats : JSON.stringify(r.resultats, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Examens passés">
          {examens.length === 0 && analyses.length === 0 ? (
            <Empty text="Aucun examen enregistré." />
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {examens.map((ex) => (
                <li key={`ex-${ex.id}`} className="rounded-lg border border-[#C5D9D0] bg-white px-3 py-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-[#0D3B3A]">{ex.type_examen}</p>
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-[#5A8A7A]">{ex.statut}</span>
                  </div>
                  <p className="text-xs text-[#7A9A90]">
                    {ex.admission?.numero_admission || ''} · {formatDateTime(ex.prescrit_at)}
                    {ex.urgent ? ' · Urgent' : ''}
                  </p>
                  {ex.indication && <p className="mt-1 text-xs text-[#5A8A7A]">{ex.indication}</p>}
                </li>
              ))}
              {analyses.map((a) => (
                <li key={`an-${a.id}`} className="rounded-lg border border-[#C5D9D0] bg-white px-3 py-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-[#0D3B3A]">{a.type_analyse}</p>
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-[#5A8A7A]">{a.statut}</span>
                  </div>
                  <p className="text-xs text-[#7A9A90]">
                    {a.dossier?.numero_dossier || ''} · {formatDate(a.date_prelevement)}
                    {a.urgent ? ' · Urgent' : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Section title="Consultations">
          {consultations.length === 0 ? (
            <Empty text="Aucune consultation." />
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {consultations.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/medecin/dossiers"
                    className="block rounded-lg border border-[#C5D9D0] bg-white px-3 py-2 text-sm transition hover:border-[#1A7A6D]"
                  >
                    <div className="flex justify-between gap-2">
                      <p className="font-medium text-[#0D3B3A]">{c.numero_dossier || `DOS-${c.id}`}</p>
                      <span className="text-[11px] text-[#7A9A90]">{formatDate(c.date_consultation)}</span>
                    </div>
                    <p className="text-xs text-[#5A8A7A]">{c.motif || '—'}</p>
                    <p className="text-[11px] text-[#7A9A90]">
                      {c.departement?.nom || ''}
                      {c.medecin?.user?.name ? ` · ${nomMedecin(c.medecin.user.name)}` : ''}
                      {c.diagnostics?.[0]?.libelle ? ` · ${c.diagnostics[0].libelle}` : ''}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Historique des visites">
          {admissions.length === 0 ? (
            <Empty text="Aucune admission." />
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {admissions.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/parcours/${a.id}`}
                    className="block rounded-lg border border-[#C5D9D0] bg-white px-3 py-2 text-sm transition hover:border-[#1A7A6D]"
                  >
                    <div className="flex justify-between gap-2">
                      <p className="font-medium text-[#0D3B3A]">{a.numero_admission}</p>
                      <span className="text-[11px] text-[#7A9A90]">{formatDateTime(a.arrivee_at)}</span>
                    </div>
                    <p className="text-xs text-[#5A8A7A]">{a.motif_arrivee || '—'}</p>
                    <p className="text-[11px] text-[#7A9A90]">
                      {a.statut_label || a.statut}
                      {a.departement?.nom ? ` · ${a.departement.nom}` : ''}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section
        title="Ordonnances"
        action={
          <Link to="/medecin/dossiers" className="text-xs font-semibold text-[#1A7A6D] hover:underline">
            Gérer dans Consultations →
          </Link>
        }
      >
        {ordonnances.length === 0 ? (
          <Empty text="Aucune ordonnance." />
        ) : (
          <div className="space-y-3">
            {ordonnances.map((pr) => (
              <OrdonnanceCard
                key={pr.id}
                prescription={pr}
                patient={patient}
                dossier={pr.dossier || consultations.find((c) => c.id === pr.dossier_id)}
              />
            ))}
          </div>
        )}
      </Section>
    </MedecinLayout>
  );
}
