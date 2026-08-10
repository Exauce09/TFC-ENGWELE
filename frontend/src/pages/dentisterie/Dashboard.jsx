import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function DentisterieDashboard() {
  return (
    <SpecialiteDashboard
      title="Dentisterie"
      apiPath="/dentisterie/dashboard"
      stats={[
        { key: 'total', label: 'Total soins', icon: 'tooth' },
        { key: 'ce_mois', label: 'Ce mois', icon: 'calendar', color: 'bg-cyan-50' },
      ]}
      links={[
        { to: '/dentisterie/planning', icon: 'calendar', label: 'Planning RDV' },
        { to: '/dentisterie/soins', icon: 'clipboard', label: 'Soins dentaires' },
      ]}
    />
  );
}
