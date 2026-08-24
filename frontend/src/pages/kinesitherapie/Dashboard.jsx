import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function KinesitherapieDashboard() {
  return (
    <SpecialiteDashboard
      title="Kinésithérapie"
      apiPath="/kinesitherapie/dashboard"
      stats={[
        { key: 'total', label: 'Total séances', icon: 'bone', to: '/kinesitherapie/seances' },
        { key: 'planifiees', label: 'Planifiées', icon: 'calendar', color: 'bg-blue-50', to: '/kinesitherapie/seances' },
        { key: 'realisees', label: 'Réalisées', icon: 'check-circle', color: 'bg-emerald-50', to: '/kinesitherapie/seances' },
      ]}
      links={[
        { to: '/kinesitherapie/planning', icon: 'calendar', label: 'Planning RDV' },
        { to: '/kinesitherapie/seances', icon: 'dumbbell', label: 'Séances' },
      ]}
    />
  );
}
