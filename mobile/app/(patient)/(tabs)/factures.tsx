import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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

type Facture = {
  id: number;
  numero_facture?: string;
  statut: string;
  montant_total: number;
  montant_paye?: number;
  reste_a_payer?: number;
  date_emission?: string;
  date_facture?: string;
  lignes?: { description?: string; quantite?: number; montant?: number }[];
};

const MODES = [
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'm_pesa', label: 'M-Pesa' },
  { value: 'orange_money', label: 'Orange Money' },
];

export default function PatientFacturesScreen() {
  const [list, setList] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<Facture | null>(null);
  const [payModal, setPayModal] = useState<Facture | null>(null);
  const [payForm, setPayForm] = useState({ mode: 'airtel_money', telephone: '' });
  const [paying, setPaying] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/patient/factures');
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
  }, []);

  const formatMoney = (n: number) => `${Number(n).toLocaleString('fr-CD')} FC`;

  const openDetail = async (id: number) => {
    try {
      const res = await api.get(`/patient/factures/${id}`);
      setDetail(res.data.data);
    } catch {
      const local = list.find((f) => f.id === id) || null;
      setDetail(local);
    }
  };

  const payer = async () => {
    if (!payModal) return;
    if (!payForm.telephone.trim()) {
      Alert.alert('Téléphone requis', 'Indiquez le numéro Mobile Money.');
      return;
    }
    setPaying(true);
    try {
      const res = await api.post(`/patient/factures/${payModal.id}/paiement`, payForm);
      Alert.alert('Paiement', res.data.message || 'Paiement enregistré.');
      setPayModal(null);
      setDetail(null);
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Paiement impossible');
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.screen}>
      <GradientHero
        imageUri={images.hospital}
        title="Mes factures"
        subtitle="Paiements et historique"
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
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : list.length === 0 ? (
          <MedicalCard style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Aucune facture</Text>
            <Text style={styles.emptyText}>Vos factures médicales apparaîtront ici.</Text>
          </MedicalCard>
        ) : (
          list.map((f, i) => (
            <Animated.View key={f.id} entering={FadeInDown.delay(i * 60).springify()}>
              <Pressable onPress={() => openDetail(f.id)}>
                <MedicalCard style={styles.card}>
                  <View style={styles.row}>
                    <View style={styles.iconWrap}>
                      <Ionicons name="receipt" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.num}>{f.numero_facture ?? `Facture #${f.id}`}</Text>
                      <Text style={styles.date}>{f.date_emission ?? f.date_facture ?? '—'}</Text>
                    </View>
                    <View style={styles.amountBlock}>
                      <Text style={styles.amount}>{formatMoney(f.montant_total)}</Text>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: statutColors[f.statut]?.bg ?? '#f1f5f9' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: statutColors[f.statut]?.text ?? colors.textMuted },
                          ]}
                        >
                          {f.statut?.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {['emise', 'partiellement_payee'].includes(f.statut) ? (
                    <Pressable
                      style={styles.payBtn}
                      onPress={() => {
                        setPayModal(f);
                        setPayForm({ mode: 'airtel_money', telephone: '' });
                      }}
                    >
                      <Text style={styles.payBtnText}>Payer</Text>
                    </Pressable>
                  ) : null}
                </MedicalCard>
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!detail} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{detail?.numero_facture ?? `Facture #${detail?.id}`}</Text>
            <Text style={styles.date}>{detail?.date_emission ?? detail?.date_facture ?? '—'}</Text>
            {(detail?.lignes || []).map((l, idx) => (
              <View key={idx} style={styles.ligne}>
                <Text style={styles.ligneDesc}>{l.description || 'Ligne'}</Text>
                <Text style={styles.ligneAmt}>{formatMoney(Number(l.montant || 0))}</Text>
              </View>
            ))}
            <Text style={styles.amountTotal}>Total {formatMoney(Number(detail?.montant_total || 0))}</Text>
            {detail && ['emise', 'partiellement_payee'].includes(detail.statut) ? (
              <PrimaryButton
                label="Payer cette facture"
                onPress={() => {
                  setPayModal(detail);
                  setDetail(null);
                }}
              />
            ) : null}
            <Pressable onPress={() => setDetail(null)} style={styles.close}>
              <Text style={styles.closeText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={!!payModal} animationType="slide" transparent onRequestClose={() => setPayModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Payer {payModal?.numero_facture}</Text>
            <Text style={styles.amount}>{formatMoney(Number(payModal?.reste_a_payer ?? payModal?.montant_total ?? 0))}</Text>
            <Text style={styles.label}>Mode Mobile Money</Text>
            <View style={styles.modes}>
              {MODES.map((m) => (
                <Pressable
                  key={m.value}
                  style={[styles.mode, payForm.mode === m.value && styles.modeActive]}
                  onPress={() => setPayForm((f) => ({ ...f, mode: m.value }))}
                >
                  <Text style={[styles.modeText, payForm.mode === m.value && styles.modeTextActive]}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              value={payForm.telephone}
              onChangeText={(v) => setPayForm((f) => ({ ...f, telephone: v }))}
              style={styles.input}
              keyboardType="phone-pad"
              placeholder="+243…"
              placeholderTextColor={colors.textLight}
            />
            <PrimaryButton label="Confirmer le paiement" onPress={payer} loading={paying} />
            <Pressable onPress={() => setPayModal(null)} style={styles.close}>
              <Text style={styles.closeText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 20, gap: 12, paddingBottom: 32 },
  card: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  num: { fontSize: 15, fontWeight: '700', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  amountBlock: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 15, fontWeight: '800', color: colors.accentDark },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  payBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    gap: 10,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  ligneDesc: { flex: 1, fontSize: 13, color: colors.text },
  ligneAmt: { fontSize: 13, fontWeight: '700', color: colors.text },
  amountTotal: { fontSize: 16, fontWeight: '800', color: colors.primary, marginVertical: 6 },
  label: { fontSize: 12, fontWeight: '700', color: colors.navySoft },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mode: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#f1f5f9',
  },
  modeActive: { backgroundColor: colors.primary },
  modeText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  modeTextActive: { color: '#fff' },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
  },
  close: { alignItems: 'center', paddingVertical: 10 },
  closeText: { color: colors.textMuted, fontWeight: '600' },
});
