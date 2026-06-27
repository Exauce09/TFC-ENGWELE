import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import FormField from '@/src/components/FormField';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { colors, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    date_naissance: '1990-01-01',
    sexe: 'M' as 'M' | 'F',
    adresse: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const route = await register({ ...form, role: 'patient' });
      router.replace(route as never);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
      };
      if (!axiosErr.response) {
        setError('Serveur inaccessible.');
      } else {
        const errs = axiosErr.response.data?.errors ?? {};
        const detail = Object.values(errs).flat().join(' ');
        setError(detail || axiosErr.response.data?.message || 'Inscription impossible.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.springify()} style={styles.intro}>
          <Text style={styles.title}>Rejoignez AMEN</Text>
          <Text style={styles.sub}>Créez votre compte patient en quelques minutes.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.form}>
          <FormField label="Nom complet" icon="person-outline" value={form.name} onChangeText={set('name')} />
          <FormField label="Email" icon="mail-outline" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
          <FormField label="Téléphone" icon="call-outline" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <FormField label="Date de naissance (AAAA-MM-JJ)" value={form.date_naissance} onChangeText={set('date_naissance')} />
          <FormField label="Adresse" icon="location-outline" value={form.adresse} onChangeText={set('adresse')} />
          <FormField label="Mot de passe" icon="lock-closed-outline" value={form.password} onChangeText={set('password')} secureTextEntry />
          <FormField label="Confirmer" icon="lock-closed-outline" value={form.password_confirmation} onChangeText={set('password_confirmation')} secureTextEntry />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton label="Créer mon compte" onPress={handleSubmit} loading={submitting} />

          <Link href="/(auth)/login" style={styles.link}>
            Déjà inscrit ? Se connecter
          </Link>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  intro: { gap: 6 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted },
  form: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: { color: colors.error, backgroundColor: colors.errorBg, padding: 10, borderRadius: radius.sm, fontSize: 13 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 8 },
});
