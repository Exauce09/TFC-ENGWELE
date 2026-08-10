import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(infirmier)' },
  { label: 'Triage', icon: 'medkit' as const, href: '/(infirmier)/triage' },
  { label: 'Constantes', icon: 'pulse' as const, href: '/(infirmier)/constantes' },
  { label: 'Patients', icon: 'people' as const, href: '/(infirmier)/patients', active: true },
];

export default function InfirmierPatientsScreen() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (term = q) => {
    try {
      const res = await api.get('/infirmier/patients', {
        params: term.trim() ? { q: term.trim() } : {},
      });
      setItems(res.data.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q]);

  useEffect(() => {
    void load('');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim().length === 0 || q.trim().length >= 2) void load(q);
    }, 350);
    return () => clearTimeout(t);
  }, [q, load]);

  return (
    <StaffShell
      title="Patients"
      subtitle="Recherche infirmière"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Rechercher…"
        placeholderTextColor={colors.textLight}
        style={styles.input}
      />
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState icon="people-outline" title="Aucun patient" />
      ) : (
        items.map((p) => (
          <MedicalCard key={p.id} style={styles.card}>
            <Text style={styles.name}>{p.user?.name || 'Patient'}</Text>
            <Text style={styles.meta}>
              #{p.numero_patient || p.id}
              {p.user?.phone ? ` · ${p.user.phone}` : ''}
            </Text>
          </MedicalCard>
        ))
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  card: { gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
});
