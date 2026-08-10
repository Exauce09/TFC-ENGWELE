import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import StatusBadge from '@/src/components/staff/StatusBadge';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(medecin)' },
  { label: 'Planning', icon: 'calendar' as const, href: '/(medecin)/planning', active: true },
  { label: 'Patients', icon: 'people' as const, href: '/(medecin)/patients' },
  { label: 'Dossiers', icon: 'folder' as const, href: '/(medecin)/dossiers' },
  { label: 'Téléconsult.', icon: 'videocam' as const, href: '/(medecin)/teleconsultation' },
];

const STATUTS = ['en_attente', 'confirme', 'en_cours', 'termine', 'absent'] as const;

export default function MedecinPlanningScreen() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/medecin/planning', { params: { date } });
      setItems(res.data.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const updateStatut = async (id: number, statut: string) => {
    try {
      await api.put(`/medecin/rendez-vous/${id}/statut`, { statut });
      void load();
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  return (
    <StaffShell
      title="Planning RDV"
      subtitle="Vos rendez-vous par date"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      <Text style={styles.label}>Date (AAAA-MM-JJ)</Text>
      <TextInput
        value={date}
        onChangeText={setDate}
        style={styles.input}
        placeholder="2026-08-10"
        placeholderTextColor={colors.textLight}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState icon="calendar-outline" title="Aucun rendez-vous" text="Aucun RDV pour cette date." />
      ) : (
        items.map((item) => (
          <MedicalCard key={item.id} style={styles.card}>
            <Text style={styles.name}>
              {String(item.heure_rdv || '').slice(0, 5)} — {item.patient?.user?.name || 'Patient'}
            </Text>
            <Text style={styles.meta}>{item.departement?.nom || item.motif || '—'}</Text>
            <StatusBadge statut={item.statut} />
            <View style={styles.actions}>
              {STATUTS.filter((s) => s !== item.statut).slice(0, 3).map((s) => (
                <Pressable key={s} style={styles.chip} onPress={() => updateStatut(item.id, s)}>
                  <Text style={styles.chipText}>{s.replace('_', ' ')}</Text>
                </Pressable>
              ))}
            </View>
          </MedicalCard>
        ))
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.navySoft },
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
  card: { gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'capitalize' },
});
