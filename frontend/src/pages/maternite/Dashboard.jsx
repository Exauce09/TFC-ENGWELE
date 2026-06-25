import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function MaterniteDashboard() {
  return (
    <SpecialiteDashboard
      title="Maternité"
      subtitle="Suivi prénatal, accouchement et postnatal."
      apiPath="/maternite/dashboard"
      stats={[
        { key: 'total_suivis', label: 'Total suivis', icon: '🤰' },
        { key: 'prenatales', label: 'Prénatales', icon: '👶', color: 'bg-pink-50' },
        { key: 'accouchements', label: 'Accouchements', icon: '🏥', color: 'bg-rose-50' },
        { key: 'postnatales', label: 'Postnatales', icon: '💗', color: 'bg-violet-50' },
      ]}
      links={[{ to: '/maternite/suivis', icon: '📋', label: 'Suivis maternité', desc: 'Enregistrer et consulter les suivis' }]}
    />
  );
}
