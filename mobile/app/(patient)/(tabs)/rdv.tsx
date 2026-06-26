import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/constants/theme';

export default function PatientRdvScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes rendez-vous</Text>
      <Text style={styles.text}>Liste et prise de RDV — phase 1.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background, gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  text: { fontSize: 14, color: colors.textMuted },
});
