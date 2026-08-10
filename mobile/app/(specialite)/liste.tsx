import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import StatusBadge from '@/src/components/staff/StatusBadge';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { SPECIALITE_BY_ROLE } from '@/src/constants/roles';
import { colors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

export default function SpecialiteListeScreen() {
  const { user } = useAuth();
  const config = useMemo(() => SPECIALITE_BY_ROLE[user?.role ?? ''], [user?.role]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!config) return;
    try {
      const res = await api.get(config.listApi);
      setItems(res.data.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [config]);

  useEffect(() => {
    void load();
  }, [load]);

  const nav = [
    { label: 'Accueil', icon: 'home' as const, href: '/(specialite)' },
    {
      label: config?.listLabel || 'Liste',
      icon: 'list' as const,
      href: '/(specialite)/liste',
      active: true,
    },
  ];

  return (
    <StaffShell
      title={config?.listLabel || 'Liste'}
      subtitle={config?.title}
      nav={nav}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState icon="list-outline" title="Aucun élément" />
      ) : (
        items.map((item) => (
          <MedicalCard key={item.id} style={styles.card}>
            <Text style={styles.name}>
              {item.patient?.user?.name ||
                item.titre ||
                item.type ||
                item.libelle ||
                item.motif ||
                `#${item.id}`}
            </Text>
            <Text style={styles.meta}>
              {item.date || item.date_operation || item.date_examen || item.date_seance || item.created_at || '—'}
            </Text>
            <StatusBadge statut={item.statut} />
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
