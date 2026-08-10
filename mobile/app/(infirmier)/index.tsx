import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import StatGrid from '@/src/components/staff/StatGrid';
import StatusBadge from '@/src/components/staff/StatusBadge';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(infirmier)', active: true },
  { label: 'Triage', icon: 'medkit' as const, href: '/(infirmier)/triage' },
  { label: 'Constantes', icon: 'pulse' as const, href: '/(infirmier)/constantes' },
  { label: 'Patients', icon: 'people' as const, href: '/(infirmier)/patients' },
];

export default function InfirmierDashboardScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/infirmier/dashboard');
      setData(res.data.data || {});
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const file = data?.file_triage || [];

  return (
    <StaffShell
      title={`Bonjour, ${user?.name?.split(' ')[0] ?? 'Infirmier(e)'}`}
      subtitle="Unité de soins"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <StatGrid
            stats={[
              { label: 'File triage', value: data?.file_triage_count ?? file.length ?? 0 },
              { label: 'Prélèvements', value: data?.file_prelevement_count ?? 0 },
              { label: 'Constantes jour', value: data?.constantes_du_jour ?? 0 },
              { label: 'Mes saisies', value: data?.mes_constantes_du_jour ?? 0 },
            ]}
          />
          <Pressable style={styles.cta} onPress={() => router.push('/(infirmier)/triage')}>
            <Text style={styles.ctaText}>Ouvrir la file de triage →</Text>
          </Pressable>
          <Text style={styles.section}>File triage</Text>
          {file.length === 0 ? (
            <EmptyState icon="bandage-outline" title="File vide" text="Aucun patient en attente de triage." />
          ) : (
            file.slice(0, 8).map((a: any) => (
              <MedicalCard key={a.id} style={styles.card}>
                <Text style={styles.name}>{a.patient?.user?.name || 'Patient'}</Text>
                <Text style={styles.meta}>{a.motif_arrivee || 'Arrivée'}</Text>
                <StatusBadge statut={a.niveau_urgence || a.statut} />
              </MedicalCard>
            ))
          )}
        </>
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800' },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 },
  card: { gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
});
