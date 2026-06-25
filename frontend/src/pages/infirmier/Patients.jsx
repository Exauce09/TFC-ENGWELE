import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function InfirmierPatients() {
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const search = async (term = '') => {
    setQ(term);
    setLoading(true);
    try {
      const res = await api.get('/infirmier/patients', { params: term ? { q: term } : {} });
      setPatients(res.data.data || []);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void search(); }, []);

  return (
    <Layout title="Patients">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Patients</h2>
        <p className="text-sm text-slate-500">Liste des patients pour la saisie des constantes.</p>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => void search(e.target.value)}
        placeholder="Rechercher par nom..."
        className="mb-6 w-full max-w-md rounded-xl border px-4 py-2.5 text-sm"
      />

      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : patients.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Aucun patient.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">N° patient</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Commune</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{p.user?.name}</td>
                  <td className="px-4 py-3">{p.numero_patient}</td>
                  <td className="px-4 py-3">{p.user?.phone || '—'}</td>
                  <td className="px-4 py-3">{p.commune || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
