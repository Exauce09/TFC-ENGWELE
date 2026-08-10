import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeInDown } from 'react-native-reanimated';

import MedicalCard from '@/src/components/ui/MedicalCard';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { colors, radius, statutColors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

type Salle = {
  id: number;
  date_rdv: string;
  heure_rdv: string;
  statut: string;
  paiement_statut?: string;
  room_name?: string;
  salle_url?: string;
  motif?: string;
  medecin?: { user?: { name?: string } };
  departement?: { nom?: string };
};

export default function PatientTeleconsultationScreen() {
  const { user } = useAuth();
  const [salles, setSalles] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/teleconsultation');
      setSalles(res.data.data || []);
    } catch {
      setSalles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rejoindre = async (salle: Salle) => {
    if (salle.paiement_statut && salle.paiement_statut !== 'paye') {
      Alert.alert('Paiement requis', 'Réglez d\'abord la téléconsultation depuis Factures / RDV.');
      return;
    }
    setJoining(salle.id);
    try {
      const res = await api.post(`/teleconsultation/${salle.id}/rejoindre`);
      const url = res.data.data?.room_url || salle.salle_url;
      if (!url) {
        Alert.alert('Erreur', 'Salle indisponible');
        return;
      }
      await WebBrowser.openBrowserAsync(url);
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Connexion impossible');
    } finally {
      setJoining(null);
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: 'Téléconsultation', headerBackTitle: 'Retour' }} />
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
        <Text style={styles.hint}>Connecté en tant que {user?.name}</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : salles.length === 0 ? (
          <MedicalCard style={styles.empty}>
            <Ionicons name="videocam-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Aucune salle</Text>
            <Text style={styles.emptyText}>Réservez un RDV de type téléconsultation.</Text>
          </MedicalCard>
        ) : (
          salles.map((s, i) => (
            <Animated.View key={s.id} entering={FadeInDown.delay(i * 50).springify()}>
              <MedicalCard style={styles.card}>
                <View style={styles.head}>
                  <View style={styles.icon}>
                    <Ionicons name="videocam" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.date}>
                      {s.date_rdv} · {String(s.heure_rdv).slice(0, 5)}
                    </Text>
                    <Text style={styles.doc}>{s.medecin?.user?.name || 'Médecin'}</Text>
                    {s.room_name ? <Text style={styles.room}>{s.room_name}</Text> : null}
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: statutColors[s.statut]?.bg || '#f1f5f9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: statutColors[s.statut]?.text || colors.textMuted },
                      ]}
                    >
                      {s.statut?.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <PrimaryButton
                  label={joining === s.id ? 'Ouverture…' : 'Rejoindre la salle'}
                  onPress={() => void rejoindre(s)}
                  loading={joining === s.id}
                  disabled={joining !== null}
                />
                {s.salle_url ? (
                  <Pressable onPress={() => Linking.openURL(s.salle_url!)}>
                    <Text style={styles.openExt}>Ouvrir le lien</Text>
                  </Pressable>
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
  list: { padding: 20, gap: 12, paddingBottom: 40 },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  card: { gap: 12 },
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: { fontSize: 14, fontWeight: '800', color: colors.text },
  doc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  room: { fontSize: 10, fontFamily: undefined, color: colors.textLight, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  openExt: { textAlign: 'center', fontSize: 12, color: colors.primary, fontWeight: '600' },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
