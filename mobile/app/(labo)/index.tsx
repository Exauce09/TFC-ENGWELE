import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import StaffShell from '@/src/components/staff/StaffShell';
import StatGrid from '@/src/components/staff/StatGrid';
import { colors, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(labo)', active: true },
  { label: 'Analyses', icon: 'flask' as const, href: '/(labo)/analyses' },
];

export default function LaboDashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/laboratoire/dashboard');
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
      title={`Labo · ${user?.name?.split(' ')[0] ?? ''}`}
      subtitle="Laboratoire"
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
              { label: 'Total', value: stats?.total ?? stats?.analyses ?? 0 },
              { label: 'En attente', value: stats?.en_attente ?? 0 },
              { label: 'Terminés', value: stats?.termines ?? stats?.resultats ?? 0 },
              { label: 'Patients jour', value: stats?.patients_jour ?? 0 },
            ]}
          />
          <Pressable style={styles.cta} onPress={() => router.push('/(labo)/analyses')}>
            <Text style={styles.ctaText}>Voir les analyses →</Text>
          </Pressable>
        </>
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800' },
});
