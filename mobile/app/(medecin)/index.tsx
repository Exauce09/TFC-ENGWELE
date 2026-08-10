import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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
  { label: 'Accueil', icon: 'home' as const, href: '/(medecin)', active: true },
  { label: 'Planning', icon: 'calendar' as const, href: '/(medecin)/planning' },
  { label: 'Patients', icon: 'people' as const, href: '/(medecin)/patients' },
  { label: 'Dossiers', icon: 'folder' as const, href: '/(medecin)/dossiers' },
  { label: 'Téléconsult.', icon: 'videocam' as const, href: '/(medecin)/teleconsultation' },
];

type Rdv = {
  id: number;
  heure_rdv?: string;
  motif?: string;
  statut?: string;
  patient?: { user?: { name?: string } };
};

export default function MedecinDashboardScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/medecin/dashboard');
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

  const updateStatut = async (id: number, statut: string) => {
    try {
      await api.put(`/medecin/rendez-vous/${id}/statut`, { statut });
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Mise à jour impossible');
    }
  };

  const rdvList: Rdv[] = data?.rdv_aujourdhui || data?.rdv_du_jour || [];
  const stats = data?.stats || {};

  return (
    <StaffShell
      title={`Bonjour, ${user?.name?.split(' ')[0] ?? 'Docteur'}`}
      subtitle="Tableau de bord médical"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <>
          <StatGrid
            stats={[
              { label: 'RDV du jour', value: stats.rdv_jour ?? rdvList.length ?? 0 },
              { label: 'Patients suivis', value: stats.patients_suivis ?? '—' },
              { label: 'Prescriptions', value: stats.prescriptions_actives ?? '—' },
              { label: 'File / en cours', value: stats.en_cours ?? data?.file_attente?.length ?? 0 },
            ]}
          />

          <Text style={styles.section}>Rendez-vous du jour</Text>
          {rdvList.length === 0 ? (
            <EmptyState icon="calendar-outline" title="Aucun RDV aujourd'hui" />
          ) : (
            rdvList.map((rdv) => (
              <MedicalCard key={rdv.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{rdv.patient?.user?.name ?? 'Patient'}</Text>
                    <Text style={styles.meta}>
                      {String(rdv.heure_rdv || '').slice(0, 5)} · {rdv.motif || 'Consultation'}
                    </Text>
                    <StatusBadge statut={rdv.statut} />
                  </View>
                </View>
                <View style={styles.actions}>
                  {rdv.statut !== 'en_cours' && rdv.statut !== 'termine' ? (
                    <Pressable style={styles.btnPrimary} onPress={() => updateStatut(rdv.id, 'en_cours')}>
                      <Text style={styles.btnPrimaryText}>Démarrer</Text>
                    </Pressable>
                  ) : null}
                  {rdv.statut !== 'termine' && rdv.statut !== 'absent' ? (
                    <Pressable style={styles.btnGhost} onPress={() => updateStatut(rdv.id, 'termine')}>
                      <Text style={styles.btnGhostText}>Terminer</Text>
                    </Pressable>
                  ) : null}
                  {['confirme', 'en_attente'].includes(rdv.statut || '') ? (
                    <Pressable style={styles.btnGhost} onPress={() => updateStatut(rdv.id, 'absent')}>
                      <Text style={styles.btnGhostText}>Absent</Text>
                    </Pressable>
                  ) : null}
                </View>
              </MedicalCard>
            ))
          )}

          <Pressable style={styles.linkCard} onPress={() => router.push('/(medecin)/dossiers')}>
            <Text style={styles.linkTitle}>Consultations / dossiers</Text>
            <Text style={styles.linkSub}>Ouvrir la file de consultation</Text>
          </Pressable>
        </>
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 8 },
  card: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginVertical: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnGhost: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  btnGhostText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  linkCard: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 4,
  },
  linkTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkSub: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 13 },
});
