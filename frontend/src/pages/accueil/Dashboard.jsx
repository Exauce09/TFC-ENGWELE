import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Icon from '../../components/Icon';
import api from '../../services/api';
import { ROLE_THEMES } from '../../constants/roleThemes';

const T = ROLE_THEMES.receptionniste;

export default function AccueilDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/accueil/dashboard').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  return (
    <Layout title="Accueil">
      <h2 className="font-accueil-display text-3xl" style={{ color: T.titleColor }}>Réception</h2>
      <p className="mt-1 text-sm text-slate-500">Enregistrement des arrivées, demandes et rendez-vous confirmés du jour.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { key: 'en_attente_triage', label: 'En attente de triage', icon: 'siren' },
          { key: 'episodes_actifs', label: 'Épisodes actifs', icon: 'route' },
          { key: 'demandes_nouvelles', label: 'Demandes nouvelles', icon: 'inbox' },
          { key: 'rdv_du_jour', label: 'RDV du jour', icon: 'calendar' },
          { key: 'rdv_en_attente', label: 'RDV en attente', icon: 'clock' },
          { key: 'patients_total', label: 'Patients', icon: 'users' },
        ].map((s) => (
          <div
            key={s.key}
            className="rounded-2xl border bg-white p-5 shadow-sm"
            style={{ borderColor: T.cardBorder, borderLeftWidth: 4, borderLeftColor: T.accent }}
          >
            <Icon name={s.icon} className="h-6 w-6 text-slate-600" />
            <p className="mt-2 text-3xl font-bold" style={{ color: T.titleColor }}>{stats?.[s.key] ?? '—'}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/accueil/reception"
          className="rounded-2xl border p-6 shadow-sm transition hover:shadow-md"
          style={{ borderColor: `${T.accent}55`, background: T.accentSoft }}
        >
          <Icon name="door" className="h-7 w-7" style={{ color: T.accent }} />
          <p className="mt-2 font-bold" style={{ color: T.accent }}>Réception</p>
          <p className="text-xs text-slate-500">Enregistrer une personne qui se présente</p>
        </Link>
        <Link to="/accueil/demandes" className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
          <Icon name="inbox" className="h-7 w-7 text-slate-700" />
          <p className="mt-2 font-bold">Demandes RDV</p>
        </Link>
        <Link to="/accueil/rendez-vous" className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
          <Icon name="calendar" className="h-7 w-7 text-slate-700" />
          <p className="mt-2 font-bold">RDV du jour</p>
        </Link>
        <Link to="/accueil/patients" className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
          <Icon name="users" className="h-7 w-7 text-slate-700" />
          <p className="mt-2 font-bold">Vérifier un patient</p>
        </Link>
      </div>
    </Layout>
  );
}
