import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function AccueilRendezVous() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/accueil/rendez-vous').then((r) => setItems(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="RDV du jour">
      <h2 className="mb-6 text-2xl font-bold">Rendez-vous du jour</h2>
      {loading ? <p>Chargement...</p> : items.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucun RDV aujourd&apos;hui.</p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <article key={r.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="font-semibold">{String(r.heure_rdv).slice(0, 5)} — {r.patient?.user?.name}</p>
              <p className="text-sm text-slate-500">Dr {r.medecin?.user?.name} · {r.departement?.nom}</p>
              <p className="text-sm text-slate-600">{r.motif}</p>
              <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize">{r.statut?.replace(/_/g, ' ')}</span>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
