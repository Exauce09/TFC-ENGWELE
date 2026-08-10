import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import MedicalCard from '@/src/components/ui/MedicalCard';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(caisse)' },
  { label: 'Factures', icon: 'receipt' as const, href: '/(caisse)/factures' },
  { label: 'Paiements', icon: 'cash' as const, href: '/(caisse)/paiements', active: true },
];

const MODES = [
  { value: 'especes', label: 'Espèces' },
  { value: 'airtel_money', label: 'Airtel' },
  { value: 'm_pesa', label: 'M-Pesa' },
  { value: 'orange_money', label: 'Orange' },
];

export default function CaissePaiementsScreen() {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [ouvertes, setOuvertes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    facture_id: '',
    montant: '',
    mode: 'especes',
    telephone: '',
  });

  const load = useCallback(async () => {
    try {
      const [pRes, eRes, partRes] = await Promise.all([
        api.get('/caisse/paiements'),
        api.get('/caisse/factures', { params: { statut: 'emise' } }),
        api.get('/caisse/factures', { params: { statut: 'partiellement_payee' } }).catch(() => ({
          data: { data: [] },
        })),
      ]);
      setPaiements(pRes.data.data || []);
      setOuvertes([...(eRes.data.data || []), ...(partRes.data.data || [])]);
    } catch {
      setPaiements([]);
      setOuvertes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form.facture_id || !form.montant) {
      Alert.alert('Champs requis', 'Facture et montant sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/caisse/paiements', {
        facture_id: Number(form.facture_id),
        montant: Number(form.montant),
        mode: form.mode,
        telephone: form.telephone || undefined,
      });
      Alert.alert('OK', 'Paiement enregistré');
      setForm({ facture_id: '', montant: '', mode: 'especes', telephone: '' });
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Paiement impossible');
    } finally {
      setSaving(false);
    }
  };

  const money = (n: number) => `${Number(n || 0).toLocaleString('fr-CD')} FC`;

  return (
    <StaffShell
      title="Paiements"
      subtitle="Encaissement"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      <MedicalCard style={styles.form}>
        <Text style={styles.formTitle}>Nouveau paiement</Text>
        <Text style={styles.hint}>
          Factures ouvertes :{' '}
          {ouvertes
            .slice(0, 4)
            .map((f) => `${f.numero_facture || f.id} (${money(f.reste_a_payer ?? f.montant_total)})`)
            .join(', ') || 'aucune'}
        </Text>
        <Text style={styles.label}>ID facture</Text>
        <TextInput
          value={form.facture_id}
          onChangeText={(v) => setForm((f) => ({ ...f, facture_id: v }))}
          style={styles.input}
          keyboardType="number-pad"
          placeholderTextColor={colors.textLight}
        />
        <Text style={styles.label}>Montant (FC)</Text>
        <TextInput
          value={form.montant}
          onChangeText={(v) => setForm((f) => ({ ...f, montant: v }))}
          style={styles.input}
          keyboardType="number-pad"
          placeholderTextColor={colors.textLight}
        />
        <Text style={styles.label}>Mode</Text>
        <View style={styles.modes}>
          {MODES.map((m) => (
            <Pressable
              key={m.value}
              style={[styles.mode, form.mode === m.value && styles.modeActive]}
              onPress={() => setForm((f) => ({ ...f, mode: m.value }))}
            >
              <Text style={[styles.modeText, form.mode === m.value && styles.modeTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {form.mode !== 'especes' ? (
          <>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              value={form.telephone}
              onChangeText={(v) => setForm((f) => ({ ...f, telephone: v }))}
              style={styles.input}
              keyboardType="phone-pad"
              placeholderTextColor={colors.textLight}
            />
          </>
        ) : null}
        <PrimaryButton label="Encaisser" onPress={save} loading={saving} />
      </MedicalCard>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : paiements.length === 0 ? (
        <EmptyState icon="cash-outline" title="Aucun paiement" />
      ) : (
        paiements.slice(0, 20).map((p) => (
          <MedicalCard key={p.id} style={styles.card}>
            <Text style={styles.name}>{money(p.montant)}</Text>
            <Text style={styles.meta}>
              {p.mode || p.mode_paiement || '—'} · facture #{p.facture_id || p.facture?.id}
            </Text>
          </MedicalCard>
        ))
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: 8 },
  formTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '700', color: colors.navySoft, marginTop: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.white,
  },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mode: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#f1f5f9',
  },
  modeActive: { backgroundColor: colors.primary },
  modeText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  modeTextActive: { color: '#fff' },
  card: { gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
});
