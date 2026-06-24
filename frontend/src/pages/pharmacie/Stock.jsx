import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function PharmacieStock() {
  const [stock, setStock] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', dci: '', forme: 'Comprimé', dosage: '', quantite_stock: 0, seuil_alerte: 10, prix_unitaire: '', categorie: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pharmacie/stock');
      setStock(res.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/pharmacie/stock', form);
    setShowForm(false);
    void load();
  };

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  return (
    <Layout title="Stock Médicaments">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Stock médicaments</h2>
        <button onClick={() => setShowForm(true)} className="rounded-xl bg-medical-primary px-5 py-2.5 text-sm font-bold text-white">+ Ajouter</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-6 rounded-2xl border bg-white p-6 grid gap-3 sm:grid-cols-2">
          <input required placeholder="Nom *" value={form.nom} onChange={set('nom')} className="rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="DCI" value={form.dci} onChange={set('dci')} className="rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="Dosage" value={form.dosage} onChange={set('dosage')} className="rounded-xl border px-3 py-2 text-sm" />
          <input type="number" placeholder="Quantité" value={form.quantite_stock} onChange={set('quantite_stock')} className="rounded-xl border px-3 py-2 text-sm" />
          <input type="number" placeholder="Prix unitaire (FC)" value={form.prix_unitaire} onChange={set('prix_unitaire')} className="rounded-xl border px-3 py-2 text-sm" />
          <input placeholder="Catégorie" value={form.categorie} onChange={set('categorie')} className="rounded-xl border px-3 py-2 text-sm" />
          <div className="sm:col-span-2 flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">Annuler</button>
            <button type="submit" className="rounded-xl bg-medical-primary px-6 py-2 text-sm font-bold text-white">Enregistrer</button>
          </div>
        </form>
      )}

      {loading ? <p>Chargement...</p> : (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
              <tr><th className="px-4 py-3">Médicament</th><th className="px-4 py-3">Dosage</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Prix</th><th className="px-4 py-3">Statut</th></tr>
            </thead>
            <tbody>
              {stock.map((m) => {
                const bas = m.quantite_stock <= m.seuil_alerte;
                return (
                  <tr key={m.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{m.nom}<br /><span className="text-xs text-slate-400">{m.categorie}</span></td>
                    <td className="px-4 py-3">{m.dosage}</td>
                    <td className="px-4 py-3 font-bold">{m.quantite_stock}</td>
                    <td className="px-4 py-3">{Number(m.prix_unitaire).toLocaleString()} FC</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${bas ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {bas ? '⚠️ Stock bas' : 'OK'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
