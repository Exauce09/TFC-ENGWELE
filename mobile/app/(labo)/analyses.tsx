import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import StatusBadge from '@/src/components/staff/StatusBadge';
import MedicalCard from '@/src/components/ui/MedicalCard';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(labo)' },
  { label: 'Analyses', icon: 'flask' as const, href: '/(labo)/analyses', active: true },
];

export default function LaboAnalysesScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [file, setFile] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [resultats, setResultats] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [aRes, fRes] = await Promise.all([
        api.get('/laboratoire/analyses'),
        api.get('/laboratoire/file-examens').catch(() => ({ data: { data: [] } })),
      ]);
      setItems(aRes.data.data || []);
      setFile(fRes.data.data || []);
    } catch {
      setItems([]);
      setFile([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/laboratoire/analyses/${selected.id}/resultats`, {
        resultats: resultats || 'Résultats saisis (mobile)',
        statut: 'termine',
      });
      Alert.alert('OK', 'Résultats enregistrés');
      setSelected(null);
      setResultats('');
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const list = [...file, ...items];

  return (
    <StaffShell
      title="Analyses"
      subtitle="File et résultats"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : list.length === 0 ? (
        <EmptyState icon="flask-outline" title="Aucune analyse" />
      ) : (
        list.map((a) => (
          <Pressable key={a.id} onPress={() => setSelected(a)}>
            <MedicalCard style={styles.card}>
              <Text style={styles.name}>
                {a.patient?.user?.name || a.type_examen || a.libelle || `Analyse #${a.id}`}
              </Text>
              <Text style={styles.meta}>{a.type_examen || a.libelle || a.statut}</Text>
              <StatusBadge statut={a.statut} />
            </MedicalCard>
          </Pressable>
        ))
      )}

      {selected ? (
        <MedicalCard style={styles.form}>
          <Text style={styles.name}>Résultats · #{selected.id}</Text>
          <TextInput
            value={resultats}
            onChangeText={setResultats}
            style={[styles.input, { minHeight: 90 }]}
            multiline
            placeholder="Saisir les résultats…"
            placeholderTextColor={colors.textLight}
          />
          <PrimaryButton label="Enregistrer" onPress={save} loading={saving} />
          <Pressable onPress={() => setSelected(null)}>
            <Text style={styles.cancel}>Fermer</Text>
          </Pressable>
        </MedicalCard>
      ) : null}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  card: { gap: 4 },
  form: { gap: 10 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.white,
  },
  cancel: { textAlign: 'center', color: colors.textMuted, fontWeight: '600', paddingVertical: 8 },
});
