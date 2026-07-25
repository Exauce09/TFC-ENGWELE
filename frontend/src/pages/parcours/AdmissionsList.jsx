import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Modal from '../../components/parcours/Modal';
import { useAuth } from '../../context/AuthContext';
import { admissionsApi } from '../../services/admissionsApi';
import api from '../../services/api';

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  date_naissance: '',
  sexe: 'M',
  adresse: '',
  commune: 'Matete',
  contact_urgence_nom: '',
  contact_urgence_tel: '',
  contact_urgence_lien: '',
  assurance_type: '',
  assurance_numero: '',
  motif_arrivee: '',
  mode_arrivee: 'walk_in',
  departement_id: '',
  observations: '',
  patient_id: '',
};

export default function AdmissionsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = user?.role === 'receptionniste';
  const [items, setItems] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [accesPatient, setAccesPatient] = useState(null);
  const [createdAdmissionId, setCreatedAdmissionId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, dRes] = await Promise.all([
        admissionsApi.list({ actifs: 1 }),
        api.get('/departements'),
      ]);
      setItems(aRes.data.data || []);
      setDepartements(dRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  // Accueil : formulaire d'arrivée ouvert par défaut
  useEffect(() => {
    if (canCreate) setShowForm(true);
  }, [canCreate]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const searchPatients = async (q) => {
    setSearch(q);
    if (q.length < 2) { setPatients([]); return; }
    const res = await api.get('/accueil/patients', { params: { q } }).catch(() => ({ data: { data: [] } }));
    setPatients(res.data.data || []);
  };

  const resetForm = () => {
    setForm(EMPTY);
    setSearch('');
    setPatients([]);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.departement_id) {
      setError('Sélectionnez le département / service d\'orientation.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.patient_id) delete payload.patient_id;
      if (!payload.email) delete payload.email;
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      const res = await admissionsApi.create(payload);
      const admission = res.data.data;
      setItems((prev) => [admission, ...prev]);
      resetForm();
      if (res.data.acces_patient) {
        setAccesPatient(res.data.acces_patient);
        setCreatedAdmissionId(admission.id);
      } else {
        navigate(`/parcours/${admission.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const continuerVersDossier = () => {
    const id = createdAdmissionId;
    setAccesPatient(null);
    setCreatedAdmissionId(null);
    if (id) navigate(`/parcours/${id}`);
  };

  return (
    <Layout title="Parcours patient">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {canCreate ? 'Arrivée patient' : 'Parcours patient'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {canCreate
              ? 'À l’accueil : nom et prénom suffisent. Le patient complète son profil et change le mot de passe à la 1re connexion.'
              : 'Consultez les admissions en cours et ouvrez le dossier médical.'}
          </p>
        </div>
        {canCreate && !showForm && (
          <button
            type="button"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white"
          >
            + Nouvelle arrivée
          </button>
        )}
      </div>

      {/* ── Formulaire unique d'arrivée (réceptionniste) ── */}
      {canCreate && showForm && (
        <form onSubmit={submit} className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-900">1. Identification du patient</h3>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="text-xs text-slate-400 hover:text-slate-700">
              Masquer
            </button>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Rechercher un patient déjà connu (anti-doublon)</span>
            <input
              value={search}
              onChange={(e) => searchPatients(e.target.value)}
              placeholder="Nom ou n° patient (PAT-…)"
              className="w-full rounded-xl border px-3 py-2.5 text-sm"
            />
            {patients.length > 0 && (
              <div className="mt-1 rounded-xl border bg-white shadow-lg">
                {patients.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        patient_id: pt.id,
                        name: pt.user?.name || '',
                        phone: pt.user?.phone || '',
                        email: pt.user?.email || '',
                      }));
                      setSearch(pt.user?.name || '');
                      setPatients([]);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-50"
                  >
                    {pt.user?.name} — {pt.numero_patient}
                  </button>
                ))}
              </div>
            )}
            {form.patient_id ? (
              <p className="mt-2 text-xs text-emerald-700">
                Patient sélectionné — un nouveau dossier de visite sera ouvert.
                <button type="button" className="ml-2 underline" onClick={() => setForm((f) => ({ ...EMPTY, motif_arrivee: f.motif_arrivee, departement_id: f.departement_id }))}>
                  Créer un nouveau patient à la place
                </button>
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                Nouveau patient : saisissez seulement le nom et prénom. Identifiants : nom + mot de passe par défaut <code className="rounded bg-slate-100 px-1">Amen2026</code>.
              </p>
            )}
          </label>

          {!form.patient_id && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">Nom et prénom *</span>
                <input
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="ex. Marie Kalala"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Téléphone (optionnel)</span>
                <input value={form.phone} onChange={set('phone')} placeholder="+243 … — le patient peut le saisir plus tard" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
              </label>
            </div>
          )}

          <h3 className="mt-6 text-lg font-bold text-slate-900">2. Motif et orientation</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Motif d&apos;arrivée / objectif de la venue *</span>
              <input
                required
                value={form.motif_arrivee}
                onChange={set('motif_arrivee')}
                placeholder="Fièvre, douleur, suivi, bilans…"
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Département / service *</span>
              <select required value={form.departement_id} onChange={set('departement_id')} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="">Choisir…</option>
                {departements.map((d) => (
                  <option key={d.id} value={d.id}>{d.nom}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Mode d&apos;arrivée</span>
              <select value={form.mode_arrivee} onChange={set('mode_arrivee')} className="w-full rounded-xl border px-3 py-2.5 text-sm">
                <option value="walk_in">Sans RDV (walk-in)</option>
                <option value="rdv">Avec rendez-vous</option>
                <option value="urgence">Urgence</option>
                <option value="transfert">Transfert</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium">Observations</span>
              <textarea
                rows={2}
                value={form.observations}
                onChange={set('observations')}
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
                placeholder="Informations utiles pour le triage / le médecin…"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-medical-primary px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? 'Enregistrement…' : 'Créer patient / ouvrir dossier → Triage'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-xl border px-4 py-2.5 text-sm">
              Réinitialiser
            </button>
          </div>
        </form>
      )}

      {!canCreate && (
        <p className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Seul le réceptionniste peut enregistrer une arrivée. Vous pouvez ouvrir un dossier déjà créé.
        </p>
      )}

      <h3 className="mb-3 text-lg font-bold text-slate-900">Admissions en cours</h3>
      {loading ? (
        <p className="text-slate-500">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border bg-white p-10 text-center text-slate-500">
          Aucune admission active.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Link
              key={a.id}
              to={`/parcours/${a.id}`}
              className="block rounded-2xl border bg-white p-4 shadow-sm transition hover:border-medical-primary hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{a.patient?.user?.name}</p>
                  <p className="text-xs text-slate-500">
                    {a.numero_admission} · {a.patient?.numero_patient} · {a.motif_arrivee}
                    {a.departement?.nom ? ` · ${a.departement.nom}` : ''}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {a.statut_label || a.statut}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={!!accesPatient} title="Identifiants 1re connexion" onClose={continuerVersDossier}>
        {accesPatient && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Remettez ces informations au patient. À la 1re connexion, il complétera son profil et changera le mot de passe.
            </p>
            <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm">
              <p><span className="text-slate-500">N° patient :</span> <strong className="font-mono text-lg">{accesPatient.numero_patient}</strong></p>
              <p><span className="text-slate-500">Nom (identifiant) :</span> <strong className="break-all">{accesPatient.nom_complet || accesPatient.login}</strong></p>
              <p><span className="text-slate-500">Login technique :</span> <strong className="break-all font-mono">{accesPatient.login}</strong></p>
              <p><span className="text-slate-500">Mot de passe par défaut :</span> <strong className="font-mono text-lg tracking-wide">{accesPatient.password}</strong></p>
            </div>
            <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Connexion avec le nom et prénom (ou le login) + <strong>Amen2026</strong>. Affiché une seule fois.
            </p>
            <button
              type="button"
              onClick={continuerVersDossier}
              className="w-full rounded-xl bg-medical-primary py-3 text-sm font-bold text-white"
            >
              Continuer vers le dossier → Triage
            </button>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
