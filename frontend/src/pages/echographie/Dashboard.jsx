import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function EchographieDashboard() {
  return (
    <SpecialiteDashboard
      title="Échographie"
      apiPath="/echographie/dashboard"
      stats={[
        { key: 'total', label: 'Total examens', icon: 'radio' },
        { key: 'en_attente', label: 'En attente', icon: 'clock', color: 'bg-amber-50' },
        { key: 'termines', label: 'Terminés', icon: 'check-circle', color: 'bg-emerald-50' },
      ]}
      links={[
        { to: '/echographie/planning', icon: 'calendar', label: 'Planning RDV' },
        { to: '/echographie/examens', icon: 'clipboard', label: 'Examens' },
      ]}
    />
  );
}
