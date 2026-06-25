import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function MedecinPatients() {
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void load('');
  }, []);

  const load = async (term) => {
    setQ(term);
    setLoading(true);
    try {
      const res = await api.get('/medecin/patients', { params: term ? { q: term } : {} });
      setPatients(res.data.data || []);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const search = (term) => void load(term);

  return (
    <Layout title="Mes Patients">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Mes patients</h2>
        <p className="text-sm text-slate-500">Recherchez un patient par nom ou numéro.</p>
      </div>

      <input
        type="search"
        value={q}
        onChange={(e) => void search(e.target.value)}
        placeholder="Rechercher par nom ou n° patient..."
        className="mb-6 w-full max-w-md rounded-xl border px-4 py-2.5 text-sm"
      />

      {loading ? (
        <p className="text-slate-500">Recherche...</p>
      ) : patients.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">
          {q.length < 2 && patients.length === 0 ? 'Aucun patient enregistré.' : 'Aucun patient trouvé.'}
        </p>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <article key={p.id} className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{p.user?.name}</p>
                <p className="text-sm text-slate-500">{p.numero_patient} · {p.user?.email}</p>
                <p className="text-xs text-slate-400">{p.commune || '—'} · {p.sexe === 'F' ? 'Féminin' : 'Masculin'}</p>
              </div>
              <Link
                to="/medecin/dossiers"
                className="rounded-lg bg-medical-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Voir dossiers →
              </Link>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
