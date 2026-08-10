import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors } from '@/src/constants/theme';

export default function EmptyState({
  icon = 'folder-open-outline',
  title,
  text,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  text?: string;
}) {
  return (
    <MedicalCard style={styles.card}>
      <Ionicons name={icon} size={40} color={colors.textLight} />
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </MedicalCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  text: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
