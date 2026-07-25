import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isDemoMode } from '../../demo/demoConfig';
import { HOSPITAL, HOSPITAL_STATS } from '../../constants/hospital';

const FEATURES = [
  { icon: 'calendar', label: 'Prise de rendez-vous en ligne' },
  { icon: 'folder', label: 'Dossier médical numérique' },
  { icon: 'pill', label: 'Prescriptions électroniques' },
  { icon: 'wallet', label: 'Paiement Mobile Money' },
  { icon: 'video', label: 'Téléconsultation vidéo' },
];

function FeatureIcon({ type }) {
  const cls = 'h-4 w-4 text-cyan-300';
  if (type === 'calendar') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === 'folder') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    );
  }
  if (type === 'pill') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12.572l-7.5 7.5a4.5 4.5 0 11-6.364-6.364l7.5-7.5a3 3 0 114.243 4.243l-7.5 7.5" />
      </svg>
    );
  }
  if (type === 'wallet') {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const redirect = await login(email, password);
      navigate(redirect, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError(
          isDemoMode()
            ? 'Utilisez un compte démo (ex. patient@amen.cd) avec le mot de passe Password@123.'
            : 'Serveur inaccessible. Vérifiez votre connexion ou que le backend est démarré.'
        );
      } else {
        setError(err.response?.data?.message || 'Identifiant ou mot de passe incorrect.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Orbes animées */}
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute -left-20 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="animate-float-slow absolute -right-20 top-32 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl [animation-delay:2s]" />
        <div className="animate-float-slow absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl [animation-delay:3.5s]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid lg:grid-cols-2">

          {/* ── PANNEAU GAUCHE — image + infos ── */}
          <div className="relative flex flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-900 p-8 text-white">
            <img
              src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80"
              alt="Equipe médicale"
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
            <div className="relative">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-medical-primary text-xl font-extrabold shadow-lg">A</div>
                <div>
                  <p className="text-base font-bold leading-tight">Centre Médical</p>
                  <p className="text-xs font-semibold text-emerald-400 tracking-wide">AMEN · FOSPHA ONGD/ASBL</p>
                </div>
              </div>

              <h2 className="mt-8 text-2xl font-bold leading-snug lg:text-3xl">
                Votre santé,{' '}
                <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  notre priorité absolue
                </span>
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {HOSPITAL.description}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {HOSPITAL.fullAddress} · {HOSPITAL_STATS.depuis}
              </p>

              {/* Features */}
              <ul className="mt-6 space-y-2">
                {FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm text-slate-300">
                    <FeatureIcon type={f.icon} />
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Comptes démo */}
            <div className="relative mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Comptes de démonstration</p>
              {[
                { role: 'Admin',    email: 'admin@amen.cd',   pwd: 'Password@123', color: 'text-violet-300' },
                { role: 'Médecin',  email: 'medecin@amen.cd', pwd: 'Password@123', color: 'text-cyan-300' },
                { role: 'Patient',  email: 'patient@amen.cd',   pwd: 'Password@123', color: 'text-emerald-300' },
                { role: 'Infirmier', email: 'infirmier@amen.cd', pwd: 'Password@123', color: 'text-orange-300' },
                { role: 'Laborantin', email: 'laborantin@amen.cd', pwd: 'Password@123', color: 'text-violet-300' },
                { role: 'Pharmacien', email: 'pharmacien@amen.cd', pwd: 'Password@123', color: 'text-pink-300' },
                { role: 'Accueil', email: 'receptionniste@amen.cd', pwd: 'Password@123', color: 'text-sky-300' },
                { role: 'Maternité', email: 'sage-femme@amen.cd', pwd: 'Password@123', color: 'text-pink-300' },
                { role: 'Chirurgie', email: 'chirurgien@amen.cd', pwd: 'Password@123', color: 'text-red-300' },
                { role: 'Écho', email: 'echographiste@amen.cd', pwd: 'Password@123', color: 'text-indigo-300' },
                { role: 'Kiné', email: 'kinesitherapeute@amen.cd', pwd: 'Password@123', color: 'text-teal-300' },
                { role: 'Dentiste', email: 'dentiste@amen.cd', pwd: 'Password@123', color: 'text-cyan-300' },
              ].map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword(d.pwd); }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-xs hover:bg-white/10 transition"
                >
                  <span className={`font-semibold ${d.color}`}>{d.role}</span>
                  <span className="text-slate-400">{d.email}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── PANNEAU DROIT — formulaire ── */}
          <div className="flex flex-col justify-center p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-medical-primary">Connexion sécurisée</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Bon retour</h1>
            <p className="mt-1 text-sm text-slate-500">Connectez-vous à votre espace personnel.</p>

            {isDemoMode() ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <strong>Mode démo en ligne</strong> — données simulées. Utilisez un compte ci-contre avec{' '}
                <code className="rounded bg-amber-100 px-1">Password@123</code>
              </div>
            ) : null}

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {/* Identifiant */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nom et prénom, login ou email
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="ex. Marie Kalala ou marie.kalala"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-medical-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  1re connexion patient : nom remis à l&apos;accueil + mot de passe <code className="rounded bg-slate-100 px-1">Amen2026</code>.
                </p>
              </div>

              {/* Mot de passe */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Mot de passe</label>
                  <Link to="/forgot-password" className="text-xs text-medical-primary hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition focus:border-medical-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg"
                    aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  >
                    {showPwd ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="mt-0.5 flex-shrink-0 text-red-500">!</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Bouton SE CONNECTER */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-medical-primary to-cyan-500 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Connexion en cours...
                  </span>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400">ou</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Accès patient via réception */}
            <Link
              to="/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-medical-primary px-4 py-3.5 text-base font-bold text-medical-primary transition hover:bg-blue-50"
            >
              Pas encore de compte ? Voir comment l&apos;obtenir
            </Link>

            <p className="mt-4 text-center text-xs text-slate-400">
              Vous êtes du personnel médical ?{' '}
              <span className="text-medical-primary">Vos accès sont fournis par l'administration.</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
