import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import StatusBadge from '@/src/components/staff/StatusBadge';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(pharma)' },
  { label: 'Stock', icon: 'cube' as const, href: '/(pharma)/stock' },
  { label: 'Ordonnances', icon: 'document-text' as const, href: '/(pharma)/ordonnances', active: true },
];

export default function PharmaOrdonnancesScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/pharmacie/ordonnances');
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

  const delivrer = async (p: any) => {
    try {
      await api.put(`/pharmacie/ordonnances/${p.id}/delivrer`, {});
      Alert.alert('OK', 'Ordonnance délivrée');
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Délivrance impossible');
    }
  };

  return (
    <StaffShell
      title="Ordonnances"
      subtitle="Délivrance pharmacie"
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
        <EmptyState icon="document-text-outline" title="Aucune ordonnance" />
      ) : (
        items.map((p) => (
          <MedicalCard key={p.id} style={styles.card}>
            <Text style={styles.name}>
              {p.numero_ordonnance || `#${p.id}`} · {p.patient?.user?.name || 'Patient'}
            </Text>
            <Text style={styles.meta}>{p.date_prescription || p.created_at || '—'}</Text>
            <StatusBadge statut={p.statut} />
            {p.statut !== 'delivree' ? (
              <Pressable style={styles.btn} onPress={() => delivrer(p)}>
                <Text style={styles.btnText}>Délivrer</Text>
              </Pressable>
            ) : null}
          </MedicalCard>
        ))
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  btn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
