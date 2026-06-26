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

const DEMO_ACCOUNTS = [
  { label: 'Patient', email: 'patient@amen.cd' },
  { label: 'Médecin', email: 'medecin@amen.cd' },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('patient@amen.cd');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const route = await login(email.trim(), password);
      router.replace(route as never);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      if (!axiosErr.response) {
        setError('Serveur inaccessible. Démarrez le backend (start-backend.ps1).');
      } else {
        setError(axiosErr.response?.data?.message || 'Email ou mot de passe incorrect.');
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
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.title}>Centre Médical AMEN</Text>
          <Text style={styles.subtitle}>FOSPHA ONGD/ASBL · Kinshasa</Text>
        </View>

        <View style={styles.card}>
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="exemple@amen.cd"
          />
          <FormField
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{submitting ? 'Connexion...' : 'Se connecter'}</Text>
          </Pressable>

          <View style={styles.links}>
            <Link href="/(auth)/forgot-password" style={styles.link}>
              Mot de passe oublié ?
            </Link>
            <Link href="/(auth)/register" style={styles.link}>
              Créer un compte patient
            </Link>
          </View>
        </View>

        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Comptes démo (Password@123)</Text>
          {DEMO_ACCOUNTS.map((account) => (
            <Pressable
              key={account.email}
              style={styles.demoChip}
              onPress={() => {
                setEmail(account.email);
                setPassword('Password@123');
              }}
            >
              <Text style={styles.demoChipText}>{account.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 20,
    backgroundColor: colors.background,
  },
  hero: { alignItems: 'center', paddingTop: 12, gap: 8 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  links: { gap: 10, marginTop: 4 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  demo: { gap: 8 },
  demoTitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  demoChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  demoChipText: { color: '#0369a1', fontSize: 13, fontWeight: '600' },
});
