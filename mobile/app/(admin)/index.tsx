import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import StaffShell from '@/src/components/staff/StaffShell';
import StatGrid from '@/src/components/staff/StatGrid';
import { colors, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(admin)', active: true },
  { label: 'Stats', icon: 'stats-chart' as const, href: '/(admin)/stats' },
  { label: 'RDV', icon: 'calendar' as const, href: '/(admin)/rendez-vous' },
];

export default function AdminDashboardScreen() {
  const { user } = useAuth();
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

  const money = (n: number) => `${Number(n || 0).toLocaleString('fr-CD')} FC`;

  return (
    <StaffShell
      title={`Admin · ${user?.name?.split(' ')[0] ?? ''}`}
      subtitle="Vue d'ensemble"
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
            stats={[
              { label: 'Patients', value: stats?.patients ?? 0 },
              { label: 'Médecins', value: stats?.medecins ?? 0 },
              { label: 'RDV jour', value: stats?.rdv_aujourdhui ?? 0 },
              { label: 'Impayées', value: stats?.factures_impayees ?? 0 },
            ]}
          />
          <Text style={styles.ca}>CA mois : {money(stats?.chiffre_affaires_mois ?? 0)}</Text>
          <Pressable style={styles.cta} onPress={() => router.push('/(admin)/stats')}>
            <Text style={styles.ctaText}>Statistiques détaillées →</Text>
          </Pressable>
        </>
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  ca: { fontSize: 15, fontWeight: '700', color: colors.accentDark },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800' },
});
