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
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import MedicalCard from '@/src/components/ui/MedicalCard';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

type Notif = {
  id: number;
  titre: string;
  message: string;
  lu?: boolean;
  created_at?: string;
  type?: string;
};

export default function PatientNotificationsScreen() {
  const [list, setList] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
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

  const marquerLu = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/lu`);
      setList((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    } catch {
      // ignore
    }
  };

  const toutLire = async () => {
    try {
      await api.put('/notifications/tout-lire');
      setList((prev) => prev.map((n) => ({ ...n, lu: true })));
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: 'Notifications', headerBackTitle: 'Retour' }} />
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
        {list.some((n) => !n.lu) ? (
          <PrimaryButton label="Tout marquer comme lu" onPress={() => void toutLire()} variant="outline" />
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : list.length === 0 ? (
          <MedicalCard style={styles.empty}>
            <Ionicons name="notifications-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
          </MedicalCard>
        ) : (
          list.map((n, i) => (
            <Animated.View key={n.id} entering={FadeInDown.delay(i * 40).springify()}>
              <Pressable onPress={() => !n.lu && void marquerLu(n.id)}>
                <MedicalCard style={!n.lu ? { ...styles.card, ...styles.unread } : styles.card}>
                  <View style={styles.row}>
                    <View style={[styles.dot, n.lu && styles.dotRead]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{n.titre}</Text>
                      <Text style={styles.msg}>{n.message}</Text>
                      {n.created_at ? (
                        <Text style={styles.time}>
                          {new Date(n.created_at).toLocaleString('fr-FR')}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </MedicalCard>
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 20, gap: 10, paddingBottom: 40 },
  card: {},
  unread: { borderColor: colors.primaryLight, borderWidth: 1 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  dotRead: { backgroundColor: colors.border },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  msg: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  time: { fontSize: 11, color: colors.textLight, marginTop: 6 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
});
