import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import StaffShell from '@/src/components/staff/StaffShell';
import StatGrid from '@/src/components/staff/StatGrid';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(admin)' },
  { label: 'Stats', icon: 'stats-chart' as const, href: '/(admin)/stats', active: true },
  { label: 'RDV', icon: 'calendar' as const, href: '/(admin)/rendez-vous' },
];

export default function AdminStatsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/dashboard/stats');
      setStats(res.data.data || {});
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <StaffShell
      title="Statistiques"
      subtitle="Indicateurs (lecture)"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <StatGrid
            stats={Object.entries(stats || {})
              .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
              .slice(0, 8)
              .map(([k, v]) => ({
                label: k.replace(/_/g, ' '),
                value: typeof v === 'number' && v > 9999 ? v.toLocaleString('fr-CD') : String(v),
              }))}
          />
          <MedicalCard>
            <Text style={styles.note}>
              La gestion complète (utilisateurs, départements, facturation) reste disponible sur le
              web pour les opérations lourdes.
            </Text>
          </MedicalCard>
        </>
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
});
