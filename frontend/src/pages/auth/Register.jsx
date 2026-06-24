import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1); // 2 étapes
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const [form, setForm] = useState({
    name:              '',
    email:             '',
    password:          '',
    password_confirmation: '',
    phone:             '',
    date_naissance:    '',
    sexe:              'M',
    adresse:           '',
    groupe_sanguin:    '',
    allergie:          '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const nextStep = (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/register', { ...form, role: 'patient' });
      setSuccess(true);
    } catch (err) {
      if (!err.response) {
        setError('Serveur inaccessible. Vérifiez que le backend est démarré.');
      } else {
        const msg = err.response?.data?.message || '';
        const errs = err.response?.data?.errors || {};
        const detail = Object.values(errs).flat().join(' ');
        setError(detail || msg || 'Inscription impossible. Vérifiez vos informations.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center p-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-float-slow absolute top-10 left-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        </div>
        <div className="relative w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">✅</div>
          <h2 className="text-2xl font-extrabold text-slate-900">Compte créé avec succès !</h2>
          <p className="mt-3 text-sm text-slate-500">
            Bienvenue, <strong>{form.name}</strong>. Votre compte patient au Centre Médical AMEN est prêt.
            Vous pouvez maintenant vous connecter.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-medical-primary to-cyan-500 py-3 font-bold text-white shadow-lg hover:-translate-y-0.5 transition"
          >
            🔐 Se connecter maintenant
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute -left-20 top-10  h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="animate-float-slow absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl [animation-delay:2s]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-4 py-10">
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">

          {/* En-tête */}
          <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-900 px-8 py-7 text-white">
            <img
              src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=40"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-primary text-lg font-extrabold shadow-lg">A</div>
                <div>
                  <p className="text-sm font-bold leading-tight">Centre Médical AMEN</p>
                  <p className="text-xs text-emerald-400">Inscription patient</p>
                </div>
              </div>
              <Link to="/login" className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 transition">
                ← Connexion
              </Link>
            </div>

            <h1 className="relative mt-4 text-2xl font-extrabold">Créer votre compte patient</h1>
            <p className="relative mt-1 text-sm text-slate-300">Accédez à vos rendez-vous, dossier médical et résultats d'analyses.</p>

            {/* Indicateur d'étape */}
            <div className="relative mt-5 flex items-center gap-2">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${step >= s ? 'bg-medical-primary text-white' : 'bg-white/10 text-slate-400'}`}>
                    {step > s ? '✓' : s}
                  </div>
                  <span className={`text-xs ${step >= s ? 'text-white' : 'text-slate-500'}`}>
                    {s === 1 ? 'Identifiants' : 'Informations médicales'}
                  </span>
                  {s < 2 && <div className={`h-px w-8 ${step > s ? 'bg-medical-primary' : 'bg-white/10'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Corps */}
          <div className="p-8">
            {error && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="mt-0.5">⚠️</span><span>{error}</span>
              </div>
            )}

            {/* ── ÉTAPE 1 — Identifiants ── */}
            {step === 1 && (
              <form onSubmit={nextStep} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nom complet *" placeholder="Jean Kamulete Mbeki">
                    <input type="text" required value={form.name} onChange={set('name')} placeholder="Jean Kamulete Mbeki" className={inputCls} />
                  </Field>
                  <Field label="Téléphone *" placeholder="+243 81X XXX XXXX">
                    <input type="tel" required value={form.phone} onChange={set('phone')} placeholder="+243 81X XXX XXXX" className={inputCls} />
                  </Field>
                </div>
                <Field label="Adresse email *">
                  <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="votre@email.cd" className={inputCls} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mot de passe *">
                    <div className="relative">
                      <input type={showPwd ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="Min. 8 caractères" className={`${inputCls} pr-10`} />
                      <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                        {showPwd ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirmer le mot de passe *">
                    <input type="password" required autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} placeholder="Répéter le mot de passe" className={inputCls} />
                  </Field>
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-medical-primary to-cyan-500 py-3.5 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5">
                    Suivant → Informations médicales
                  </button>
                </div>
              </form>
            )}

            {/* ── ÉTAPE 2 — Informations médicales ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date de naissance *">
                    <input type="date" required value={form.date_naissance} onChange={set('date_naissance')} className={inputCls} />
                  </Field>
                  <Field label="Sexe *">
                    <select value={form.sexe} onChange={set('sexe')} className={inputCls}>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </Field>
                </div>
                <Field label="Adresse de résidence">
                  <input type="text" value={form.adresse} onChange={set('adresse')} placeholder="Commune, Avenue, numéro" className={inputCls} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Groupe sanguin">
                    <select value={form.groupe_sanguin} onChange={set('groupe_sanguin')} className={inputCls}>
                      <option value="">— Sélectionner —</option>
                      {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </Field>
                  <Field label="Allergie connue">
                    <input type="text" value={form.allergie} onChange={set('allergie')} placeholder="Pénicilline, arachide..." className={inputCls} />
                  </Field>
                </div>

                <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-slate-600">
                  🔒 <strong>Confidentialité :</strong> vos informations médicales sont protégées et accessibles uniquement à votre médecin traitant.
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    ← Retour
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-medical-primary to-cyan-500 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Création…
                      </span>
                    ) : '✅ Créer mon compte'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-medical-primary focus:bg-white focus:ring-4 focus:ring-blue-100';
