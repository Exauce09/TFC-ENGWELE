import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import StaffShell from '@/src/components/staff/StaffShell';
import StatGrid from '@/src/components/staff/StatGrid';
import { colors, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(caisse)', active: true },
  { label: 'Factures', icon: 'receipt' as const, href: '/(caisse)/factures' },
  { label: 'Paiements', icon: 'cash' as const, href: '/(caisse)/paiements' },
];

export default function CaisseDashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/caisse/dashboard');
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
      title={`Caisse · ${user?.name?.split(' ')[0] ?? ''}`}
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
              { label: 'Factures ouvertes', value: stats?.factures_ouvertes ?? stats?.en_attente ?? 0 },
              { label: 'Payées jour', value: stats?.payees_jour ?? stats?.termines ?? 0 },
              { label: 'Encaissé jour', value: money(stats?.encaisse_jour ?? stats?.montant_jour ?? 0) },
              { label: 'Impayés', value: stats?.impayees ?? 0 },
            ]}
          />
          <Pressable style={styles.cta} onPress={() => router.push('/(caisse)/paiements')}>
            <Text style={styles.ctaText}>Enregistrer un paiement →</Text>
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
