import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import StatusBadge from '@/src/components/staff/StatusBadge';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(accueil)' },
  { label: 'Demandes', icon: 'mail' as const, href: '/(accueil)/demandes' },
  { label: 'RDV jour', icon: 'calendar' as const, href: '/(accueil)/rendez-vous', active: true },
  { label: 'Patients', icon: 'people' as const, href: '/(accueil)/patients' },
];

export default function AccueilRendezVousScreen() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/accueil/rendez-vous', { params: { date } });
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

  const action = async (rdv: any, type: 'convertir' | 'absent') => {
    try {
      await api.post(`/accueil/rendez-vous/${rdv.id}/${type}`);
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Action impossible');
    }
  };

  return (
    <StaffShell
      title="RDV du jour"
      subtitle="File d'attente réception"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      <Text style={styles.label}>Date</Text>
      <TextInput value={date} onChangeText={setDate} style={styles.input} placeholderTextColor={colors.textLight} />

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState icon="calendar-outline" title="Aucun RDV" />
      ) : (
        items.map((rdv) => (
          <MedicalCard key={rdv.id} style={styles.card}>
            <Text style={styles.name}>
              {String(rdv.heure_rdv || '').slice(0, 5)} — {rdv.patient?.user?.name || 'Patient'}
            </Text>
            <Text style={styles.meta}>{rdv.medecin?.user?.name || rdv.motif || '—'}</Text>
            <StatusBadge statut={rdv.statut} />
            <View style={styles.actions}>
              <Pressable style={styles.btnPrimary} onPress={() => action(rdv, 'convertir')}>
                <Text style={styles.btnPrimaryText}>Arrivée</Text>
              </Pressable>
              <Pressable style={styles.btnGhost} onPress={() => action(rdv, 'absent')}>
                <Text style={styles.btnGhostText}>Absent</Text>
              </Pressable>
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
    color: colors.text,
  },
  card: { gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnGhost: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  btnGhostText: { color: colors.warning, fontWeight: '700', fontSize: 13 },
});
