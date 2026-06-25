import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Départements</h2>
        <button onClick={openCreate} className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">
          + Nouveau département
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="mb-6 grid gap-3 rounded-2xl border bg-white p-6 sm:grid-cols-2">
          <input required placeholder="Nom *" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <input required placeholder="Code *" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="rounded-xl border px-3 py-2 text-sm" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm sm:col-span-2" rows={2} />
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
            <button type="submit" className="rounded-xl bg-medical-primary px-6 py-2 text-sm font-bold text-white">
              {editing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      {loading ? <p className="text-slate-500">Chargement...</p> : (
        <div className="space-y-3">
          {items.map((d) => (
            <article key={d.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
              <div>
                <p className="font-semibold">{d.nom}</p>
                <p className="text-xs text-slate-400">Code : {d.code}</p>
                {d.description && <p className="mt-1 text-sm text-slate-500">{d.description}</p>}
              </div>
              <div className="flex items-center gap-3 text-right text-sm text-slate-500">
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

const EMPTY_USER = { name: '', email: '', phone: '', password: 'Password@123', role: 'receptionniste' };

export function AdminUtilisateurs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_USER);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (q) params.q = q;
    if (roleFilter) params.role = roleFilter;
    api.get('/admin/utilisateurs', { params })
      .then((r) => setItems(r.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [q, roleFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_USER);
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, password: '' });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/admin/utilisateurs/${editing.id}`, {
        name: form.name,
        phone: form.phone,
        role: form.role,
      });
    } else {
      await api.post('/admin/utilisateurs', form);
    }
    setShowForm(false);
    load();
  };

  const toggle = async (id) => {
    await api.put(`/admin/utilisateurs/${id}/toggle`);
    load();
  };

  const ROLES = ['patient', 'medecin_generaliste', 'laborantin', 'pharmacien', 'infirmier', 'caissier', 'receptionniste', 'admin'];

  return (
    <Layout title="Utilisateurs">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
        <button onClick={openCreate} className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">+ Nouvel utilisateur</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBar value={q} onChange={setQ} placeholder="Rechercher par nom ou email..." />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">Tous les rôles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={save} className="mb-6 rounded-2xl border bg-white p-6 grid gap-3 sm:grid-cols-2">
          <input required placeholder="Nom *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <input required type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={!!editing} className="rounded-xl border px-3 py-2 text-sm disabled:bg-slate-100" />
          <input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {!editing && (
            <input required type="password" placeholder="Mot de passe *" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm sm:col-span-2" />
          )}
          <div className="sm:col-span-2 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
            <button type="submit" className="rounded-xl bg-medical-primary px-6 py-2 text-sm font-bold text-white">
              {editing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      {loading ? <p>Chargement...</p> : (
        <div className="space-y-2">
          {items.map((u) => (
            <article key={u.id} className="flex items-center justify-between rounded-xl border bg-white p-4">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-slate-500">{u.email}</p>
                <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{u.role}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(u)} className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-slate-50">Modifier</button>
                <button onClick={() => toggle(u.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${u.is_active ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {u.is_active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
