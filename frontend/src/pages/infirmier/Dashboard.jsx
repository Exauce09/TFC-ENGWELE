import Layout from '../../components/layout/Layout';
import { Link } from 'react-router-dom';

export default function InfirmierDashboard() {
  return (
    <Layout title="Infirmerie">
      <h2 className="text-2xl font-bold text-slate-900">Espace Infirmier(e)</h2>
      <p className="mt-1 text-sm text-slate-500">Gestion des soins et constantes vitales.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/infirmier/constantes"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <p className="text-3xl">📈</p>
          <p className="mt-2 font-bold text-slate-900">Constantes vitales</p>
          <p className="text-sm text-slate-500">Saisir température, tension, pouls...</p>
        </Link>
        <Link to="/infirmier/patients"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <p className="text-3xl">👥</p>
          <p className="mt-2 font-bold text-slate-900">Patients</p>
          <p className="text-sm text-slate-500">Liste et recherche des patients</p>
        </Link>
      </div>
    </Layout>
  );
}
