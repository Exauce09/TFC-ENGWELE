import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

type Consultation = {
  id: string | number;
  date_consultation?: string;
  motif?: string;
  diagnostic_final?: string;
  diagnostic_provisoire?: string;
  statut_parcours_label?: string;
  medecin?: { user?: { name?: string } };
  departement?: { nom?: string } | string;
  diagnostics?: { libelle?: string }[];
};

function deptName(d: Consultation['departement']) {
  if (!d) return '—';
  return typeof d === 'object' ? d.nom ?? '—' : d;
}

export default function PatientDossierScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [expanded, setExpanded] = useState<string | number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/patient/dossier');
      const data = res.data.data || {};
      setConsultations(data.consultations || data.dossiers || []);
    } catch {
      setConsultations([]);
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
      <Stack.Screen options={{ headerShown: true, title: 'Mon dossier', headerBackTitle: 'Retour' }} />
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
        <Pressable style={styles.linkCard} onPress={() => router.push('/(patient)/prescriptions' as never)}>
          <Ionicons name="medkit-outline" size={22} color={colors.primary} />
          <Text style={styles.linkText}>Mes prescriptions</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </Pressable>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : consultations.length === 0 ? (
          <MedicalCard style={styles.empty}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Aucun dossier</Text>
            <Text style={styles.emptyText}>Vos consultations apparaîtront après une visite à l&apos;accueil.</Text>
          </MedicalCard>
        ) : (
          consultations.map((c, i) => {
            const key = c.id;
            const open = expanded === key;
            const diag =
              c.diagnostic_final ||
              c.diagnostic_provisoire ||
              c.diagnostics?.[0]?.libelle ||
              null;
            return (
              <Animated.View key={String(key)} entering={FadeInDown.delay(i * 50).springify()}>
                <Pressable onPress={() => setExpanded(open ? null : key)}>
                  <MedicalCard style={styles.card}>
                    <View style={styles.row}>
                      <View style={styles.icon}>
                        <Ionicons name="document-text" size={22} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.date}>{c.date_consultation || '—'}</Text>
                        <Text style={styles.motif}>{c.motif || 'Consultation'}</Text>
                        <Text style={styles.meta}>
                          {c.medecin?.user?.name || 'Médecin'} · {deptName(c.departement)}
                        </Text>
                      </View>
                      <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.textLight}
                      />
                    </View>
                    {open ? (
                      <View style={styles.detail}>
                        {c.statut_parcours_label ? (
                          <Text style={styles.detailLine}>Parcours : {c.statut_parcours_label}</Text>
                        ) : null}
                        {diag ? <Text style={styles.detailLine}>Diagnostic : {diag}</Text> : null}
                      </View>
                    ) : null}
                  </MedicalCard>
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 20, gap: 12, paddingBottom: 40 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  card: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: { fontSize: 12, fontWeight: '700', color: colors.primary },
  motif: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  detail: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 4,
  },
  detailLine: { fontSize: 13, color: colors.text },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
