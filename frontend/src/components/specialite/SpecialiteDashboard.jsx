import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Icon from '../Icon';
import api from '../../services/api';

export default function SpecialiteDashboard({ title, apiPath, stats, links }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(apiPath).then((r) => setData(r.data.data)).catch(() => {});
  }, [apiPath]);

  return (
    <Layout title={title}>
      <div className="mb-6">
        <h2 className="font-[Fraunces,Georgia,serif] text-3xl text-[#0D3B3A]">{title}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.key}
            className={`rounded-2xl border border-slate-200 p-5 shadow-sm ${s.color || 'bg-white'}`}
          >
            <Icon name={s.icon} className="h-6 w-6 text-[#0D6E6E]" />
            <p className="mt-3 text-3xl font-bold text-slate-900">{data?.[s.key] ?? '—'}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0D6E6E]/40 hover:shadow-md"
          >
            <Icon name={l.icon} className="h-7 w-7 text-[#0D6E6E]" />
            <p className="mt-3 font-semibold text-slate-900 group-hover:text-[#0D6E6E]">{l.label}</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
