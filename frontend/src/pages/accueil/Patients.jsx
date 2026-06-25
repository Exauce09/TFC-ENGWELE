import { useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function AccueilPatients() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);

  const search = async (term) => {
    setQ(term);
    if (term.length < 2) { setItems([]); return; }
    const res = await api.get('/accueil/patients', { params: { q: term } });
    setItems(res.data.data || []);
  };

  return (
    <Layout title="Patients">
      <h2 className="mb-4 text-2xl font-bold">Recherche patients</h2>
      <input value={q} onChange={(e) => search(e.target.value)} placeholder="Nom ou n° patient..."
        className="mb-4 w-full max-w-md rounded-xl border px-4 py-2 text-sm" />
      <div className="space-y-2">
        {items.map((p) => (
          <article key={p.id} className="rounded-xl border bg-white p-4">
            <p className="font-semibold">{p.user?.name}</p>
            <p className="text-sm text-slate-500">{p.numero_patient} · {p.user?.phone}</p>
          </article>
        ))}
      </div>
    </Layout>
  );
}
