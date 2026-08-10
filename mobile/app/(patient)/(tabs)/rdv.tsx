import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import GradientHero from '@/src/components/ui/GradientHero';
import MedicalCard from '@/src/components/ui/MedicalCard';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { images } from '@/src/constants/images';
import { colors, radius, statutColors } from '@/src/constants/theme';
import api from '@/src/services/api';

type Rdv = {
  id: number;
  medecin_id?: number;
  date_rdv: string;
  heure_rdv: string;
  statut: string;
  motif?: string;
  type?: string;
  medecin?: { id?: number; user?: { name?: string } };
  departement?: string | { nom?: string };
};

type Dept = { id: number; nom: string };
type Med = { id: number; name?: string; specialite?: string; user?: { name?: string } };
type Slot = { heure: string; disponible: boolean };

function deptLabel(v: Rdv['departement']) {
  if (!v) return '—';
  return typeof v === 'object' ? v.nom ?? '—' : v;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function PatientRdvScreen() {
  const [list, setList] = useState<Rdv[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [departements, setDepartements] = useState<Dept[]>([]);
  const [medecins, setMedecins] = useState<Med[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    departement_id: '',
    medecin_id: '',
    date_rdv: todayIso(),
    heure_rdv: '',
    motif: '',
    type: 'presentiel',
  });

  const load = async () => {
    try {
      const res = await api.get('/patient/rendez-vous');
      setList(res.data.data || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
    api.get('/departements').then((r) => setDepartements(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.departement_id) {
      setMedecins([]);
      return;
    }
    api
      .get('/medecins', { params: { departement_id: form.departement_id } })
      .then((r) => setMedecins(r.data.data || []))
      .catch(() => setMedecins([]));
  }, [form.departement_id]);

  useEffect(() => {
    if (!form.medecin_id || !form.date_rdv) {
      setSlots([]);
      return;
    }
    setForm((f) => ({ ...f, heure_rdv: '' }));
    api
      .get('/patient/creneaux', { params: { medecin_id: form.medecin_id, date: form.date_rdv } })
      .then((r) => setSlots(r.data.data || []))
      .catch(() => setSlots([]));
  }, [form.medecin_id, form.date_rdv]);

  const disponibles = useMemo(() => slots.filter((s) => s.disponible), [slots]);

  const reserver = async () => {
    if (!form.heure_rdv) {
      Alert.alert('Créneau', 'Choisissez un horaire disponible.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/patient/rendez-vous', form);
      Alert.alert('OK', 'RDV enregistré (en attente de confirmation). Rappels J-1 et H-2 automatiques.');
      setShowForm(false);
      setForm({
        departement_id: '',
        medecin_id: '',
        date_rdv: todayIso(),
        heure_rdv: '',
        motif: '',
        type: 'presentiel',
      });
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Réservation impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const annuler = (id: number) => {
    Alert.alert('Annuler', 'Le créneau sera libéré.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/patient/rendez-vous/${id}`);
            void load();
          } catch (e: any) {
            Alert.alert('Erreur', e?.response?.data?.message || 'Annulation impossible');
          }
        },
      },
    ]);
  };

  const modifiable = (s: string) => s === 'en_attente' || s === 'confirme';

  return (
    <View style={styles.screen}>
      <GradientHero
        imageUri={images.doctor}
        title="Mes rendez-vous"
        subtitle="Créneaux · en attente / confirmé · rappels J-1 & H-2"
        height={160}
      />
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <PrimaryButton
          label={showForm ? 'Fermer le formulaire' : '+ Nouveau créneau'}
          onPress={() => setShowForm((v) => !v)}
        />

        {showForm ? (
          <MedicalCard style={styles.form}>
            <Text style={styles.formTitle}>Choisir un créneau</Text>
            <Text style={styles.label}>Département</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {departements.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() =>
                    setForm((f) => ({
                      ...f,
                      departement_id: String(d.id),
                      medecin_id: '',
                      heure_rdv: '',
                    }))
                  }
                  style={[styles.chip, form.departement_id === String(d.id) && styles.chipOn]}
                >
                  <Text style={[styles.chipText, form.departement_id === String(d.id) && styles.chipTextOn]}>
                    {d.nom}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Médecin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {medecins.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setForm((f) => ({ ...f, medecin_id: String(m.id), heure_rdv: '' }))}
                  style={[styles.chip, form.medecin_id === String(m.id) && styles.chipOn]}
                >
                  <Text style={[styles.chipText, form.medecin_id === String(m.id) && styles.chipTextOn]}>
                    {m.name || m.user?.name || `Médecin #${m.id}`}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Date (AAAA-MM-JJ)</Text>
            <TextInput
              value={form.date_rdv}
              onChangeText={(t) => setForm((f) => ({ ...f, date_rdv: t, heure_rdv: '' }))}
              style={styles.input}
              placeholder={todayIso()}
              placeholderTextColor={colors.textLight}
            />

            <Text style={styles.label}>Créneaux libres</Text>
            <View style={styles.slotGrid}>
              {disponibles.length === 0 ? (
                <Text style={styles.hint}>Aucun créneau — changez de date ou de médecin.</Text>
              ) : (
                disponibles.map((s) => (
                  <Pressable
                    key={s.heure}
                    onPress={() => setForm((f) => ({ ...f, heure_rdv: s.heure }))}
                    style={[styles.slot, form.heure_rdv === s.heure && styles.slotOn]}
                  >
                    <Text style={[styles.slotText, form.heure_rdv === s.heure && styles.slotTextOn]}>
                      {s.heure}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            <Text style={styles.label}>Type</Text>
            <View style={styles.slotGrid}>
              {[
                { value: 'presentiel', label: 'Sur place' },
                { value: 'teleconsultation', label: 'Téléconsultation' },
              ].map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setForm((f) => ({ ...f, type: t.value }))}
                  style={[styles.slot, form.type === t.value && styles.slotOn]}
                >
                  <Text style={[styles.slotText, form.type === t.value && styles.slotTextOn]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Motif</Text>
            <TextInput
              value={form.motif}
              onChangeText={(t) => setForm((f) => ({ ...f, motif: t }))}
              style={[styles.input, { minHeight: 64 }]}
              multiline
              placeholder="Motif de consultation"
              placeholderTextColor={colors.textLight}
            />

            <PrimaryButton
              label={submitting ? 'Enregistrement…' : 'Réserver'}
              onPress={() => void reserver()}
              loading={submitting}
              disabled={!form.heure_rdv}
            />
          </MedicalCard>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : list.length === 0 ? (
          <MedicalCard style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
            <Text style={styles.emptyText}>Réservez un créneau ci-dessus.</Text>
          </MedicalCard>
        ) : (
          list.map((rdv, i) => (
            <Animated.View key={rdv.id} entering={FadeInDown.delay(i * 60).springify()}>
              <MedicalCard style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>{String(rdv.date_rdv).slice(8, 10)}</Text>
                    <Text style={styles.dateMonth}>{String(rdv.date_rdv).slice(5, 7)}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.time}>
                      {String(rdv.heure_rdv).slice(0, 5)} · {deptLabel(rdv.departement)}
                    </Text>
                    <Text style={styles.doctor}>{rdv.medecin?.user?.name ?? 'Médecin'}</Text>
                    {rdv.motif ? <Text style={styles.motif}>{rdv.motif}</Text> : null}
                  </View>
                  <View style={[styles.status, { backgroundColor: statutColors[rdv.statut]?.bg }]}>
                    <Text style={[styles.statusText, { color: statutColors[rdv.statut]?.text }]}>
                      {rdv.statut?.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                {rdv.type === 'teleconsultation' ? (
                  <View style={styles.teleRow}>
                    <Ionicons name="videocam" size={16} color={colors.primary} />
                    <Text style={styles.teleText}>Téléconsultation</Text>
                  </View>
                ) : null}
                {modifiable(rdv.statut) ? (
                  <Pressable onPress={() => annuler(rdv.id)} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Annuler (libère le créneau)</Text>
                  </Pressable>
                ) : null}
              </MedicalCard>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 20, gap: 12, paddingBottom: 32 },
  form: { gap: 8 },
  formTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 6 },
  chips: { marginVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text },
  chipTextOn: { color: '#fff', fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#fff',
  },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
  slot: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  slotOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: 13, fontWeight: '600', color: colors.text },
  slotTextOn: { color: '#fff' },
  hint: { fontSize: 12, color: colors.textLight },
  card: { gap: 10 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: { fontSize: 18, fontWeight: '800', color: colors.primary },
  dateMonth: { fontSize: 11, color: colors.primaryDark, fontWeight: '600' },
  cardInfo: { flex: 1, gap: 2 },
  time: { fontSize: 14, fontWeight: '700', color: colors.text },
  doctor: { fontSize: 13, color: colors.textMuted },
  motif: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  status: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  teleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  teleText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  cancelBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
