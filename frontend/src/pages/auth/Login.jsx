import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
        setError('Serveur inaccessible. Vérifiez votre connexion ou que le backend est démarré.');
      } else {
        setError(err.response?.data?.message || 'Email ou mot de passe incorrect.');
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
                Plateforme sécurisée de gestion médicale pour patients, médecins et personnel soignant du Centre Médical AMEN à Kinshasa.
              </p>

              {/* Features */}
              <ul className="mt-6 space-y-2">
                {[
                  '📅 Prise de rendez-vous en ligne',
                  '📋 Dossier médical numérique',
                  '💊 Prescriptions électroniques',
                  '💵 Paiement Mobile Money',
                  '📹 Téléconsultation vidéo',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-base">{f}</span>
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
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Bon retour 👋</h1>
            <p className="mt-1 text-sm text-slate-500">Connectez-vous à votre espace personnel.</p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Adresse email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="exemple@amen.cd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-medical-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Mot de passe */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Mot de passe</label>
                  <button type="button" className="text-xs text-medical-primary hover:underline">
                    Mot de passe oublié ?
                  </button>
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
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="mt-0.5 flex-shrink-0">⚠️</span>
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
                  '🔐 Se connecter'
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400">ou</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Bouton S'INSCRIRE */}
            <Link
              to="/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-medical-primary px-4 py-3.5 text-base font-bold text-medical-primary transition hover:bg-blue-50"
            >
              ✍️ Créer un compte patient
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
