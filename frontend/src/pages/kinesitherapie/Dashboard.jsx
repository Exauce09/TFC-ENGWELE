import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function KinesitherapieDashboard() {
  return (
    <SpecialiteDashboard
      title="Kinésithérapie"
      subtitle="Séances de rééducation et suivi fonctionnel."
      apiPath="/kinesitherapie/dashboard"
      stats={[
        { key: 'total', label: 'Total séances', icon: '🦴' },
        { key: 'planifiees', label: 'Planifiées', icon: '📅', color: 'bg-blue-50' },
        { key: 'realisees', label: 'Réalisées', icon: '✅', color: 'bg-emerald-50' },
      ]}
      links={[{ to: '/kinesitherapie/seances', icon: '💪', label: 'Séances', desc: 'Planifier et enregistrer les séances' }]}
    />
  );
}
