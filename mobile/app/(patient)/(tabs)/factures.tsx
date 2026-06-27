import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import GradientHero from '@/src/components/ui/GradientHero';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { images } from '@/src/constants/images';
import { colors, radius, statutColors } from '@/src/constants/theme';
import api from '@/src/services/api';

type Facture = {
  id: number;
  numero_facture?: string;
  statut: string;
  montant_total: number;
  montant_paye?: number;
  date_emission?: string;
};

export default function PatientFacturesScreen() {
  const [list, setList] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
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
              <MedicalCard style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="receipt" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.num}>{f.numero_facture ?? `Facture #${f.id}`}</Text>
                    <Text style={styles.date}>{f.date_emission ?? '—'}</Text>
                  </View>
                  <View style={styles.amountBlock}>
                    <Text style={styles.amount}>{formatMoney(f.montant_total)}</Text>
                    <View style={[styles.badge, { backgroundColor: statutColors[f.statut]?.bg ?? '#f1f5f9' }]}>
                      <Text style={[styles.badgeText, { color: statutColors[f.statut]?.text ?? colors.textMuted }]}>
                        {f.statut?.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </View>
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
  card: {},
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
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
