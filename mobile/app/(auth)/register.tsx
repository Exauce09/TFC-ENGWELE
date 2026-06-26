import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import FormField from '@/src/components/FormField';
import { colors } from '@/src/constants/theme';
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
        setError('Serveur inaccessible. Démarrez le backend.');
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Créez votre compte patient pour accéder aux rendez-vous, factures et dossier médical.
        </Text>

        <FormField label="Nom complet" value={form.name} onChangeText={set('name')} />
        <FormField
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <FormField label="Téléphone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <FormField
          label="Date de naissance (AAAA-MM-JJ)"
          value={form.date_naissance}
          onChangeText={set('date_naissance')}
        />
        <FormField label="Adresse" value={form.adresse} onChangeText={set('adresse')} />
        <FormField
          label="Mot de passe"
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
        />
        <FormField
          label="Confirmer le mot de passe"
          value={form.password_confirmation}
          onChangeText={set('password_confirmation')}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? 'Création...' : "S'inscrire"}</Text>
        </Pressable>

        <Link href="/(auth)/login" style={styles.link}>
          Déjà un compte ? Se connecter
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 20, gap: 12, backgroundColor: colors.background },
  intro: { color: colors.textMuted, fontSize: 14, marginBottom: 4 },
  error: {
    color: colors.error,
    backgroundColor: colors.errorBg,
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8 },
});
