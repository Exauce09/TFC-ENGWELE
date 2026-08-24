import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import Icon from '../../components/Icon';
import api from '../../services/api';
import { ROLE_THEMES } from '../../constants/roleThemes';

const T = ROLE_THEMES.pharmacien;

export default function PharmacieDashboard() {
  const [stats, setStats] = useState(null);
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.allSettled([
      api.get('/pharmacie/dashboard'),
      api.get('/pharmacie/ordonnances'),
    ])
      .then(([dash, ord]) => {
        const msgs = [];
        if (dash.status === 'fulfilled') {
          setStats(dash.value.data.data || {});
          if (dash.value.data.success === false && dash.value.data.message) {
            msgs.push(dash.value.data.message);
          }
        } else {
          setStats({});
          msgs.push(dash.reason?.response?.data?.message || 'Stats pharmacie indisponibles.');
        }
        if (ord.status === 'fulfilled') {
          setOrdonnances(ord.value.data.data || []);
        } else {
          setOrdonnances([]);
          msgs.push(ord.reason?.response?.data?.message || 'Ordonnances indisponibles.');
        }
        setError(msgs.join(' '));
      })
      .finally(() => setLoading(false));
  }, []);

  const byDept = useMemo(() => {
    const map = {};
    (ordonnances || [])
      .filter((o) => o.statut === 'active')
      .forEach((o) => {
        const key = o.departement || 'Sans département';
        if (!map[key]) map[key] = [];
        map[key].push(o);
      });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], 'fr'));
  }, [ordonnances]);

  const cards = [
    { label: 'Médicaments', value: stats?.medicaments_total ?? '—', icon: 'pill', to: '/pharmacie/stock' },
    { label: 'Stock bas', value: stats?.stock_bas ?? '—', icon: 'alert', to: '/pharmacie/stock', alert: true },
    { label: 'Patients à servir', value: stats?.patients_en_attente ?? '—', icon: 'users', to: '/pharmacie/patients' },
    { label: 'Ordonnances actives', value: stats?.ordonnances_actives ?? '—', icon: 'clipboard', to: '/pharmacie/ordonnances' },
    { label: 'Délivrées (jour)', value: stats?.ordonnances_delivrees ?? '—', icon: 'check-circle', to: '/pharmacie/ordonnances' },
  ];

  return (
    <Layout title="Pharmacie">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-pharmacie-display text-3xl" style={{ color: T.titleColor }}>Pharmacie</h2>
          <p className="mt-1 text-sm text-slate-500">Stock, file d&apos;ordonnances et délivrance par service.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/pharmacie/stock" className="rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: T.accent }}>
            Gérer le stock
          </Link>
          <Link
            to="/pharmacie/ordonnances"
            className="rounded-xl border-2 bg-white px-5 py-2.5 text-sm font-bold"
            style={{ borderColor: T.accent, color: T.accent }}
          >
            Ordonnances
          </Link>
          <Link to="/pharmacie/patients" className="rounded-xl border bg-white px-5 py-2.5 text-sm font-bold text-slate-700">
            Patients
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((s) => (
              <Link
                key={s.label}
                to={s.to}
                className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                  s.alert && Number(stats?.stock_bas) > 0 ? 'border-red-200 bg-red-50' : 'bg-white'
                }`}
                style={
                  !s.alert || !(Number(stats?.stock_bas) > 0)
                    ? { borderLeftWidth: 4, borderLeftColor: T.accent, borderColor: T.cardBorder }
                    : undefined
                }
              >
                <Icon name={s.icon} className={`h-6 w-6 ${s.alert && Number(stats?.stock_bas) > 0 ? 'text-red-600' : 'text-slate-600'}`} />
                <p className="mt-2 text-3xl font-bold" style={{ color: T.titleColor }}>{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="mt-2 text-xs font-semibold" style={{ color: T.accent }}>Voir →</p>
              </Link>
            ))}
          </div>

          <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold" style={{ color: T.titleColor }}>Ordonnances en attente par département</h3>
              <Link to="/pharmacie/ordonnances" className="text-xs font-semibold hover:underline" style={{ color: T.accent }}>
                Tout voir →
              </Link>
            </div>
            {byDept.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Aucune ordonnance active pour le moment.</p>
            ) : (
              <div className="space-y-5">
                {byDept.map(([dept, list]) => (
                  <div key={dept}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {dept} · {list.length}
                    </p>
                    <div className="space-y-2">
                      {list.slice(0, 4).map((o) => (
                        <Link
                          key={`${o.source}-${o.id}`}
                          to="/pharmacie/ordonnances"
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{o.patient?.user?.name || 'Patient'}</p>
                            <p className="text-xs text-slate-500">{o.numero_ordonnance}</p>
                          </div>
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            {o.statut_label || 'À délivrer'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
