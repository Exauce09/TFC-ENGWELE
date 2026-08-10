import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import StaffShell from '@/src/components/staff/StaffShell';
import StatGrid from '@/src/components/staff/StatGrid';
import { SPECIALITE_BY_ROLE } from '@/src/constants/roles';
import { colors, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

export default function SpecialiteDashboardScreen() {
  const { user } = useAuth();
  const config = useMemo(() => SPECIALITE_BY_ROLE[user?.role ?? ''], [user?.role]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!config) return;
    try {
      const res = await api.get(config.dashboardApi);
      setStats(res.data.data || {});
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [config]);

  useEffect(() => {
    void load();
  }, [load]);

  const nav = [
    { label: 'Accueil', icon: 'home' as const, href: '/(specialite)', active: true },
    { label: config?.listLabel || 'Liste', icon: 'list' as const, href: '/(specialite)/liste' },
  ];

  return (
    <StaffShell
      title={config?.title || 'Spécialité'}
      subtitle={user?.name}
      nav={nav}
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
            stats={(config?.stats || []).map((s) => ({
              label: s.label,
              value: stats?.[s.key] ?? '—',
            }))}
          />
          <Pressable style={styles.cta} onPress={() => router.push('/(specialite)/liste')}>
            <Text style={styles.ctaText}>{config?.listLabel || 'Liste'} →</Text>
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
