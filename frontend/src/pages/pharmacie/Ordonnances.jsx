import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function PharmacieOrdonnances() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pharmacie/ordonnances');
      setItems(res.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const delivrer = async (id) => {
    if (!confirm('Confirmer la délivrance ?')) return;
    try {
      await api.put(`/pharmacie/ordonnances/${id}/delivrer`);
      setMsg('Ordonnance délivrée. Stock mis à jour.');
      void load();
    } catch { setMsg('Erreur.'); }
  };

  return (
    <Layout title="Ordonnances">
      <h2 className="mb-6 text-2xl font-bold">Délivrance des ordonnances</h2>
      {msg && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">{msg}</div>}

      {loading ? <p>Chargement...</p> : items.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucune ordonnance.</p>
      ) : (
        <div className="space-y-4">
          {items.map((p) => (
            <article key={p.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{p.patient?.user?.name}</p>
                  <p className="text-xs text-slate-500">Prescrit par {p.medecin?.user?.name} · {new Date(p.date_prescription).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.statut === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {p.statut}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(p.medicaments || []).map((m, i) => (
                  <div key={i} className="rounded-lg bg-blue-50 p-3 text-sm">
                    <p className="font-medium">{m.nom}</p>
                    <p className="text-xs text-slate-600">{m.dosage} · {m.frequence} · {m.duree}</p>
                  </div>
                ))}
              </div>
              {p.statut === 'active' && (
                <button onClick={() => delivrer(p.id)}
                  className="mt-4 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-600">
                  ✅ Délivrer l'ordonnance
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
