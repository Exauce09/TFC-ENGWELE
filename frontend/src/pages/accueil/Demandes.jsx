import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function AccueilDemandes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/accueil/demandes').then((r) => setItems(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const traiter = async (id, statut) => {
    await api.put(`/accueil/demandes/${id}`, { statut });
    load();
  };

  return (
    <Layout title="Demandes RDV">
      <h2 className="mb-6 text-2xl font-bold">Demandes de rendez-vous</h2>
      {loading ? <p>Chargement...</p> : items.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucune demande.</p>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <article key={d.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="font-semibold">{d.nom}</p>
              <p className="text-sm text-slate-500">{d.telephone} · {d.departement?.nom}</p>
              <p className="text-sm text-slate-600">{d.message || '—'}</p>
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{d.statut}</span>
              {d.statut === 'nouvelle' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => traiter(d.id, 'traitee')} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">Traiter</button>
                  <button onClick={() => traiter(d.id, 'annulee')} className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-600">Annuler</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
