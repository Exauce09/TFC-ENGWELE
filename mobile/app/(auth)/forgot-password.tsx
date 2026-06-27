import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import FormField from '@/src/components/FormField';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import MedicalCard from '@/src/components/ui/MedicalCard';
import { colors, radius } from '@/src/constants/theme';
import api from '@/src/services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/forgot-password', { email: email.trim() });
      setSuccess(res.data?.message || 'Demande envoyée. Vérifiez votre email.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Impossible de traiter la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.springify()}>
        <MedicalCard>
          <Text style={styles.intro}>
            Entrez votre email. Si le compte existe, un message de réinitialisation sera envoyé.
          </Text>

          <FormField
            label="Adresse email"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="exemple@amen.cd"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <PrimaryButton label="Envoyer le lien" onPress={submit} loading={loading} />

          <Link href="/(auth)/login" style={styles.link}>
            Retour à la connexion
          </Link>
        </MedicalCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 8 },
  error: { color: colors.error, backgroundColor: colors.errorBg, padding: 10, borderRadius: radius.sm, fontSize: 13 },
  success: { color: colors.success, backgroundColor: colors.successBg, padding: 10, borderRadius: radius.sm, fontSize: 13 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 12 },
});
