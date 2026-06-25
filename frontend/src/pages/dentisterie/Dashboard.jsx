import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function DentisterieDashboard() {
  return (
    <SpecialiteDashboard
      title="Dentisterie"
      subtitle="Soins dentaires et suivi bucco-dentaire."
      apiPath="/dentisterie/dashboard"
      stats={[
        { key: 'total', label: 'Total soins', icon: '🦷' },
        { key: 'ce_mois', label: 'Ce mois', icon: '📅', color: 'bg-cyan-50' },
      ]}
      links={[{ to: '/dentisterie/soins', icon: '📋', label: 'Soins dentaires', desc: 'Enregistrer les actes' }]}
    />
  );
}
