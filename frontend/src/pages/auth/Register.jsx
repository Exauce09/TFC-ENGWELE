import { Link } from 'react-router-dom';
import { HOSPITAL } from '../../constants/hospital';

export default function Register() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white p-8 shadow-2xl sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-medical-primary text-2xl font-extrabold text-white">
          A
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Inscription patient</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          La <strong>création du patient</strong> et l&apos;<strong>ouverture du dossier médical</strong> se font
          uniquement à la <strong>réception</strong> du {HOSPITAL.name}, lors de votre arrivée.
        </p>
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-medical-primary">Présentez-vous à l&apos;accueil</p>
          <p className="mt-1">{HOSPITAL.fullAddress}</p>
          <p className="mt-2 text-xs text-slate-500">
            Le réceptionniste enregistre votre nom et prénom, ouvre le dossier et vous remet un mot de passe
            par défaut (<code className="rounded bg-white px-1">Amen2026</code>). À la 1re connexion, vous
            complétez vos informations personnelles et changez le mot de passe.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/login"
            className="rounded-xl bg-gradient-to-r from-medical-primary to-cyan-500 py-3 text-center text-sm font-bold text-white shadow-lg"
          >
            J&apos;ai déjà un compte — Se connecter
          </Link>
          <Link to="/" className="text-center text-sm text-slate-500 hover:text-medical-primary">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
