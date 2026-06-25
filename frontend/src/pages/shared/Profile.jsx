import { useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ProfilePage() {
  const { user, setCurrentUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put('/profile', form);
      const nextUser = res.data?.data || user;
      setCurrentUser(nextUser);
      setMessage('Profil mis a jour avec succes.');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de mettre a jour le profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Mon Profil">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Informations personnelles</h2>
          <p className="mt-1 text-sm text-slate-500">Mettez a jour vos informations de compte.</p>
        </div>

        <form onSubmit={save} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Nom complet</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border px-4 py-2.5 text-sm"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Telephone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-xl border px-4 py-2.5 text-sm"
                placeholder="+243..."
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">URL avatar (optionnel)</span>
            <input
              value={form.avatar}
              onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
              className="w-full rounded-xl border px-4 py-2.5 text-sm"
              placeholder="https://..."
            />
          </label>

          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p><span className="font-semibold">Email:</span> {user?.email}</p>
            <p><span className="font-semibold">Role:</span> {user?.role}</p>
          </div>

          {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
