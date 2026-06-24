import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

function AdminListPage({ title, endpoint, renderItem }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(endpoint).then((r) => setItems(r.data.data || [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, [endpoint]);

  return (
    <Layout title={title}>
      <h2 className="mb-6 text-2xl font-bold text-slate-900">{title}</h2>
      {loading ? <p className="text-slate-500">Chargement...</p> : items.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucun élément.</p>
      ) : (
        <div className="space-y-3">{items.map(renderItem)}</div>
      )}
    </Layout>
  );
}

export function AdminPatients() {
  return (
    <AdminListPage title="Gestion des Patients" endpoint="/admin/patients"
      renderItem={(p) => (
        <article key={p.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
          <div>
            <p className="font-semibold">{p.user?.name}</p>
            <p className="text-sm text-slate-500">{p.numero_patient} · {p.user?.email}</p>
            <p className="text-xs text-slate-400">{p.commune || '—'} · {p.sexe === 'F' ? 'Féminin' : 'Masculin'}</p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.user?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {p.user?.is_active ? 'Actif' : 'Inactif'}
          </span>
        </article>
      )}
    />
  );
}

export function AdminMedecins() {
  return (
    <AdminListPage title="Gestion des Médecins" endpoint="/admin/medecins"
      renderItem={(m) => (
        <article key={m.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
          <div>
            <p className="font-semibold">{m.user?.name}</p>
            <p className="text-sm text-medical-primary">{m.specialite}</p>
            <p className="text-xs text-slate-400">{m.departement?.nom} · {m.numero_ordre}</p>
          </div>
          <p className="text-sm font-medium text-slate-600">{Number(m.tarif_consultation).toLocaleString()} FC</p>
        </article>
      )}
    />
  );
}

export function AdminDepartements() {
  return (
    <AdminListPage title="Départements" endpoint="/admin/departements"
      renderItem={(d) => (
        <article key={d.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
          <div>
            <p className="font-semibold">{d.nom}</p>
            <p className="text-xs text-slate-400">Code : {d.code}</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>{d.medecins_count ?? 0} médecin(s)</p>
            <p>{d.users_count ?? 0} personnel</p>
          </div>
        </article>
      )}
    />
  );
}

export function AdminUtilisateurs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: 'Password@123', role: 'receptionniste' });

  const load = () => {
    setLoading(true);
    api.get('/admin/utilisateurs').then((r) => setItems(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const creer = async (e) => {
    e.preventDefault();
    await api.post('/admin/utilisateurs', form);
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
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
        <button onClick={() => setShowForm(true)} className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">+ Nouvel utilisateur</button>
      </div>

      {showForm && (
        <form onSubmit={creer} className="mb-6 rounded-2xl border bg-white p-6 grid gap-3 sm:grid-cols-2">
          <input required placeholder="Nom *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <input required type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm" />
          <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <input required type="password" placeholder="Mot de passe *" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="rounded-xl border px-3 py-2 text-sm sm:col-span-2" />
          <div className="sm:col-span-2 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
            <button type="submit" className="rounded-xl bg-medical-primary px-6 py-2 text-sm font-bold text-white">Créer</button>
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
              <button onClick={() => toggle(u.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600'}`}>
                {u.is_active ? 'Désactiver' : 'Activer'}
              </button>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
