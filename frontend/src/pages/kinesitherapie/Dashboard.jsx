import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function KinesitherapieDashboard() {
  return (
    <SpecialiteDashboard
      title="Kinésithérapie"
      apiPath="/kinesitherapie/dashboard"
      stats={[
        { key: 'total', label: 'Total séances', icon: 'bone' },
        { key: 'planifiees', label: 'Planifiées', icon: 'calendar', color: 'bg-blue-50' },
        { key: 'realisees', label: 'Réalisées', icon: 'check-circle', color: 'bg-emerald-50' },
      ]}
      links={[
        { to: '/kinesitherapie/planning', icon: 'calendar', label: 'Planning RDV' },
        { to: '/kinesitherapie/seances', icon: 'dumbbell', label: 'Séances' },
      ]}
    />
  );
}
