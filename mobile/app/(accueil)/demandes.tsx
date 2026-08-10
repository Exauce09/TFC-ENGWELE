import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import EmptyState from '@/src/components/staff/EmptyState';
import StaffShell from '@/src/components/staff/StaffShell';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

const NAV = [
  { label: 'Accueil', icon: 'home' as const, href: '/(accueil)' },
  { label: 'Demandes', icon: 'mail' as const, href: '/(accueil)/demandes', active: true },
  { label: 'RDV jour', icon: 'calendar' as const, href: '/(accueil)/rendez-vous' },
  { label: 'Patients', icon: 'people' as const, href: '/(accueil)/patients' },
];

const ONGLETS = [
  { key: 'nouvelle', label: 'À confirmer' },
  { key: 'traitee', label: 'Confirmées' },
  { key: 'annulee', label: 'Refusées' },
];

export default function AccueilDemandesScreen() {
  const [statut, setStatut] = useState('nouvelle');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async (s = statut) => {
    try {
      const res = await api.get('/accueil/demandes', { params: { statut: s } });
      setItems(res.data.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statut]);

  useEffect(() => {
    setLoading(true);
    void load(statut);
  }, [statut, load]);

  const refuser = async (d: any) => {
    setBusyId(d.id);
    try {
      await api.put(`/accueil/demandes/${d.id}`, { statut: 'annulee' });
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Action impossible');
    } finally {
      setBusyId(null);
    }
  };

  const confirmerSimple = async (d: any) => {
    if (d.source !== 'rendez_vous') {
      Alert.alert(
        'Confirmation',
        'Les demandes sans compte nécessitent l’affectation patient/médecin sur le web. Vous pouvez refuser ici.'
      );
      return;
    }
    setBusyId(d.id);
    try {
      await api.post(`/accueil/demandes/${d.id}/confirmer`, {
        medecin_id: d.medecin_id,
        date_rdv: d.date_souhaitee ? String(d.date_souhaitee).slice(0, 10) : undefined,
        heure_rdv: d.heure_rdv ? String(d.heure_rdv).slice(0, 5) : undefined,
        motif: d.message || undefined,
      });
      Alert.alert('OK', 'Demande confirmée');
      void load();
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Confirmation impossible — compléter sur le web');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <StaffShell
      title="Demandes RDV"
      subtitle="Validation des demandes patients"
      nav={NAV}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load();
      }}
    >
      <View style={styles.tabs}>
        {ONGLETS.map((o) => (
          <Pressable
            key={o.key}
            style={[styles.tab, statut === o.key && styles.tabActive]}
            onPress={() => setStatut(o.key)}
          >
            <Text style={[styles.tabText, statut === o.key && styles.tabTextActive]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState icon="mail-outline" title="Aucune demande" />
      ) : (
        items.map((d) => (
          <MedicalCard key={`${d.source}-${d.id}`} style={styles.card}>
            <Text style={styles.name}>{d.nom || d.patient?.user?.name || 'Demande'}</Text>
            <Text style={styles.meta}>
              {d.date_souhaitee || '—'} {d.heure_rdv ? `· ${String(d.heure_rdv).slice(0, 5)}` : ''}
            </Text>
            <Text style={styles.meta}>{d.message || d.service_libelle || d.source}</Text>
            {statut === 'nouvelle' ? (
              <View style={styles.actions}>
                <Pressable
                  style={styles.btnPrimary}
                  disabled={busyId === d.id}
                  onPress={() => confirmerSimple(d)}
                >
                  <Text style={styles.btnPrimaryText}>Confirmer</Text>
                </Pressable>
                <Pressable style={styles.btnGhost} disabled={busyId === d.id} onPress={() => refuser(d)}>
                  <Text style={styles.btnGhostText}>Refuser</Text>
                </Pressable>
              </View>
            ) : null}
          </MedicalCard>
        ))
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#f1f5f9',
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  tabTextActive: { color: '#fff' },
  card: { gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnGhost: {
    backgroundColor: colors.errorBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  btnGhostText: { color: colors.error, fontWeight: '700', fontSize: 13 },
});
