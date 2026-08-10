import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import StatusBadge from '@/src/components/staff/StatusBadge';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(admin)' },
  { label: 'Stats', icon: 'stats-chart' as const, href: '/(admin)/stats' },
  { label: 'RDV', icon: 'calendar' as const, href: '/(admin)/rendez-vous', active: true },
];

export default function AdminRendezVousScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/rendez-vous');
      setItems(res.data.data || []);
    } catch {
      setItems([]);
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
      title="Rendez-vous"
      subtitle="Vue admin"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState icon="calendar-outline" title="Aucun rendez-vous" />
      ) : (
        items.slice(0, 40).map((rdv) => (
          <MedicalCard key={rdv.id} style={styles.card}>
            <Text style={styles.name}>
              {rdv.patient?.user?.name || 'Patient'} · {rdv.date_rdv}
            </Text>
            <Text style={styles.meta}>
              {String(rdv.heure_rdv || '').slice(0, 5)} · {rdv.medecin?.user?.name || 'Médecin'}
            </Text>
            <StatusBadge statut={rdv.statut} />
          </MedicalCard>
        ))
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  card: { gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
});
