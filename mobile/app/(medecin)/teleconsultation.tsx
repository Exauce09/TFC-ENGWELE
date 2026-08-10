import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import StatusBadge from '@/src/components/staff/StatusBadge';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(medecin)' },
  { label: 'Planning', icon: 'calendar' as const, href: '/(medecin)/planning' },
  { label: 'Patients', icon: 'people' as const, href: '/(medecin)/patients' },
  { label: 'Dossiers', icon: 'folder' as const, href: '/(medecin)/dossiers' },
  { label: 'Téléconsult.', icon: 'videocam' as const, href: '/(medecin)/teleconsultation', active: true },
];

export default function MedecinTeleconsultScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/teleconsultation');
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

  const rejoindre = async (id: number) => {
    try {
      const res = await api.post(`/teleconsultation/${id}/rejoindre`);
      const url = res.data.data?.room_url || res.data.data?.salle_url;
      if (url) await Linking.openURL(url);
      else Alert.alert('Info', 'Lien de salle indisponible');
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Impossible de rejoindre');
    }
  };

  return (
    <StaffShell
      title="Téléconsultation"
      subtitle="Salles vidéo du jour"
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
        <EmptyState icon="videocam-outline" title="Aucune téléconsultation" />
      ) : (
        items.map((item) => (
          <MedicalCard key={item.id} style={styles.card}>
            <Text style={styles.name}>
              {item.patient?.user?.name || item.medecin?.user?.name || `RDV #${item.id}`}
            </Text>
            <Text style={styles.meta}>
              {item.date_rdv} · {String(item.heure_rdv || '').slice(0, 5)}
            </Text>
            <StatusBadge statut={item.statut} />
            <Pressable style={styles.btn} onPress={() => rejoindre(item.id)}>
              <Text style={styles.btnText}>Rejoindre la salle</Text>
            </Pressable>
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
  btn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
