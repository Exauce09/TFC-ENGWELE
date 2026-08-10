import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors, radius, statutColors } from '@/src/constants/theme';
import api from '@/src/services/api';

type Med = { nom?: string; nom_dci?: string; dosage?: string; frequence?: string; duree?: string };

type Rx = {
  id: number | string;
  numero_ordonnance?: string;
  date_prescription?: string;
  statut?: string;
  statut_label?: string;
  medicaments?: Med[];
  medecin?: { user?: { name?: string } } | string;
};

function medecinName(m: Rx['medecin']) {
  if (!m) return 'Médecin';
  if (typeof m === 'string') return m;
  return m.user?.name || 'Médecin';
}

export default function PatientPrescriptionsScreen() {
  const [list, setList] = useState<Rx[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/patient/prescriptions');
      setList(res.data.data || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: 'Prescriptions', headerBackTitle: 'Retour' }} />
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
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : list.length === 0 ? (
          <MedicalCard style={styles.empty}>
            <Ionicons name="medkit-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Aucune prescription</Text>
          </MedicalCard>
        ) : (
          list.map((rx, i) => (
            <Animated.View key={String(rx.id)} entering={FadeInDown.delay(i * 50).springify()}>
              <MedicalCard style={styles.card}>
                <View style={styles.head}>
                  <Text style={styles.num}>{rx.numero_ordonnance || `ORD-${rx.id}`}</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: statutColors[rx.statut || '']?.bg || '#f1f5f9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: statutColors[rx.statut || '']?.text || colors.textMuted },
                      ]}
                    >
                      {rx.statut_label || rx.statut || '—'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {rx.date_prescription || '—'} · {medecinName(rx.medecin)}
                </Text>
                {(rx.medicaments || []).map((m, idx) => (
                  <View key={idx} style={styles.medRow}>
                    <Ionicons name="ellipse" size={6} color={colors.primary} />
                    <Text style={styles.medText}>
                      {m.nom || m.nom_dci || 'Médicament'}
                      {m.dosage ? ` · ${m.dosage}` : ''}
                      {m.frequence ? ` · ${m.frequence}` : ''}
                      {m.duree ? ` · ${m.duree}` : ''}
                    </Text>
                  </View>
                ))}
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
  list: { padding: 20, gap: 12, paddingBottom: 40 },
  card: { gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  num: { fontSize: 15, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  meta: { fontSize: 12, color: colors.textMuted },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  medText: { flex: 1, fontSize: 13, color: colors.text },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
});
