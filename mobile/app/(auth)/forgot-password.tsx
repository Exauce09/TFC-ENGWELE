import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import FormField from '@/src/components/FormField';
import api from '@/src/services/api';
import { colors } from '@/src/constants/theme';

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
      setSuccess(res.data?.message || 'Demande envoyée.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Impossible de traiter la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        Entrez votre email. Si le compte existe, un message de réinitialisation sera envoyé.
      </Text>

      <FormField
        label="Adresse email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="exemple@amen.cd"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={submit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Envoi...' : 'Envoyer le lien'}</Text>
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        Retour à la connexion
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 14, backgroundColor: colors.background },
  intro: { color: colors.textMuted, fontSize: 14 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorBg,
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
  },
  success: {
    color: colors.success,
    backgroundColor: colors.successBg,
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
