import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function MaterniteDashboard() {
  return (
    <SpecialiteDashboard
      title="Maternité"
      apiPath="/maternite/dashboard"
      stats={[
        { key: 'total_suivis', label: 'Total suivis', icon: 'baby', to: '/maternite/suivis' },
        { key: 'prenatales', label: 'Prénatales', icon: 'baby', color: 'bg-pink-50', to: '/maternite/suivis' },
        { key: 'accouchements', label: 'Accouchements', icon: 'hospital', color: 'bg-rose-50', to: '/maternite/suivis' },
        { key: 'postnatales', label: 'Postnatales', icon: 'heart', color: 'bg-violet-50', to: '/maternite/suivis' },
      ]}
      links={[
        { to: '/maternite/planning', icon: 'calendar', label: 'Planning RDV' },
        { to: '/maternite/suivis', icon: 'clipboard', label: 'Suivis maternité' },
      ]}
    />
  );
}
