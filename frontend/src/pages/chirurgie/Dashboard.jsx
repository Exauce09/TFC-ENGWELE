import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function ChirurgieDashboard() {
  return (
    <SpecialiteDashboard
      title="Chirurgie"
      apiPath="/chirurgie/dashboard"
      stats={[
        { key: 'total', label: 'Total opérations', icon: 'hospital' },
        { key: 'planifiees', label: 'Planifiées', icon: 'calendar', color: 'bg-blue-50' },
        { key: 'en_cours', label: 'En cours', icon: 'stethoscope', color: 'bg-amber-50' },
        { key: 'realisees', label: 'Réalisées', icon: 'check-circle', color: 'bg-emerald-50' },
      ]}
      links={[{ to: '/chirurgie/operations', icon: 'scissors', label: 'Opérations' }]}
    />
  );
}
