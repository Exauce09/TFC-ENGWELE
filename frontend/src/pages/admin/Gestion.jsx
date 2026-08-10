import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { getRoleLabel, ROLE_LABELS } from '../../components/layout/roleMenus';
import api from '../../services/api';

function SearchBar({ value, onChange, placeholder }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mb-4 w-full max-w-md rounded-xl border px-4 py-2 text-sm"
    />
  );
}

function Field({ label, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}{required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}

const inputCls = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-medical-primary';
const sectionCls = 'rounded-xl border border-slate-100 bg-slate-50/60 p-4';


export function AdminPatients() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/patients', { params: q ? { q } : {} })
      .then((r) => setItems(r.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { void load(); }, [q]);

  const toggle = async (id) => {
    await api.put(`/admin/patients/${id}/toggle`);
    load();
  };

  return (
    <Layout title="Gestion des Patients">
      <h2 className="mb-4 text-2xl font-bold text-slate-900">Gestion des Patients</h2>
      <SearchBar value={q} onChange={setQ} placeholder="Rechercher par nom, email ou n° patient..." />

      {loading ? <p className="text-slate-500">Chargement...</p> : items.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucun patient.</p>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <article key={p.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
              <div>
                <p className="font-semibold">{p.user?.name}</p>
                <p className="text-sm text-slate-500">{p.numero_patient} · {p.user?.email}</p>
                <p className="text-xs text-slate-400">{p.commune || '—'} · {p.sexe === 'F' ? 'Féminin' : 'Masculin'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.user?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {p.user?.is_active ? 'Actif' : 'Inactif'}
                </span>
                <button
                  onClick={() => toggle(p.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${p.user?.is_active ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}
                >
                  {p.user?.is_active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}

export function AdminMedecins() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/medecins', { params: q ? { q } : {} })
      .then((r) => setItems(r.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <Layout title="Gestion des Médecins">
      <h2 className="mb-4 text-2xl font-bold text-slate-900">Gestion des Médecins</h2>
      <SearchBar value={q} onChange={setQ} placeholder="Rechercher par nom, spécialité ou n° ordre..." />

      {loading ? <p className="text-slate-500">Chargement...</p> : items.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucun médecin.</p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <article key={m.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
              <div>
                <p className="font-semibold">{m.user?.name}</p>
                <p className="text-sm text-medical-primary">{m.specialite}</p>
                <p className="text-xs text-slate-400">{m.departement?.nom} · {m.numero_ordre}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-600">{Number(m.tarif_consultation).toLocaleString()} FC</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${m.user?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {m.user?.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}

const EMPTY_DEPT = { nom: '', code: '', description: '' };

export function AdminDepartements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_DEPT);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/departements')
      .then((r) => setItems(r.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_DEPT);
    setShowForm(true);
    setError('');
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({ nom: d.nom, code: d.code, description: d.description || '' });
    setShowForm(true);
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/admin/departements/${editing.id}`, form);
      } else {
        await api.post('/admin/departements', form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const toggleActive = async (d) => {
    await api.put(`/admin/departements/${d.id}`, { is_active: !d.is_active });
    load();
  };

  return (
    <Layout title="Départements">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Départements</h2>
          <p className="mt-1 text-sm text-slate-500">
            Services déjà disponibles pour l&apos;affectation du personnel. Vous pouvez en ajouter d&apos;autres ci-dessous.
          </p>
        </div>
        <button onClick={openCreate} className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">
          + Ajouter un département
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="mb-6 grid gap-3 rounded-2xl border bg-white p-6 sm:grid-cols-2">
          <p className="sm:col-span-2 text-sm font-semibold text-slate-700">
            {editing ? 'Modifier le département' : 'Nouveau département'}
          </p>
          <input required placeholder="Nom *" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <input required placeholder="Code * (ex. CARDIO)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="rounded-xl border px-3 py-2 text-sm" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm sm:col-span-2" rows={2} />
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
            <button type="submit" className="rounded-xl bg-medical-primary px-6 py-2 text-sm font-bold text-white">
              {editing ? 'Mettre à jour' : 'Créer le département'}
            </button>
          </div>
        </form>
      )}

      {loading ? <p className="text-slate-500">Chargement...</p> : items.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">
          Aucun département. Cliquez sur « Ajouter un département » pour en créer un.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <article key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
              <div>
                <p className="font-semibold">{d.nom}</p>
                <p className="text-xs text-slate-400">Code : {d.code}</p>
                {d.description && <p className="mt-1 text-sm text-slate-500">{d.description}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-right text-sm text-slate-500">
                <div>
                  <p>{d.medecins_count ?? 0} médecin(s)</p>
                  <p>{d.users_count ?? 0} personnel</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {d.is_active ? 'Actif' : 'Inactif'}
                </span>
                <button onClick={() => openEdit(d)} className="rounded-lg border px-3 py-1 text-xs hover:bg-slate-50">Modifier</button>
                <button onClick={() => toggleActive(d)} className="rounded-lg border px-3 py-1 text-xs hover:bg-slate-50">
                  {d.is_active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}

const EMPTY_MEDECIN = {
  numero_ordre: '',
  specialite: '',
  grade: '',
  diplomes: '',
  tarif_consultation: '',
  duree_consultation: '30',
  annees_experience: '',
  type_contrat: '',
  bio: '',
  langues: '',
};

const EMPTY_INFIRMIER = {
  numero_enregistrement: '',
  specialisation: '',
  diplome: '',
  service_affectation: '',
  poste_garde: '',
  annees_experience: '',
};

const EMPTY_RECEPTION = {
  poste_accueil: '',
  langues: 'Français, Lingala',
  horaires_shift: '',
};

const EMPTY_LABO = {
  specialisation: '',
  diplome: '',
  numero_agrement: '',
};

const EMPTY_PHARMA = {
  numero_ordre: '',
  diplome: '',
  specialisation: '',
};

const EMPTY_CAISSE = {
  guichet: '',
  diplome: '',
  plafond_transaction: '',
};

const EMPTY_RADIO = {
  types_imagerie: '',
  diplome: '',
  numero_agrement: '',
  habilitation: 'technicien',
};

const EMPTY_USER = {
  prenom: '',
  nom: '',
  post_nom: '',
  sexe: '',
  date_naissance: '',
  piece_identite_numero: '',
  adresse: '',
  email: '',
  phone: '',
  password: 'Password@123',
  must_change_password: true,
  role: 'receptionniste',
  departement_id: '',
  date_embauche: '',
  statut: 'actif',
  superviseur_id: '',
  medecin: { ...EMPTY_MEDECIN },
  profil_infirmier: { ...EMPTY_INFIRMIER },
  profil_receptionniste: { ...EMPTY_RECEPTION },
  profil_laborantin: { ...EMPTY_LABO },
  profil_pharmacien: { ...EMPTY_PHARMA },
  profil_caissier: { ...EMPTY_CAISSE },
  profil_radiologue: { ...EMPTY_RADIO },
};

const MEDECIN_ROLES = [
  'medecin_generaliste',
  'medecin_interne',
  'pediatre',
  'gynecologue',
  'urgentiste',
  'chirurgien',
  'ophtalmologue',
  'anesthesiste',
  'dentiste',
];

const STAFF_DEPT_ROLES = [
  'infirmier',
  'sage_femme',
  'receptionniste',
  'laborantin',
  'pharmacien',
  'caissier',
  'echographiste',
  'radiologue',
  'kinesitherapeute',
];

const ROLES = [
  'patient',
  ...MEDECIN_ROLES,
  'laborantin',
  'pharmacien',
  'infirmier',
  'sage_femme',
  'caissier',
  'receptionniste',
  'echographiste',
  'radiologue',
  'kinesitherapeute',
  'directeur_medical',
  'gestionnaire_assurance',
  'responsable_chambres',
  'admin',
];

const isMedecinRole = (role) => MEDECIN_ROLES.includes(role);
const requiresDepartement = (role) => isMedecinRole(role) || STAFF_DEPT_ROLES.includes(role);
const isInfirmierRole = (role) => role === 'infirmier' || role === 'sage_femme';
const isRadioRole = (role) => role === 'radiologue' || role === 'echographiste';

function csvJoin(value) {
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
}

function buildFormFromUser(u) {
  const medecin = u.medecin || {};
  const profilInfirmier = u.profil_infirmier || u.profilInfirmier || {};
  const profilReception = u.profil_receptionniste || u.profilReceptionniste || {};
  const profilLabo = u.profil_laborantin || u.profilLaborantin || {};
  const profilPharma = u.profil_pharmacien || u.profilPharmacien || {};
  const profilCaisse = u.profil_caissier || u.profilCaissier || {};
  const profilRadio = u.profil_radiologue || u.profilRadiologue || {};

  return {
    prenom: u.prenom || '',
    nom: u.nom || '',
    post_nom: u.post_nom || '',
    sexe: u.sexe || '',
    date_naissance: u.date_naissance ? String(u.date_naissance).slice(0, 10) : '',
    piece_identite_numero: u.piece_identite_numero || '',
    adresse: u.adresse || '',
    email: u.email || '',
    phone: u.phone || '',
    password: '',
    must_change_password: !!u.must_change_password,
    role: u.role,
    departement_id: u.departement_id ? String(u.departement_id) : '',
    date_embauche: u.date_embauche ? String(u.date_embauche).slice(0, 10) : '',
    statut: u.statut || (u.is_active ? 'actif' : 'inactif'),
    superviseur_id: u.superviseur_id ? String(u.superviseur_id) : '',
    medecin: {
      ...EMPTY_MEDECIN,
      ...medecin,
      langues: csvJoin(medecin.langues),
      tarif_consultation: medecin.tarif_consultation ?? '',
      duree_consultation: medecin.duree_consultation ?? '30',
      annees_experience: medecin.annees_experience ?? '',
    },
    profil_infirmier: { ...EMPTY_INFIRMIER, ...profilInfirmier },
    profil_receptionniste: {
      ...EMPTY_RECEPTION,
      ...profilReception,
      langues: csvJoin(profilReception.langues) || EMPTY_RECEPTION.langues,
    },
    profil_laborantin: { ...EMPTY_LABO, ...profilLabo },
    profil_pharmacien: { ...EMPTY_PHARMA, ...profilPharma },
    profil_caissier: {
      ...EMPTY_CAISSE,
      ...profilCaisse,
      plafond_transaction: profilCaisse.plafond_transaction ?? '',
    },
    profil_radiologue: {
      ...EMPTY_RADIO,
      ...profilRadio,
      types_imagerie: csvJoin(profilRadio.types_imagerie),
    },
  };
}

export function AdminUtilisateurs() {
  const [items, setItems] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_USER);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (q) params.q = q;
    if (roleFilter) params.role = roleFilter;
    if (deptFilter) params.departement_id = deptFilter;
    api.get('/admin/utilisateurs', { params })
      .then((r) => setItems(r.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [q, roleFilter, deptFilter]);

  useEffect(() => {
    api.get('/admin/departements')
      .then((r) => setDepartements((r.data.data || []).filter((d) => d.is_active === true || d.is_active === 1)))
      .catch(() => setDepartements([]));
  }, []);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setNested = (group, key, value) => setForm((f) => ({
    ...f,
    [group]: { ...f[group], [key]: value },
  }));

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_USER,
      medecin: { ...EMPTY_MEDECIN },
      profil_infirmier: { ...EMPTY_INFIRMIER },
      profil_receptionniste: { ...EMPTY_RECEPTION },
      profil_laborantin: { ...EMPTY_LABO },
      profil_pharmacien: { ...EMPTY_PHARMA },
      profil_caissier: { ...EMPTY_CAISSE },
      profil_radiologue: { ...EMPTY_RADIO },
      departement_id: departements[0]?.id ? String(departements[0].id) : '',
      date_embauche: new Date().toISOString().slice(0, 10),
    });
    setError('');
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm(buildFormFromUser(u));
    setError('');
    setShowForm(true);
  };

  const onRoleChange = (role) => {
    setForm((f) => ({
      ...f,
      role,
      departement_id: requiresDepartement(role)
        ? (f.departement_id || (departements[0]?.id ? String(departements[0].id) : ''))
        : f.departement_id,
      medecin: {
        ...f.medecin,
        specialite: isMedecinRole(role) && !f.medecin.specialite
          ? getRoleLabel(role)
          : f.medecin.specialite,
      },
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.prenom.trim() || !form.nom.trim()) {
      setError('Le prénom et le nom sont obligatoires.');
      return;
    }
    if (requiresDepartement(form.role) && !form.departement_id) {
      setError('Sélectionnez un département pour ce rôle. Créez-en un via Admin → Départements si la liste est vide.');
      return;
    }

    const payload = {
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      post_nom: form.post_nom.trim() || null,
      sexe: form.sexe || null,
      date_naissance: form.date_naissance || null,
      piece_identite_numero: form.piece_identite_numero.trim() || null,
      adresse: form.adresse.trim() || null,
      phone: form.phone.trim() || null,
      role: form.role,
      departement_id: form.departement_id ? Number(form.departement_id) : null,
      date_embauche: form.date_embauche || null,
      statut: form.statut || 'actif',
      superviseur_id: form.superviseur_id ? Number(form.superviseur_id) : null,
      must_change_password: !!form.must_change_password,
    };

    if (isMedecinRole(form.role)) {
      payload.medecin = {
        ...form.medecin,
        tarif_consultation: form.medecin.tarif_consultation === '' ? null : Number(form.medecin.tarif_consultation),
        duree_consultation: form.medecin.duree_consultation === '' ? 30 : Number(form.medecin.duree_consultation),
        annees_experience: form.medecin.annees_experience === '' ? null : Number(form.medecin.annees_experience),
      };
    }
    if (isInfirmierRole(form.role)) {
      payload.profil_infirmier = {
        ...form.profil_infirmier,
        annees_experience: form.profil_infirmier.annees_experience === ''
          ? null
          : Number(form.profil_infirmier.annees_experience),
      };
    }
    if (form.role === 'receptionniste') payload.profil_receptionniste = { ...form.profil_receptionniste };
    if (form.role === 'laborantin') payload.profil_laborantin = { ...form.profil_laborantin };
    if (form.role === 'pharmacien') payload.profil_pharmacien = { ...form.profil_pharmacien };
    if (form.role === 'caissier') {
      payload.profil_caissier = {
        ...form.profil_caissier,
        plafond_transaction: form.profil_caissier.plafond_transaction === ''
          ? null
          : Number(form.profil_caissier.plafond_transaction),
      };
    }
    if (isRadioRole(form.role)) payload.profil_radiologue = { ...form.profil_radiologue };

    try {
      if (editing) {
        if (form.password) payload.password = form.password;
        await api.put(`/admin/utilisateurs/${editing.id}`, payload);
      } else {
        await api.post('/admin/utilisateurs', {
          ...payload,
          email: form.email.trim(),
          password: form.password,
        });
      }
      setShowForm(false);
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstFieldError = errors && Object.values(errors).flat()?.[0];
      setError(firstFieldError || err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const toggle = async (id) => {
    await api.put(`/admin/utilisateurs/${id}/toggle`);
    load();
  };

  const remove = async (u) => {
    if (!window.confirm(`Supprimer définitivement « ${u.name} » (${u.email}) ?`)) return;
    try {
      await api.delete(`/admin/utilisateurs/${u.id}`);
      load();
    } catch (err) {
      window.alert(err.response?.data?.message || 'Suppression impossible');
    }
  };

  const needsDept = requiresDepartement(form.role);
  const superviseurs = items.filter((u) => !editing || u.id !== editing.id);

  return (
    <Layout title="Utilisateurs">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestion des utilisateurs</h2>
          <p className="mt-1 text-sm text-slate-500">Fiche personnel complète : identité, accès, service et profil métier.</p>
        </div>
        <button onClick={openCreate} className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">
          + Nouvel utilisateur
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBar value={q} onChange={setQ} placeholder="Rechercher par nom, prénom, email ou téléphone..." />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">Tous les rôles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
        </select>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">Tous les départements</option>
          {departements.map((d) => (
            <option key={d.id} value={d.id}>{d.nom}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={save} className="mb-6 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900">
              {editing ? 'Modifier la fiche' : 'Nouveau personnel'}
            </h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {getRoleLabel(form.role)}
            </span>
          </div>

          <section className={sectionCls}>
            <h4 className="mb-3 text-sm font-bold text-slate-800">1. Identité</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Prénom" required>
                <input required value={form.prenom} onChange={(e) => setField('prenom', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Nom" required>
                <input required value={form.nom} onChange={(e) => setField('nom', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Post-nom">
                <input value={form.post_nom} onChange={(e) => setField('post_nom', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Sexe">
                <select value={form.sexe} onChange={(e) => setField('sexe', e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </Field>
              <Field label="Date de naissance">
                <input type="date" value={form.date_naissance} onChange={(e) => setField('date_naissance', e.target.value)} className={inputCls} />
              </Field>
              <Field label="N° pièce d'identité">
                <input value={form.piece_identite_numero} onChange={(e) => setField('piece_identite_numero', e.target.value)} className={inputCls} placeholder="Carte d'électeur, passeport…" />
              </Field>
              <Field label="Adresse" className="sm:col-span-2 lg:col-span-3">
                <input value={form.adresse} onChange={(e) => setField('adresse', e.target.value)} className={inputCls} placeholder="Avenue, commune, ville" />
              </Field>
            </div>
          </section>

          <section className={sectionCls}>
            <h4 className="mb-3 text-sm font-bold text-slate-800">2. Contact & accès</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Email professionnel" required>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  disabled={!!editing}
                  className={`${inputCls} disabled:bg-slate-100`}
                />
              </Field>
              <Field label="Téléphone">
                <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={inputCls} placeholder="+243…" />
              </Field>
              <Field label={editing ? 'Nouveau mot de passe' : 'Mot de passe'} required={!editing}>
                <input
                  required={!editing}
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  className={inputCls}
                  placeholder={editing ? 'Laisser vide pour ne pas changer' : 'Min. 8 caractères'}
                />
              </Field>
              <label className="flex items-center gap-2 sm:col-span-2 lg:col-span-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={!!form.must_change_password}
                  onChange={(e) => setField('must_change_password', e.target.checked)}
                />
                Forcer le changement de mot de passe à la première connexion
              </label>
            </div>
          </section>

          <section className={sectionCls}>
            <h4 className="mb-3 text-sm font-bold text-slate-800">3. Affectation</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Rôle / métier" required>
                <select value={form.role} onChange={(e) => onRoleChange(e.target.value)} className={inputCls}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
                </select>
              </Field>
              {(needsDept || form.role === 'admin' || form.role === 'directeur_medical') && (
                <Field label="Département / service" required={needsDept}>
                  <select
                    required={needsDept}
                    value={form.departement_id}
                    onChange={(e) => setField('departement_id', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">{needsDept ? 'Choisir…' : 'Optionnel'}</option>
                    {departements.map((d) => (
                      <option key={d.id} value={d.id}>{d.nom}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Date d'embauche">
                <input type="date" value={form.date_embauche} onChange={(e) => setField('date_embauche', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Statut RH">
                <select value={form.statut} onChange={(e) => setField('statut', e.target.value)} className={inputCls}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="conge">En congé</option>
                  <option value="suspendu">Suspendu</option>
                </select>
              </Field>
              <Field label="Superviseur">
                <select value={form.superviseur_id} onChange={(e) => setField('superviseur_id', e.target.value)} className={inputCls}>
                  <option value="">Aucun</option>
                  {superviseurs.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({getRoleLabel(u.role)})</option>
                  ))}
                </select>
              </Field>
            </div>
            {needsDept && departements.length === 0 && (
              <p className="mt-3 text-sm text-amber-700">
                Aucun département actif. Créez-en un dans Admin → Départements avant d&apos;ajouter ce personnel.
              </p>
            )}
          </section>

          {isMedecinRole(form.role) && (
            <section className={sectionCls}>
              <h4 className="mb-3 text-sm font-bold text-slate-800">4. Profil médecin</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="N° ordre">
                  <input value={form.medecin.numero_ordre} onChange={(e) => setNested('medecin', 'numero_ordre', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Spécialité">
                  <input value={form.medecin.specialite} onChange={(e) => setNested('medecin', 'specialite', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Grade">
                  <input value={form.medecin.grade} onChange={(e) => setNested('medecin', 'grade', e.target.value)} className={inputCls} placeholder="Chef de clinique…" />
                </Field>
                <Field label="Tarif consultation (FC)">
                  <input type="number" min="0" value={form.medecin.tarif_consultation} onChange={(e) => setNested('medecin', 'tarif_consultation', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Durée consultation (min)">
                  <input type="number" min="5" max="240" value={form.medecin.duree_consultation} onChange={(e) => setNested('medecin', 'duree_consultation', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Années d'expérience">
                  <input type="number" min="0" value={form.medecin.annees_experience} onChange={(e) => setNested('medecin', 'annees_experience', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Type de contrat">
                  <select value={form.medecin.type_contrat} onChange={(e) => setNested('medecin', 'type_contrat', e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    <option value="cdi">CDI</option>
                    <option value="cdd">CDD</option>
                    <option value="vacation">Vacation</option>
                    <option value="consultant">Consultant</option>
                  </select>
                </Field>
                <Field label="Langues (séparées par virgule)">
                  <input value={form.medecin.langues} onChange={(e) => setNested('medecin', 'langues', e.target.value)} className={inputCls} placeholder="Français, Lingala, Anglais" />
                </Field>
                <Field label="Diplômes" className="sm:col-span-2 lg:col-span-3">
                  <input value={form.medecin.diplomes} onChange={(e) => setNested('medecin', 'diplomes', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Bio / présentation" className="sm:col-span-2 lg:col-span-3">
                  <textarea rows={3} value={form.medecin.bio} onChange={(e) => setNested('medecin', 'bio', e.target.value)} className={inputCls} />
                </Field>
              </div>
            </section>
          )}

          {isInfirmierRole(form.role) && (
            <section className={sectionCls}>
              <h4 className="mb-3 text-sm font-bold text-slate-800">4. Profil infirmier / sage-femme</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="N° enregistrement">
                  <input value={form.profil_infirmier.numero_enregistrement} onChange={(e) => setNested('profil_infirmier', 'numero_enregistrement', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Spécialisation">
                  <input value={form.profil_infirmier.specialisation} onChange={(e) => setNested('profil_infirmier', 'specialisation', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Diplôme">
                  <input value={form.profil_infirmier.diplome} onChange={(e) => setNested('profil_infirmier', 'diplome', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Service d'affectation">
                  <input value={form.profil_infirmier.service_affectation} onChange={(e) => setNested('profil_infirmier', 'service_affectation', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Poste de garde">
                  <input value={form.profil_infirmier.poste_garde} onChange={(e) => setNested('profil_infirmier', 'poste_garde', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Années d'expérience">
                  <input type="number" min="0" value={form.profil_infirmier.annees_experience} onChange={(e) => setNested('profil_infirmier', 'annees_experience', e.target.value)} className={inputCls} />
                </Field>
              </div>
            </section>
          )}

          {form.role === 'receptionniste' && (
            <section className={sectionCls}>
              <h4 className="mb-3 text-sm font-bold text-slate-800">4. Profil réception</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Poste d'accueil">
                  <input value={form.profil_receptionniste.poste_accueil} onChange={(e) => setNested('profil_receptionniste', 'poste_accueil', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Horaires / shift">
                  <input value={form.profil_receptionniste.horaires_shift} onChange={(e) => setNested('profil_receptionniste', 'horaires_shift', e.target.value)} className={inputCls} placeholder="Matin / Après-midi / Nuit" />
                </Field>
                <Field label="Langues">
                  <input value={form.profil_receptionniste.langues} onChange={(e) => setNested('profil_receptionniste', 'langues', e.target.value)} className={inputCls} />
                </Field>
              </div>
            </section>
          )}

          {form.role === 'laborantin' && (
            <section className={sectionCls}>
              <h4 className="mb-3 text-sm font-bold text-slate-800">4. Profil laboratoire</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Spécialisation">
                  <input value={form.profil_laborantin.specialisation} onChange={(e) => setNested('profil_laborantin', 'specialisation', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Diplôme">
                  <input value={form.profil_laborantin.diplome} onChange={(e) => setNested('profil_laborantin', 'diplome', e.target.value)} className={inputCls} />
                </Field>
                <Field label="N° agrément">
                  <input value={form.profil_laborantin.numero_agrement} onChange={(e) => setNested('profil_laborantin', 'numero_agrement', e.target.value)} className={inputCls} />
                </Field>
              </div>
            </section>
          )}

          {form.role === 'pharmacien' && (
            <section className={sectionCls}>
              <h4 className="mb-3 text-sm font-bold text-slate-800">4. Profil pharmacie</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="N° ordre">
                  <input value={form.profil_pharmacien.numero_ordre} onChange={(e) => setNested('profil_pharmacien', 'numero_ordre', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Diplôme">
                  <input value={form.profil_pharmacien.diplome} onChange={(e) => setNested('profil_pharmacien', 'diplome', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Spécialisation">
                  <input value={form.profil_pharmacien.specialisation} onChange={(e) => setNested('profil_pharmacien', 'specialisation', e.target.value)} className={inputCls} />
                </Field>
              </div>
            </section>
          )}

          {form.role === 'caissier' && (
            <section className={sectionCls}>
              <h4 className="mb-3 text-sm font-bold text-slate-800">4. Profil caisse</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Guichet">
                  <input value={form.profil_caissier.guichet} onChange={(e) => setNested('profil_caissier', 'guichet', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Diplôme">
                  <input value={form.profil_caissier.diplome} onChange={(e) => setNested('profil_caissier', 'diplome', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Plafond transaction (FC)">
                  <input type="number" min="0" value={form.profil_caissier.plafond_transaction} onChange={(e) => setNested('profil_caissier', 'plafond_transaction', e.target.value)} className={inputCls} />
                </Field>
              </div>
            </section>
          )}

          {isRadioRole(form.role) && (
            <section className={sectionCls}>
              <h4 className="mb-3 text-sm font-bold text-slate-800">4. Profil imagerie</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Types d'imagerie">
                  <input value={form.profil_radiologue.types_imagerie} onChange={(e) => setNested('profil_radiologue', 'types_imagerie', e.target.value)} className={inputCls} placeholder="Radio, Écho, Scanner…" />
                </Field>
                <Field label="Diplôme">
                  <input value={form.profil_radiologue.diplome} onChange={(e) => setNested('profil_radiologue', 'diplome', e.target.value)} className={inputCls} />
                </Field>
                <Field label="N° agrément">
                  <input value={form.profil_radiologue.numero_agrement} onChange={(e) => setNested('profil_radiologue', 'numero_agrement', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Habilitation">
                  <select value={form.profil_radiologue.habilitation} onChange={(e) => setNested('profil_radiologue', 'habilitation', e.target.value)} className={inputCls}>
                    <option value="technicien">Technicien</option>
                    <option value="medecin">Médecin</option>
                    <option value="chef">Chef de service</option>
                  </select>
                </Field>
              </div>
            </section>
          )}

          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
            <button type="submit" className="rounded-xl bg-medical-primary px-6 py-2 text-sm font-bold text-white">
              {editing ? 'Enregistrer la fiche' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      )}

      {loading ? <p>Chargement...</p> : items.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucun utilisateur.</p>
      ) : (
        <div className="space-y-2">
          {items.map((u) => (
            <article key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
              <div>
                <p className="font-semibold text-slate-900">{u.name}</p>
                <p className="text-sm text-slate-500">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {getRoleLabel(u.role)}
                  </span>
                  {u.departement?.nom && (
                    <span className="inline-block rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">{u.departement.nom}</span>
                  )}
                  {u.sexe && (
                    <span className="inline-block rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                      {u.sexe === 'F' ? 'Féminin' : 'Masculin'}
                    </span>
                  )}
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {u.statut || (u.is_active ? 'actif' : 'inactif')}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button onClick={() => openEdit(u)} className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-slate-50">Modifier</button>
                <button
                  onClick={() => toggle(u.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${u.is_active ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}
                >
                  {u.is_active ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => remove(u)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}

