import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/constants/theme';

export default function LoadingScreen({ label = 'Chargement...' }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
