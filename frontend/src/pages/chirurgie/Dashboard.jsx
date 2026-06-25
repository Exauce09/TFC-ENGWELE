import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function ChirurgieDashboard() {
  return (
    <SpecialiteDashboard
      title="Chirurgie"
      subtitle="Planification et suivi des interventions chirurgicales."
      apiPath="/chirurgie/dashboard"
      stats={[
        { key: 'total', label: 'Total opérations', icon: '🏥' },
        { key: 'planifiees', label: 'Planifiées', icon: '📅', color: 'bg-blue-50' },
        { key: 'en_cours', label: 'En cours', icon: '⚕️', color: 'bg-amber-50' },
        { key: 'realisees', label: 'Réalisées', icon: '✅', color: 'bg-emerald-50' },
      ]}
      links={[{ to: '/chirurgie/operations', icon: '🔪', label: 'Opérations', desc: 'Gérer le bloc opératoire' }]}
    />
  );
}
