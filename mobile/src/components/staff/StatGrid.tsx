import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/src/constants/theme';

type Stat = { label: string; value: string | number };

export default function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <View style={styles.grid}>
      {stats.map((s) => (
        <View key={s.label} style={styles.card}>
          <Text style={styles.value}>{s.value}</Text>
          <Text style={styles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 140,
  },
  value: { fontSize: 24, fontWeight: '800', color: colors.primary },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
});
