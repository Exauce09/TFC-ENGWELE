import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';

export default function PatientHomeScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Bonjour, {user?.name?.split(' ')[0] ?? 'Patient'}</Text>
      <Text style={styles.subtitle}>Bienvenue sur l'application mobile AMEN.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Phase 1 — à venir</Text>
        <Text style={styles.cardText}>
          Dashboard patient : prochains RDV, factures impayées et notifications.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12, backgroundColor: colors.background },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted },
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
});
