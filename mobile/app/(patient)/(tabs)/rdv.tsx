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

type Rdv = {
  id: number;
  date_rdv: string;
  heure_rdv: string;
  statut: string;
  motif?: string;
  type?: string;
  medecin?: { user?: { name?: string } };
  departement?: string | { nom?: string };
};

function deptLabel(v: Rdv['departement']) {
  if (!v) return '—';
  return typeof v === 'object' ? v.nom ?? '—' : v;
}

export default function PatientRdvScreen() {
  const [list, setList] = useState<Rdv[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  }, []);

  return (
    <View style={styles.screen}>
      <GradientHero
        imageUri={images.doctor}
        title="Mes rendez-vous"
        subtitle="Consultations et téléconsultations"
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
            <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
            <Text style={styles.emptyText}>Prenez votre premier RDV depuis l'accueil.</Text>
          </MedicalCard>
        ) : (
          list.map((rdv, i) => (
            <Animated.View key={rdv.id} entering={FadeInDown.delay(i * 60).springify()}>
              <MedicalCard style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>{rdv.date_rdv?.slice(8, 10)}</Text>
                    <Text style={styles.dateMonth}>{rdv.date_rdv?.slice(5, 7)}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.time}>{rdv.heure_rdv} · {deptLabel(rdv.departement)}</Text>
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
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
