import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function NonAutorise() {
  const { user } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7FAF9] p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-bold text-red-600">
          403
        </div>
        <h1 className="mt-5 font-[Fraunces,Georgia,serif] text-2xl text-[#0D3B3A]">
          Accès non autorisé
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Votre compte{user?.role ? ` (${user.role.replace(/_/g, ' ')})` : ''} n&apos;a pas les droits pour cette page.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="rounded-xl bg-[#0D6E6E] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Accueil
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700"
          >
            Retour
          </button>
        </div>
      </div>
    </main>
  );
}
