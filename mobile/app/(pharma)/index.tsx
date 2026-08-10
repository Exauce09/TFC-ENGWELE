import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import StaffShell from '@/src/components/staff/StaffShell';
import StatGrid from '@/src/components/staff/StatGrid';
import { colors, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(pharma)', active: true },
  { label: 'Stock', icon: 'cube' as const, href: '/(pharma)/stock' },
  { label: 'Ordonnances', icon: 'document-text' as const, href: '/(pharma)/ordonnances' },
];

export default function PharmaDashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/pharmacie/dashboard');
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
      title={`Pharmacie · ${user?.name?.split(' ')[0] ?? ''}`}
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
              { label: 'Ordonnances', value: stats?.ordonnances_en_attente ?? stats?.ordonnances ?? 0 },
              { label: 'Stock bas', value: stats?.stock_bas ?? stats?.alertes ?? 0 },
              { label: 'Délivrées', value: stats?.delivrees ?? stats?.termines ?? 0 },
              { label: 'Articles', value: stats?.total_stock ?? stats?.total ?? 0 },
            ]}
          />
          <Pressable style={styles.cta} onPress={() => router.push('/(pharma)/ordonnances')}>
            <Text style={styles.ctaText}>Ordonnances à délivrer →</Text>
          </Pressable>
        </>
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800' },
});
