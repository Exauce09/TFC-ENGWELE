import SpecialiteDashboard from '../../components/specialite/SpecialiteDashboard';

export default function EchographieDashboard() {
  return (
    <SpecialiteDashboard
      title="Échographie"
      subtitle="Examens échographiques et comptes rendus."
      apiPath="/echographie/dashboard"
      stats={[
        { key: 'total', label: 'Total examens', icon: '📡' },
        { key: 'en_attente', label: 'En attente', icon: '⏳', color: 'bg-amber-50' },
        { key: 'termines', label: 'Terminés', icon: '✅', color: 'bg-emerald-50' },
      ]}
      links={[{ to: '/echographie/examens', icon: '📋', label: 'Examens', desc: 'Saisir les comptes rendus' }]}
    />
  );
}
