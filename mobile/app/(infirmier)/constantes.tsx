import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import MedicalCard from '@/src/components/ui/MedicalCard';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(infirmier)' },
  { label: 'Triage', icon: 'medkit' as const, href: '/(infirmier)/triage' },
  { label: 'Constantes', icon: 'pulse' as const, href: '/(infirmier)/constantes', active: true },
  { label: 'Patients', icon: 'people' as const, href: '/(infirmier)/patients' },
];

export default function InfirmierConstantesScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patient_id: '',
    temperature: '',
    tension_arterielle: '',
    frequence_cardiaque: '',
    notes: '',
  });

  const load = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/infirmier/constantes'),
        api.get('/infirmier/patients'),
      ]);
      setItems(cRes.data.data || []);
      setPatients(pRes.data.data || []);
    } catch {
      setItems([]);
      setPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form.patient_id) {
      Alert.alert('Patient requis', 'Indiquez l’ID patient.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/infirmier/constantes', {
        patient_id: Number(form.patient_id),
        temperature: form.temperature || null,
        tension_arterielle: form.tension_arterielle || null,
        frequence_cardiaque: form.frequence_cardiaque || null,
        notes: form.notes || null,
      });
      Alert.alert('OK', 'Constantes enregistrées');
      setForm({ patient_id: '', temperature: '', tension_arterielle: '', frequence_cardiaque: '', notes: '' });
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StaffShell
      title="Constantes"
      subtitle="Saisie et historique récent"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      <MedicalCard style={styles.form}>
        <Text style={styles.formTitle}>Nouvelle saisie</Text>
        <Text style={styles.hint}>
          Patients connus :{' '}
          {patients
            .slice(0, 5)
            .map((p) => `${p.user?.name || p.nom} (#${p.id})`)
            .join(', ') || '—'}
        </Text>
        {(
          [
            ['patient_id', 'ID patient'],
            ['temperature', 'Température'],
            ['tension_arterielle', 'Tension'],
            ['frequence_cardiaque', 'Pouls'],
            ['notes', 'Notes'],
          ] as const
        ).map(([key, label]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              value={(form as any)[key]}
              onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
              style={styles.input}
              keyboardType={key === 'patient_id' ? 'number-pad' : 'default'}
              placeholderTextColor={colors.textLight}
            />
          </View>
        ))}
        <PrimaryButton label="Enregistrer" onPress={save} loading={saving} />
      </MedicalCard>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState icon="pulse-outline" title="Aucune constante" />
      ) : (
        items.slice(0, 20).map((c: any, i: number) => (
          <MedicalCard key={c.id ?? i} style={styles.card}>
            <Text style={styles.name}>{c.patient?.user?.name || `Patient #${c.patient_id}`}</Text>
            <Text style={styles.meta}>
              T° {c.temperature ?? '—'} · TA {c.tension_arterielle ?? '—'} · FC{' '}
              {c.frequence_cardiaque ?? '—'}
            </Text>
          </MedicalCard>
        ))
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: 10 },
  formTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: colors.navySoft },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.white,
  },
  card: { gap: 4 },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted },
});
