import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/**
 * Première connexion patient : complète le profil + change le mot de passe par défaut.
 */
export default function PremiereConnexion() {
  const { user, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    phone: user?.phone || '',
    date_naissance: '',
    sexe: 'M',
    adresse: '',
    commune: 'Matete',
    contact_urgence_nom: '',
    contact_urgence_tel: '',
    allergies: '',
    antecedents_medicaux: '',
    password: '',
    password_confirmation: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/patient/premiere-connexion', form);
      const next = res.data.data;
      setCurrentUser(next);
      navigate(res.data.redirect || '/patient/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible d\'enregistrer.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-3xl border bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-medical-primary">Espace patient</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Première connexion</h1>
          <p className="mt-2 text-sm text-slate-600">
            Bonjour <strong>{user?.name}</strong>. Complétez vos informations personnelles et choisissez
            un nouveau mot de passe (le mot de passe par défaut <code className="rounded bg-slate-100 px-1">Amen2026</code> ne doit plus être utilisé).
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Identité</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Téléphone *</span>
                <input required value={form.phone} onChange={set('phone')} placeholder="+243 …" className="w-full rounded-xl border px-3 py-2.5" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Date de naissance *</span>
                <input required type="date" value={form.date_naissance} onChange={set('date_naissance')} className="w-full rounded-xl border px-3 py-2.5" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Sexe *</span>
                <select required value={form.sexe} onChange={set('sexe')} className="w-full rounded-xl border px-3 py-2.5">
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Adresse</span>
                <input value={form.adresse} onChange={set('adresse')} className="w-full rounded-xl border px-3 py-2.5" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Commune</span>
                <input value={form.commune} onChange={set('commune')} className="w-full rounded-xl border px-3 py-2.5" />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Urgence & santé</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Contact d&apos;urgence — nom</span>
                <input value={form.contact_urgence_nom} onChange={set('contact_urgence_nom')} className="w-full rounded-xl border px-3 py-2.5" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Contact d&apos;urgence — tél.</span>
                <input value={form.contact_urgence_tel} onChange={set('contact_urgence_tel')} className="w-full rounded-xl border px-3 py-2.5" />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Allergies</span>
                <input value={form.allergies} onChange={set('allergies')} className="w-full rounded-xl border px-3 py-2.5" placeholder="Aucune si vide" />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Antécédents médicaux</span>
                <textarea rows={2} value={form.antecedents_medicaux} onChange={set('antecedents_medicaux')} className="w-full rounded-xl border px-3 py-2.5" />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Nouveau mot de passe</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Mot de passe *</span>
                <input required type="password" minLength={8} value={form.password} onChange={set('password')} className="w-full rounded-xl border px-3 py-2.5" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Confirmer *</span>
                <input required type="password" minLength={8} value={form.password_confirmation} onChange={set('password_confirmation')} className="w-full rounded-xl border px-3 py-2.5" />
              </label>
            </div>
          </section>

          {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-medical-primary to-cyan-500 py-3.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? 'Enregistrement…' : 'Enregistrer et accéder à mon espace'}
          </button>
        </form>
      </div>
    </main>
  );
}
