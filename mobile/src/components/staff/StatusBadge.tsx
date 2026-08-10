import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, statutColors } from '@/src/constants/theme';

export default function StatusBadge({ statut }: { statut?: string }) {
  if (!statut) return null;
  const tone = statutColors[statut] ?? { bg: '#f1f5f9', text: colors.textMuted };
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.text }]}>{statut.replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
