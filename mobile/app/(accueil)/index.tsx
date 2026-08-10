import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import StatGrid from '@/src/components/staff/StatGrid';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(accueil)', active: true },
  { label: 'Demandes', icon: 'mail' as const, href: '/(accueil)/demandes' },
  { label: 'RDV jour', icon: 'calendar' as const, href: '/(accueil)/rendez-vous' },
  { label: 'Patients', icon: 'people' as const, href: '/(accueil)/patients' },
];

export default function AccueilDashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sRes, dRes] = await Promise.all([
        api.get('/accueil/dashboard'),
        api.get('/accueil/demandes', { params: { statut: 'nouvelle' } }),
      ]);
      setStats(sRes.data.data || {});
      setDemandes(dRes.data.data || []);
    } catch {
      setStats(null);
      setDemandes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <StaffShell
      title={`Bonjour, ${user?.name?.split(' ')[0] ?? 'Accueil'}`}
      subtitle="Réception"
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
              { label: 'Demandes', value: stats?.demandes_en_attente ?? demandes.length ?? 0 },
              { label: 'RDV du jour', value: stats?.rdv_du_jour ?? stats?.rdv_aujourdhui ?? 0 },
              { label: 'Patients', value: stats?.patients ?? stats?.patients_jour ?? 0 },
              { label: 'Arrivées', value: stats?.arrivees ?? stats?.en_attente ?? 0 },
            ]}
          />
          <Pressable style={styles.cta} onPress={() => router.push('/(accueil)/demandes')}>
            <Text style={styles.ctaText}>Traiter les demandes RDV →</Text>
          </Pressable>
          <Text style={styles.section}>À confirmer</Text>
          {demandes.length === 0 ? (
            <EmptyState icon="mail-open-outline" title="Aucune demande" />
          ) : (
            demandes.slice(0, 6).map((d) => (
              <MedicalCard key={`${d.source}-${d.id}`} style={styles.card}>
                <Text style={styles.name}>{d.nom || d.patient?.user?.name || 'Demande'}</Text>
                <Text style={styles.meta}>
                  {d.date_souhaitee || '—'} · {d.service_libelle || d.message || 'RDV'}
                </Text>
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
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800' },
  section: { fontSize: 16, fontWeight: '800', color: colors.text },
  card: { gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
});
