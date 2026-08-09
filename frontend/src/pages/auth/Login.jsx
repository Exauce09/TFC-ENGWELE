import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isDemoMode } from '../../demo/demoConfig';
import { HOSPITAL } from '../../constants/hospital';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
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
        setError(isDemoMode() ? 'Identifiants invalides.' : 'Serveur inaccessible.');
      } else {
        setError(err.response?.data?.message || 'Identifiant ou mot de passe incorrect.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page flex min-h-screen bg-[#F7FAF9]">
      {/* Visuel hôpital */}
      <aside className="relative hidden w-[52%] overflow-hidden lg:block">
        <img
          src="/images/login-hospital.jpg"
          alt="Centre hospitalier"
          className="login-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#062E2C]/90 via-[#0A4A45]/45 to-[#0A4A45]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(26,122,109,0.35),transparent_55%)]" />

        <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
          <p className="font-[Fraunces,Georgia,serif] text-4xl leading-tight text-white xl:text-5xl">
            {HOSPITAL.name}
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
            {HOSPITAL.tagline}
          </p>
          <p className="mt-6 text-xs tracking-wide text-white/55">
            {HOSPITAL.commune} · {HOSPITAL.city}
          </p>
        </div>
      </aside>

      {/* Formulaire */}
      <section className="relative flex w-full flex-1 items-center justify-center px-6 py-12 sm:px-10">
        <div className="login-form w-full max-w-[400px]">
          <div className="mb-10 lg:mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0D6E6E] font-[Outfit,sans-serif] text-lg font-bold text-white shadow-lg shadow-[#0D6E6E]/25">
              A
            </div>
            <h1 className="mt-6 font-[Fraunces,Georgia,serif] text-3xl text-[#0D3B3A]">
              Connexion
            </h1>
            <p className="mt-2 text-sm text-[#5A7A74] lg:hidden">{HOSPITAL.name}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login-id" className="mb-1.5 block text-sm font-medium text-[#2A4A45]">
                Identifiant
              </label>
              <input
                id="login-id"
                type="text"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#C5D9D0] bg-white px-4 py-3 text-sm text-[#0D3B3A] outline-none transition placeholder:text-[#9AB5AE] focus:border-[#0D6E6E] focus:ring-4 focus:ring-[#0D6E6E]/12"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-pwd" className="text-sm font-medium text-[#2A4A45]">
                  Mot de passe
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-[#0D6E6E] hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-pwd"
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#C5D9D0] bg-white px-4 py-3 pr-20 text-sm text-[#0D3B3A] outline-none transition focus:border-[#0D6E6E] focus:ring-4 focus:ring-[#0D6E6E]/12"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#5A7A74] hover:text-[#0D6E6E]"
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                >
                  {showPwd ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#0D6E6E] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0D6E6E]/25 transition hover:-translate-y-0.5 hover:bg-[#0a5c5c] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
      </section>

      <style>{`
        .login-image {
          animation: loginZoom 18s ease-in-out infinite alternate;
        }
        .login-form {
          animation: loginFade 0.55s ease-out both;
        }
        @keyframes loginZoom {
          from { transform: scale(1); }
          to { transform: scale(1.06); }
        }
        @keyframes loginFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-image, .login-form { animation: none; }
        }
      `}</style>
    </main>
  );
}
