import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/parcours/Modal';
import { admissionsApi } from '../../services/admissionsApi';
import api from '../../services/api';
import { unwrapList } from '../../utils/apiList';
import { nomMedecin } from '../../utils/format';
import { compressImage } from '../../utils/image';

const EMPTY = {
  patient_id: '',
  // 1. Identification
  name: '',
  date_naissance: '',
  age_declare: '',
  sexe: '',
  etat_civil: '',
  phone: '',
  adresse: '',
  quartier: '',
  commune: 'Matete',
  ville: 'Kinshasa',
  piece_identite_type: '',
  piece_identite_numero: '',
  photo: '',
  // 2. Administratif
  type_visite: 'consultation',
  departement_id: '',
  medecin_id: '',
  mode_paiement: 'cash',
  assurance_type: '',
  assurance_numero: '',
  mode_arrivee: 'walk_in',
  // 3. Contact d'urgence
  contact_urgence_nom: '',
  contact_urgence_lien: '',
  contact_urgence_tel: '',
  // 4. Motif / triage rapide
  motif_arrivee: '',
  niveau_urgence_accueil: 'leger',
  allergies: '',
  antecedents_medicaux: '',
  observations: '',
};

const MODES_NOUVEAU = [
  { value: 'walk_in', label: 'Se présente pour la première fois (sans RDV)' },
  { value: 'urgence', label: 'Urgence' },
  { value: 'transfert', label: 'Transfert d’un autre établissement' },
];

const MODES_CONNU = [
  { value: 'rdv', label: 'Avec rendez-vous confirmé' },
  { value: 'walk_in', label: 'Sans rendez-vous' },
  { value: 'urgence', label: 'Urgence' },
  { value: 'transfert', label: 'Transfert d’un autre établissement' },
];

const PLAINTES = [
  'Fièvre',
  'Douleur',
  'Céphalées',
  'Toux / difficultés respiratoires',
  'Vomissements / diarrhée',
  'Traumatisme / accident',
  'Suivi de grossesse',
  'Contrôle / bilan',
  'Autre',
];

const ETATS_CIVILS = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf / veuve' },
  { value: 'autre', label: 'Autre' },
];

/** 24 communes de la ville-province de Kinshasa */
const COMMUNES_KINSHASA = [
  'Bandalungwa', 'Barumbu', 'Bumbu', 'Gombe', 'Kalamu', 'Kasa-Vubu',
  'Kimbanseke', 'Kinshasa', 'Kintambo', 'Kisenso', 'Lemba', 'Limete',
  'Lingwala', 'Makala', 'Maluku', 'Masina', 'Matete', 'Mont-Ngafula',
  'Ndjili', 'Ngaba', 'Ngaliema', 'Ngiri-Ngiri', 'Nsele', 'Selembao',
];

/** Pièces adultes (18+) */
const PIECES_ADULTE = [
  { value: 'carte_electeur', label: 'Carte d’électeur' },
  { value: 'carte_identite', label: 'Carte d’identité' },
  { value: 'passeport', label: 'Passeport' },
  { value: 'permis_conduire', label: 'Permis de conduire' },
  { value: 'autre', label: 'Autre' },
];

/**
 * Mineurs (< 18 ans) : en RDC pas de carte d’électeur.
 * Options réalistes hôpital : acte de naissance, carte scolaire,
 * pièce du tuteur, ou aucune (identité déclarée + contact parent).
 */
const PIECES_MINEUR = [
  { value: 'acte_naissance', label: 'Acte / extrait de naissance' },
  { value: 'carte_eleve', label: 'Carte d’élève / scolaire' },
  { value: 'piece_tuteur', label: 'Pièce d’identité du parent / tuteur' },
  { value: 'aucune', label: 'Aucune pièce (identité déclarée)' },
  { value: 'passeport', label: 'Passeport (si disponible)' },
  { value: 'autre', label: 'Autre document' },
];

function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ageFromDate(iso) {
  if (!iso) return '';
  const birth = new Date(iso);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? String(age) : '';
}

export default function Reception() {
  const [departements, setDepartements] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [medecinsHint, setMedecinsHint] = useState('');
  const [medecinsLoading, setMedecinsLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [resultats, setResultats] = useState([]);
  const [patientConnu, setPatientConnu] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [accesPatient, setAccesPatient] = useState(null);
  const [succes, setSucces] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [arriveeAffichee] = useState(nowLocal);

  const ageNum = useMemo(() => {
    const fromDate = ageFromDate(form.date_naissance);
    const raw = fromDate || form.age_declare;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [form.date_naissance, form.age_declare]);

  const estMineur = ageNum != null && ageNum < 18;
  const piecesDisponibles = estMineur ? PIECES_MINEUR : PIECES_ADULTE;
  const sansPiece = form.piece_identite_type === 'aucune';

  useEffect(() => {
    if (!estMineur) return;
    // Si une pièce adulte était sélectionnée, on bascule vers aucune
    const ok = PIECES_MINEUR.some((p) => p.value === form.piece_identite_type);
    if (form.piece_identite_type && !ok) {
      setForm((f) => ({ ...f, piece_identite_type: 'aucune', piece_identite_numero: '' }));
    }
  }, [estMineur, form.piece_identite_type]);

  useEffect(() => {
    api.get('/departements')
      .then((r) => setDepartements(unwrapList(r)))
      .catch(() => setDepartements([]));
  }, []);

  useEffect(() => {
    if (!form.departement_id) {
      setMedecins([]);
      setMedecinsHint('');
      setMedecinsLoading(false);
      return;
    }

    const deptId = String(form.departement_id);
    let cancelled = false;
    setMedecinsLoading(true);
    setMedecinsHint('');

    const sameDept = (m) => {
      const mid = m?.departement_id ?? m?.departement?.id;
      return mid != null && String(mid) === deptId;
    };

    (async () => {
      try {
        const filteredRes = await api.get('/medecins', { params: { departement_id: deptId } });
        let list = unwrapList(filteredRes).filter((m) => m && (m.id != null));

        // Filet de sécurité : si le filtre API renvoie [] alors que des médecins existent
        // (désync id/code, nesting JSON, etc.), on recharge tout et on filtre côté client.
        if (list.length === 0) {
          const allRes = await api.get('/medecins');
          const all = unwrapList(allRes);
          const matched = all.filter(sameDept);
          if (matched.length > 0) {
            list = matched;
          } else if (all.length > 0) {
            list = all;
            setMedecinsHint(
              'Aucun médecin rattaché à ce service — liste complète des médecins actifs affichée.',
            );
          }
        }

        if (!cancelled) {
          setMedecins(list);
          if (list.length === 0) {
            setMedecinsHint(
              'Aucun médecin actif trouvé. Vérifiez le rattachement dans Admin → Utilisateurs (département + profil médecin).',
            );
          }
        }
      } catch {
        if (!cancelled) {
          setMedecins([]);
          setMedecinsHint('Impossible de charger les médecins (réseau / API). Vérifiez que le backend tourne.');
        }
      } finally {
        if (!cancelled) setMedecinsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [form.departement_id]);

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'date_naissance' && value) {
        next.age_declare = ageFromDate(value);
      }
      if (field === 'departement_id') {
        next.medecin_id = '';
      }
      if (field === 'mode_paiement' && value === 'cash') {
        next.assurance_type = '';
        next.assurance_numero = '';
      }
      return next;
    });
  };

  const chercher = async (q) => {
    setSearch(q);
    if (q.trim().length < 2) { setResultats([]); return; }
    const res = await api.get('/accueil/patients', { params: { q } }).catch(() => ({ data: { data: [] } }));
    setResultats(res.data.data || []);
  };

  const choisirPatient = (patient) => {
    setPatientConnu(patient);
    setResultats([]);
    setSearch(patient.user?.name || '');
    setForm((f) => ({
      ...f,
      patient_id: patient.id,
      name: patient.user?.name || '',
      phone: patient.user?.phone || '',
      date_naissance: patient.date_naissance || '',
      age_declare: patient.age_declare != null ? String(patient.age_declare) : ageFromDate(patient.date_naissance),
      sexe: patient.sexe || '',
      etat_civil: patient.etat_civil || '',
      adresse: patient.adresse || '',
      quartier: patient.quartier || '',
      commune: patient.commune || 'Matete',
      ville: patient.ville || 'Kinshasa',
      piece_identite_type: patient.piece_identite_type || '',
      piece_identite_numero: patient.piece_identite_numero || '',
      photo: patient.photo || '',
      contact_urgence_nom: patient.contact_urgence_nom || '',
      contact_urgence_lien: patient.contact_urgence_lien || '',
      contact_urgence_tel: patient.contact_urgence_tel || '',
      allergies: patient.allergies || '',
      antecedents_medicaux: patient.antecedents_medicaux || '',
      assurance_type: patient.assurance_type || '',
      assurance_numero: patient.assurance_numero || '',
      mode_arrivee: 'rdv',
      mode_paiement: patient.assurance_numero ? 'assurance' : 'cash',
    }));
  };

  const nouveauPatient = () => {
    setPatientConnu(null);
    setResultats([]);
    setSearch('');
    setForm((f) => ({
      ...EMPTY,
      motif_arrivee: f.motif_arrivee,
      departement_id: f.departement_id,
      type_visite: f.type_visite,
      niveau_urgence_accueil: f.niveau_urgence_accueil,
    }));
  };

  const reinitialiser = () => {
    setForm(EMPTY);
    setPatientConnu(null);
    setSearch('');
    setResultats([]);
    setError('');
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    setError('');
    try {
      const dataUrl = await compressImage(file);
      setForm((f) => ({ ...f, photo: dataUrl }));
    } catch {
      setError('Impossible de charger la photo. Essayez une autre image.');
    } finally {
      setPhotoBusy(false);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.departement_id) {
      setError('Sélectionnez le département / service demandé.');
      return;
    }
    if (!form.medecin_id) {
      setError('Assignez un médecin : le patient n’apparaîtra que dans la file de ce médecin.');
      return;
    }
    if (!patientConnu && !form.name.trim()) {
      setError('Indiquez le nom et prénom du patient.');
      return;
    }
    if (estMineur && (!form.contact_urgence_nom.trim() || !form.contact_urgence_tel.trim())) {
      setError('Pour un mineur, le contact d’urgence (parent / tuteur) — nom et téléphone — est obligatoire.');
      return;
    }
    if (sansPiece && (!form.contact_urgence_nom.trim() || !form.contact_urgence_tel.trim())) {
      setError('Sans pièce d’identité, renseignez le contact d’urgence (nom + téléphone).');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '' || payload[k] == null) delete payload[k];
      });
      if (payload.age_declare != null) payload.age_declare = Number(payload.age_declare);
      const res = await admissionsApi.create(payload);
      const admission = res.data.data;
      setSucces({
        numero_admission: admission.numero_admission,
        nom: admission.patient?.user?.name || form.name,
        numero_patient: admission.patient?.numero_patient,
        service: admission.departement?.nom,
        type_visite: admission.type_visite,
      });
      reinitialiser();
      if (res.data.acces_patient) setAccesPatient(res.data.acces_patient);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const first = errors ? Object.values(errors).flat()[0] : null;
      setError(first || err.response?.data?.message || 'Enregistrement impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const modes = patientConnu ? MODES_CONNU : MODES_NOUVEAU;
  const paiementAssure = form.mode_paiement === 'assurance' || form.mode_paiement === 'mutuelle' || form.mode_paiement === 'employeur';

  const numeroDossierAffiche = useMemo(() => {
    if (patientConnu?.numero_patient) return patientConnu.numero_patient;
    return 'Généré automatiquement à l’enregistrement';
  }, [patientConnu]);

  return (
    <Layout title="Réception">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Réception</h2>
        <p className="mt-1 text-sm text-slate-500">
          Formulaire d’accueil : identification, informations administratives, contact d’urgence et motif de visite.
        </p>
      </div>

      {succes && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>
            <strong>{succes.nom}</strong> enregistré · {succes.numero_admission}
            {succes.numero_patient ? ` · ${succes.numero_patient}` : ''}
            {succes.service ? ` · ${succes.service}` : ''}
            {succes.type_visite ? ` · ${succes.type_visite}` : ''} — orienté vers le triage.
          </span>
          <button type="button" onClick={() => setSucces(null)} className="text-xs font-semibold underline">Masquer</button>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Recherche anti-doublon */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Recherche (éviter les doublons)</h3>
          <label className="mt-3 block">
            <input
              value={search}
              onChange={(e) => chercher(e.target.value)}
              placeholder="Nom, téléphone ou n° patient (PAT-…)"
              className="w-full rounded-xl border px-3 py-2.5 text-sm"
            />
            {resultats.length > 0 && (
              <div className="mt-1 max-h-64 overflow-y-auto rounded-xl border bg-white shadow-lg">
                {resultats.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => choisirPatient(pt)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-blue-50"
                  >
                    {pt.photo ? (
                      <img src={pt.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                        {(pt.user?.name || '?').charAt(0)}
                      </span>
                    )}
                    <span>
                      <span className="font-semibold">{pt.user?.name}</span>
                      <span className="text-slate-500"> — {pt.numero_patient}</span>
                      {pt.medecin_en_charge && (
                        <span className="block text-xs text-slate-400">{nomMedecin(pt.medecin_en_charge)}</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </label>
          {patientConnu && (
            <div className="mt-3 flex flex-wrap items-start justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm">
              <div>
                <p className="font-bold text-emerald-900">Patient déjà enregistré</p>
                <p className="text-slate-700">
                  {patientConnu.user?.name} · <span className="font-mono">{patientConnu.numero_patient}</span>
                </p>
                <p className="text-slate-600">
                  Médecin en charge : {patientConnu.medecin_en_charge ? nomMedecin(patientConnu.medecin_en_charge) : 'non attribué'}
                </p>
              </div>
              <button type="button" onClick={nouveauPatient} className="text-xs font-semibold text-slate-500 underline">
                Ce n’est pas lui — nouveau patient
              </button>
            </div>
          )}
        </section>

        {/* 1. Identification */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">1. Identification du patient</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block text-sm font-medium">Nom et post-nom, prénom *</span>
              <input
                required={!patientConnu}
                value={form.name}
                onChange={set('name')}
                placeholder="ex. Kalala Marie Joséphine"
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
                disabled={!!patientConnu}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Date de naissance</span>
              <input type="date" value={form.date_naissance} onChange={set('date_naissance')} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Âge</span>
              <input
                type="number"
                min={0}
                max={120}
                value={form.age_declare}
                onChange={set('age_declare')}
                placeholder="si date inconnue"
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Sexe</span>
              <select value={form.sexe} onChange={set('sexe')} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="">—</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">État civil</span>
              <select value={form.etat_civil} onChange={set('etat_civil')} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="">—</option>
                {ETATS_CIVILS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Numéro de téléphone</span>
              <input value={form.phone} onChange={set('phone')} placeholder="+243 …" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>

            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block text-sm font-medium">Adresse (avenue)</span>
              <input value={form.adresse} onChange={set('adresse')} placeholder="Avenue …" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Quartier</span>
              <input value={form.quartier} onChange={set('quartier')} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Commune</span>
              <select value={form.commune} onChange={set('commune')} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="">— Choisir —</option>
                {COMMUNES_KINSHASA.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Ville</span>
              <input value={form.ville} onChange={set('ville')} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                {estMineur ? 'Document d’identification' : 'Type de pièce d’identité'}
              </span>
              <select value={form.piece_identite_type} onChange={set('piece_identite_type')} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="">—</option>
                {piecesDisponibles.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </label>

            {!sansPiece && (
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">
                  {form.piece_identite_type === 'piece_tuteur'
                    ? 'N° pièce du parent / tuteur'
                    : form.piece_identite_type === 'acte_naissance'
                      ? 'N° acte / extrait de naissance'
                      : form.piece_identite_type === 'carte_eleve'
                        ? 'N° carte scolaire'
                        : 'N° de la pièce'}
                </span>
                <input value={form.piece_identite_numero} onChange={set('piece_identite_numero')} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
              </label>
            )}

            {sansPiece && (
              <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Identité déclarée sans pièce. Renseignez obligatoirement le <strong>contact d’urgence</strong> (parent / tuteur) plus bas.
              </div>
            )}

            <div className="sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block text-sm font-medium">Photo du patient (optionnel)</span>
              <div className="flex flex-wrap items-center gap-4">
                {form.photo ? (
                  <img src={form.photo} alt="Patient" className="h-20 w-20 rounded-xl border object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed bg-slate-50 text-xs text-slate-400">
                    Aucune
                  </div>
                )}
                <div className="space-y-2">
                  <input type="file" accept="image/*" capture="user" onChange={onPhoto} className="block text-sm" />
                  {photoBusy && <p className="text-xs text-slate-500">Compression…</p>}
                  {form.photo && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, photo: '' }))} className="text-xs text-red-600 underline">
                      Retirer la photo
                    </button>
                  )}
                  <p className="text-xs text-slate-400">Utile pour éviter les doublons. Compressée automatiquement.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Administratif */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">2. Informations administratives</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">N° dossier patient</span>
              <input readOnly value={numeroDossierAffiche} className="w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-600" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Date et heure d’arrivée</span>
              <input readOnly value={arriveeAffichee} className="w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-600" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Type de visite *</span>
              <select required value={form.type_visite} onChange={set('type_visite')} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="consultation">Consultation</option>
                <option value="urgence">Urgence</option>
                <option value="hospitalisation">Hospitalisation</option>
                <option value="suivi">Suivi</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Département / service *</span>
              <select required value={form.departement_id} onChange={set('departement_id')} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="">Choisir…</option>
                {departements.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Médecin demandé / assigné *</span>
              <select required value={form.medecin_id} onChange={set('medecin_id')} className="w-full rounded-xl border px-3 py-2.5 text-sm" disabled={!form.departement_id || medecinsLoading}>
                <option value="">{medecinsLoading ? 'Chargement…' : 'Choisir le médecin…'}</option>
                {medecins.map((m) => {
                  const label = nomMedecin(m.name || m.user?.name);
                  const extra = m.specialite || m.departement || '';
                  return (
                    <option key={m.id} value={m.id}>
                      {label}{extra ? ` — ${extra}` : ''}
                    </option>
                  );
                })}
              </select>
              {form.departement_id && !medecinsLoading && medecinsHint && (
                <span className="mt-1 block text-xs text-amber-700">{medecinsHint}</span>
              )}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Mode d’arrivée</span>
              <select value={form.mode_arrivee} onChange={set('mode_arrivee')} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                {modes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              {!patientConnu && (
                <span className="mt-1 block text-xs text-slate-400">Le rendez-vous est réservé aux patients déjà enregistrés.</span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Mode de paiement *</span>
              <select required value={form.mode_paiement} onChange={set('mode_paiement')} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="cash">Cash</option>
                <option value="assurance">Assurance</option>
                <option value="mutuelle">Mutuelle</option>
                <option value="employeur">Prise en charge employeur</option>
              </select>
            </label>
            {paiementAssure && (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Type d’assurance / mutuelle</span>
                  <input value={form.assurance_type} onChange={set('assurance_type')} placeholder="INSS, privée…" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">N° assurance / mutuelle</span>
                  <input value={form.assurance_numero} onChange={set('assurance_numero')} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
                </label>
              </>
            )}
          </div>
        </section>

        {/* 3. Contact d'urgence */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">
            3. Contact d’urgence{(estMineur || sansPiece) ? ' *' : ''}
          </h3>
          {(estMineur || sansPiece) && (
            <p className="mt-1 text-xs text-amber-800">
              Obligatoire pour mineur ou sans pièce — parent, tuteur ou accompagnant.
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Nom du contact{(estMineur || sansPiece) ? ' *' : ''}</span>
              <input required={estMineur || sansPiece} value={form.contact_urgence_nom} onChange={set('contact_urgence_nom')} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Lien de parenté</span>
              <input value={form.contact_urgence_lien} onChange={set('contact_urgence_lien')} placeholder={estMineur ? 'Père, mère, tuteur…' : 'Époux, père, mère…'} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Téléphone{(estMineur || sansPiece) ? ' *' : ''}</span>
              <input required={estMineur || sansPiece} value={form.contact_urgence_tel} onChange={set('contact_urgence_tel')} placeholder="+243 …" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
          </div>
        </section>

        {/* 4. Motif / triage rapide */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">4. Motif de la visite (triage rapide)</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Plainte principale (liste)</span>
              <select
                value={PLAINTES.includes(form.motif_arrivee) ? form.motif_arrivee : (form.motif_arrivee ? 'Autre' : '')}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({ ...f, motif_arrivee: v === 'Autre' ? '' : v }));
                }}
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
              >
                <option value="">Choisir…</option>
                {PLAINTES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Plainte principale (détail) *</span>
              <input
                required
                value={form.motif_arrivee}
                onChange={set('motif_arrivee')}
                placeholder="Texte libre — plainte principale"
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Niveau d’urgence</span>
              <select value={form.niveau_urgence_accueil} onChange={set('niveau_urgence_accueil')} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="leger">Léger</option>
                <option value="modere">Modéré</option>
                <option value="urgent">Urgent</option>
                <option value="critique">Critique</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Allergies signalées</span>
              <input value={form.allergies} onChange={set('allergies')} placeholder="Aucune si vide" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Antécédents connus (maladies chroniques)</span>
              <textarea
                rows={2}
                value={form.antecedents_medicaux}
                onChange={set('antecedents_medicaux')}
                placeholder="Champ simple — pas un dossier médical complet"
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Observations</span>
              <textarea rows={2} value={form.observations} onChange={set('observations')} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            </label>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 pb-8">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-medical-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer et orienter vers le triage'}
          </button>
          <button type="button" onClick={reinitialiser} className="rounded-xl border px-4 py-2.5 text-sm">
            Réinitialiser
          </button>
        </div>
      </form>

      <Modal open={!!accesPatient} title="Identifiants 1re connexion" onClose={() => setAccesPatient(null)}>
        {accesPatient && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Remettez ces informations au patient. À la 1re connexion, il complétera son profil et changera le mot de passe.
            </p>
            <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm">
              <p><span className="text-slate-500">N° patient :</span> <strong className="font-mono text-lg">{accesPatient.numero_patient}</strong></p>
              <p><span className="text-slate-500">Nom (identifiant) :</span> <strong>{accesPatient.nom_complet || accesPatient.login}</strong></p>
              <p><span className="text-slate-500">Login technique :</span> <strong className="break-all font-mono">{accesPatient.login}</strong></p>
              <p><span className="text-slate-500">Mot de passe par défaut :</span> <strong className="font-mono text-lg tracking-wide">{accesPatient.password}</strong></p>
            </div>
            <button type="button" onClick={() => setAccesPatient(null)} className="w-full rounded-xl bg-medical-primary py-3 text-sm font-bold text-white">
              Terminé
            </button>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
