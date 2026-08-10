import { useEffect } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROLE_LABELS, getHomeRoute } from '@/src/constants/roles';
import { colors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';

/** Écran de secours si un rôle n'a pas encore d'espace dédié. */
export default function StaffHomeScreen() {
  const { user, logout } = useAuth();

  useEffect(() => {
    const home = getHomeRoute(user?.role);
    if (home !== '/(app)/home') {
      router.replace(home as never);
    }
  }, [user?.role]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Bonjour, {user?.name}</Text>
      <Text style={styles.role}>{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Espace non configuré</Text>
        <Text style={styles.cardText}>
          Votre rôle n'a pas encore d'écran mobile dédié. Utilisez la plateforme web pour les
          opérations avancées.
        </Text>
      </View>
      <Pressable style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12, backgroundColor: colors.background },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  role: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  card: {
    marginTop: 8,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardText: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  logout: {
    marginTop: 'auto',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#b91c1c', fontWeight: '700' },
});
