import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(pharma)' },
  { label: 'Stock', icon: 'cube' as const, href: '/(pharma)/stock', active: true },
  { label: 'Ordonnances', icon: 'document-text' as const, href: '/(pharma)/ordonnances' },
];

export default function PharmaStockScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/pharmacie/stock');
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
      title="Stock"
      subtitle="Inventaire médicaments"
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
        <EmptyState icon="cube-outline" title="Stock vide" />
      ) : (
        items.map((s) => (
          <MedicalCard key={s.id} style={styles.card}>
            <Text style={styles.name}>{s.nom || s.medicament || `Article #${s.id}`}</Text>
            <Text style={styles.meta}>
              Qté : {s.quantite ?? s.stock ?? '—'}
              {s.seuil_alerte != null ? ` · seuil ${s.seuil_alerte}` : ''}
            </Text>
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
