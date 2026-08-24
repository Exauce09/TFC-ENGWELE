import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

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
  const [busyId, setBusyId] = useState<number | null>(null);

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

  const rejoindre = async (item: any) => {
    setBusyId(item.id);
    try {
      if (item.statut === 'en_attente') {
        await api.put(`/medecin/rendez-vous/${item.id}/statut`, { statut: 'confirme' });
      }
      const res = await api.post(`/teleconsultation/${item.id}/rejoindre`);
      const url = res.data.data?.room_url || res.data.data?.salle_url;
      if (url) await Linking.openURL(url);
      else Alert.alert('Info', 'Lien de salle indisponible');
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Impossible de rejoindre');
    } finally {
      setBusyId(null);
    }
  };

  const fermer = async (id: number) => {
    setBusyId(id);
    try {
      await api.post(`/teleconsultation/${id}/fermer`);
      Alert.alert('OK', 'Téléconsultation clôturée');
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Impossible de clôturer');
    } finally {
      setBusyId(null);
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
            <View style={styles.row}>
              <Pressable
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => rejoindre(item)}
                disabled={busyId !== null}
              >
                <Text style={styles.btnText}>
                  {busyId === item.id
                    ? '…'
                    : item.statut === 'en_attente'
                      ? 'Confirmer & ouvrir'
                      : 'Rejoindre'}
                </Text>
              </Pressable>
              {['confirme', 'en_cours'].includes(item.statut) ? (
                <Pressable
                  style={[styles.btn, styles.btnGhost]}
                  onPress={() => fermer(item.id)}
                  disabled={busyId !== null}
                >
                  <Text style={styles.btnGhostText}>Clôturer</Text>
                </Pressable>
              ) : null}
            </View>
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
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  btn: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnGhost: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnGhostText: { color: colors.text, fontWeight: '700', fontSize: 13 },
});
