import { Link } from 'react-router-dom';

export default function PlaceholderDashboard({ title }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7FAF9] p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-[Fraunces,Georgia,serif] text-2xl text-[#0D3B3A]">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Page introuvable dans cet espace.</p>
        <Link to="/" className="mt-6 inline-block rounded-xl bg-[#0D6E6E] px-5 py-2.5 text-sm font-semibold text-white">
          Accueil
        </Link>
      </div>
    </main>
  );
}
