import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function ChirurgieDashboard() {
  return (
    <SpecialiteDashboard
      title="Chirurgie"
      apiPath="/chirurgie/dashboard"
      stats={[
        { key: 'total', label: 'Total opérations', icon: 'hospital', to: '/chirurgie/operations' },
        { key: 'planifiees', label: 'Planifiées', icon: 'calendar', color: 'bg-blue-50', to: '/chirurgie/operations' },
        { key: 'en_cours', label: 'En cours', icon: 'stethoscope', color: 'bg-amber-50', to: '/chirurgie/operations' },
        { key: 'realisees', label: 'Réalisées', icon: 'check-circle', color: 'bg-emerald-50', to: '/chirurgie/operations' },
      ]}
      links={[
        { to: '/chirurgie/planning', icon: 'calendar', label: 'Planning RDV' },
        { to: '/chirurgie/operations', icon: 'scissors', label: 'Opérations' },
      ]}
    />
  );
}
