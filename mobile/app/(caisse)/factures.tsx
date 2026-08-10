import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import StatusBadge from '@/src/components/staff/StatusBadge';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(caisse)' },
  { label: 'Factures', icon: 'receipt' as const, href: '/(caisse)/factures', active: true },
  { label: 'Paiements', icon: 'cash' as const, href: '/(caisse)/paiements' },
];

export default function CaisseFacturesScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/caisse/factures');
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

  const money = (n: number) => `${Number(n || 0).toLocaleString('fr-CD')} FC`;

  return (
    <StaffShell
      title="Factures"
      subtitle="Gestion caisse"
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
        <EmptyState icon="receipt-outline" title="Aucune facture" />
      ) : (
        items.map((f) => (
          <MedicalCard key={f.id} style={styles.card}>
            <Text style={styles.name}>{f.numero_facture || `Facture #${f.id}`}</Text>
            <Text style={styles.meta}>
              {f.patient?.user?.name || 'Patient'} · {money(f.montant_total)}
            </Text>
            <StatusBadge statut={f.statut} />
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
