import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Icon from '../Icon';
import api from '../../services/api';

export default function SpecialiteDashboard({ title, apiPath, stats, links }) {
  const [data, setData] = useState(null);
  const primaryTo = links?.[0]?.to;

  useEffect(() => {
    api.get(apiPath).then((r) => setData(r.data.data)).catch(() => {});
  }, [apiPath]);

  return (
    <Layout title={title}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[Fraunces,Georgia,serif] text-3xl text-[#0D3B3A]">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">Indicateurs et accès rapides du service.</p>
        </div>
        {links?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                className={
                  i === 0
                    ? 'rounded-xl bg-[#0D6E6E] px-5 py-2.5 text-sm font-bold text-white'
                    : 'rounded-xl border-2 border-[#0D6E6E] bg-white px-5 py-2.5 text-sm font-bold text-[#0D6E6E]'
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const to = s.to || primaryTo;
          const inner = (
            <>
              <Icon name={s.icon} className="h-6 w-6 text-[#0D6E6E]" />
              <p className="mt-3 text-3xl font-bold text-slate-900">{data?.[s.key] ?? '—'}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
              {to && <p className="mt-2 text-xs font-semibold text-[#0D6E6E]">Voir →</p>}
            </>
          );
          const cls = `rounded-2xl border border-slate-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${s.color || 'bg-white'}`;
          return to ? (
            <Link key={s.key} to={to} className={cls}>{inner}</Link>
          ) : (
            <div key={s.key} className={cls}>{inner}</div>
          );
        })}
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
            <p className="mt-2 text-xs font-semibold text-[#0D6E6E]">Voir →</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
