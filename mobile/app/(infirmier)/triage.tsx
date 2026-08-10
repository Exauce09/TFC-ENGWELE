import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import MedicalCard from '@/src/components/ui/MedicalCard';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(infirmier)' },
  { label: 'Triage', icon: 'medkit' as const, href: '/(infirmier)/triage', active: true },
  { label: 'Constantes', icon: 'pulse' as const, href: '/(infirmier)/constantes' },
  { label: 'Patients', icon: 'people' as const, href: '/(infirmier)/patients' },
];

const URGENCES = [
  { value: 'critique', label: 'Critique' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'moins_urgent', label: 'Moins urgent' },
  { value: 'non_urgent', label: 'Non urgent' },
];

const EMPTY = {
  niveau_urgence: 'moins_urgent',
  notes: '',
  temperature: '',
  tension_arterielle: '',
  frequence_cardiaque: '',
  saturation_02: '',
};

export default function InfirmierTriageScreen() {
  const [file, setFile] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/infirmier/file-triage');
      setFile(res.data.data || []);
    } catch {
      setFile([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.patch(`/admissions/${selected.id}/triage`, {
        niveau_urgence: form.niveau_urgence,
        temperature: form.temperature || null,
        tension_arterielle: form.tension_arterielle || null,
        frequence_cardiaque: form.frequence_cardiaque || null,
        saturation_02: form.saturation_02 || null,
        notes: form.notes || null,
      });
      Alert.alert('OK', `Triage terminé pour ${selected.patient?.user?.name || 'le patient'}`);
      setSelected(null);
      setForm(EMPTY);
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Erreur triage');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StaffShell
      title="Triage"
      subtitle="Constantes et niveau d'urgence"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : file.length === 0 && !selected ? (
        <EmptyState icon="bandage-outline" title="File vide" text="Aucun patient en attente." />
      ) : (
        <>
          {!selected
            ? file.map((a) => (
                <Pressable key={a.id} onPress={() => setSelected(a)}>
                  <MedicalCard style={styles.card}>
                    <Text style={styles.name}>{a.patient?.user?.name || 'Patient'}</Text>
                    <Text style={styles.meta}>{a.motif_arrivee || 'Arrivée'}</Text>
                    <Text style={styles.hint}>Toucher pour triage →</Text>
                  </MedicalCard>
                </Pressable>
              ))
            : null}

          {selected ? (
            <MedicalCard style={styles.formCard}>
              <Text style={styles.name}>{selected.patient?.user?.name}</Text>
              <Text style={styles.label}>Niveau d'urgence</Text>
              <View style={styles.row}>
                {URGENCES.map((u) => (
                  <Pressable
                    key={u.value}
                    style={[styles.chip, form.niveau_urgence === u.value && styles.chipActive]}
                    onPress={() => setForm((f) => ({ ...f, niveau_urgence: u.value }))}
                  >
                    <Text
                      style={[styles.chipText, form.niveau_urgence === u.value && styles.chipTextActive]}
                    >
                      {u.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {(
                [
                  ['temperature', 'Température (°C)'],
                  ['tension_arterielle', 'Tension'],
                  ['frequence_cardiaque', 'Pouls'],
                  ['saturation_02', 'SpO2'],
                ] as const
              ).map(([key, label]) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    value={(form as any)[key]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                    style={styles.input}
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              ))}
              <View style={styles.field}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  value={form.notes}
                  onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                  style={[styles.input, { minHeight: 70 }]}
                  multiline
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <PrimaryButton label="Valider le triage" onPress={submit} loading={submitting} />
              <Pressable onPress={() => setSelected(null)} style={styles.cancel}>
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
            </MedicalCard>
          ) : null}
        </>
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  card: { gap: 4 },
  formCard: { gap: 10 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  hint: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 4 },
  label: { fontSize: 12, fontWeight: '700', color: colors.navySoft },
  field: { gap: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    color: colors.text,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#f1f5f9',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  chipTextActive: { color: '#fff' },
  cancel: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: colors.textMuted, fontWeight: '600' },
});
