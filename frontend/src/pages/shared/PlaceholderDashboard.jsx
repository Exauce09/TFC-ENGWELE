export default function PlaceholderDashboard({ title }) {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-medical-primary">{title}</h1>
        <p className="mt-2 text-gray-600">
          Base web initiale prete. Les modules metiers de ce role seront ajoutes dans les prochains sprints.
        </p>
      </div>
    </main>
  );
}
