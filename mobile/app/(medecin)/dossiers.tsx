import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import StatusBadge from '@/src/components/staff/StatusBadge';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(medecin)' },
  { label: 'Planning', icon: 'calendar' as const, href: '/(medecin)/planning' },
  { label: 'Patients', icon: 'people' as const, href: '/(medecin)/patients' },
  { label: 'Dossiers', icon: 'folder' as const, href: '/(medecin)/dossiers', active: true },
  { label: 'Téléconsult.', icon: 'videocam' as const, href: '/(medecin)/teleconsultation' },
];

export default function MedecinDossiersScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/medecin/dossiers');
      setItems(res.data.data || []);
    } catch {
      setItems([]);
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
      title="Consultations"
      subtitle="Dossiers et file du jour"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="folder-open-outline"
          title="Aucun dossier"
          text="Les admissions / consultations du jour apparaîtront ici."
        />
      ) : (
        items.map((d) => (
          <MedicalCard key={d.id} style={styles.card}>
            <Text style={styles.name}>{d.patient?.user?.name || d.patient_nom || 'Patient'}</Text>
            <Text style={styles.meta}>{d.motif_arrivee || d.motif || d.diagnostic || 'Consultation'}</Text>
            <StatusBadge statut={d.statut || d.statut_parcours} />
          </MedicalCard>
        ))
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
});
