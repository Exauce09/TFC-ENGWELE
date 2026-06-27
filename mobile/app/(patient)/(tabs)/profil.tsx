import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import MedicalCard from '@/src/components/ui/MedicalCard';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { colors, gradients, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';

export default function PatientProfilScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'P';

  const rows = [
    { icon: 'person-outline' as const, label: 'Nom complet', value: user?.name },
    { icon: 'mail-outline' as const, label: 'Email', value: user?.email },
    { icon: 'call-outline' as const, label: 'Téléphone', value: user?.phone || '—' },
    { icon: 'shield-checkmark-outline' as const, label: 'Rôle', value: 'Patient' },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient colors={gradients.primary} style={styles.header}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </Animated.View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </LinearGradient>

      <Animated.View entering={FadeInDown.delay(150)} style={styles.cardWrap}>
        <MedicalCard>
          {rows.map((row, i) => (
            <View key={row.label} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
              <View style={styles.rowIcon}>
                <Ionicons name={row.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </MedicalCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(280)} style={styles.logoutWrap}>
        <PrimaryButton label="Se déconnecter" onPress={handleLogout} variant="outline" />
      </Animated.View>

      <Text style={styles.footer}>Centre Médical AMEN · FOSPHA ONGD/ASBL</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  cardWrap: { marginTop: -20, marginHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  rowValue: { fontSize: 15, color: colors.text, fontWeight: '600', marginTop: 2 },
  logoutWrap: { marginHorizontal: 20, marginTop: 8 },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textLight,
    marginTop: 24,
  },
});
