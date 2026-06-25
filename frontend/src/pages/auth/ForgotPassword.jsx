import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/forgot-password', { email });
      setSuccess(res.data?.message || 'Demande envoyee.');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de traiter la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-medical-primary">Recuperation</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Mot de passe oublie</h1>
        <p className="mt-2 text-sm text-slate-500">
          Entrez votre email. Si le compte existe, un message de reinitialisation sera envoye.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Adresse email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-medical-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="exemple@amen.cd"
            />
          </label>

          {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {success && <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-medical-primary py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <Link to="/login" className="mt-4 inline-block text-sm text-medical-primary hover:underline">
          Retour a la connexion
        </Link>
      </div>
    </main>
  );
}
