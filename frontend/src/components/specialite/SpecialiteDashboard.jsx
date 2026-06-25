import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';

export default function SpecialiteDashboard({ title, subtitle, apiPath, stats, links }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(apiPath).then((r) => setData(r.data.data)).catch(() => {});
  }, [apiPath]);

  return (
    <Layout title={title}>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.key} className={`rounded-2xl border p-5 ${s.color || 'bg-white'}`}>
            <p className="text-2xl">{s.icon}</p>
            <p className="mt-2 text-3xl font-bold">{data?.[s.key] ?? '—'}</p>
            <p className="text-sm opacity-80">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <p className="text-3xl">{l.icon}</p>
            <p className="mt-2 font-bold text-slate-900">{l.label}</p>
            <p className="text-sm text-slate-500">{l.desc}</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
