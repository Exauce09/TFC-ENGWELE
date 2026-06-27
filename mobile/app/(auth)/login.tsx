import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import FormField from '@/src/components/FormField';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { images } from '@/src/constants/images';
import { colors, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Patient', email: 'patient@amen.cd' },
  { label: 'Médecin', email: 'medecin@amen.cd' },
];

const FEATURES = [
  '📅 Rendez-vous en ligne',
  '📋 Dossier médical',
  '💊 Ordonnances',
  '💵 Mobile Money',
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
        setError('Serveur inaccessible. Vérifiez le backend et le Wi-Fi.');
      } else {
        setError(axiosErr.response?.data?.message || 'Email ou mot de passe incorrect.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: images.heroLogin }} style={styles.heroImage} resizeMode="cover">
        <LinearGradient colors={['rgba(15,23,42,0.3)', 'rgba(15,23,42,0.92)']} style={styles.heroGradient}>
          <Animated.View entering={FadeInUp.duration(600)} style={styles.heroContent}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>A</Text>
            </View>
            <Text style={styles.brand}>Centre Médical AMEN</Text>
            <Text style={styles.tagline}>Excellence des soins · Kinshasa, RDC</Text>
            <View style={styles.features}>
              {FEATURES.map((f, i) => (
                <Animated.Text
                  key={f}
                  entering={FadeInDown.delay(200 + i * 80).duration(400)}
                  style={styles.featureText}
                >
                  {f}
                </Animated.Text>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>
      </ImageBackground>

      <KeyboardAvoidingView
        style={styles.formArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
            <Text style={styles.cardTitle}>Connexion sécurisée</Text>
            <Text style={styles.cardSub}>Accédez à votre espace patient</Text>

            <FormField
              label="Adresse email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="exemple@amen.cd"
            />
            <FormField
              label="Mot de passe"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton
              label="Se connecter"
              onPress={handleSubmit}
              loading={submitting}
            />

            <View style={styles.links}>
              <Link href="/(auth)/forgot-password" style={styles.link}>
                Mot de passe oublié ?
              </Link>
              <Link href="/(auth)/register" style={styles.linkBold}>
                Créer un compte patient →
              </Link>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450)} style={styles.demo}>
            <Text style={styles.demoTitle}>Comptes démo · Password@123</Text>
            <View style={styles.demoRow}>
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
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.backgroundDark },
  heroImage: { height: 340, width: '100%' },
  heroGradient: { flex: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: 32 },
  heroContent: { gap: 8 },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  brand: { fontSize: 24, fontWeight: '800', color: '#fff' },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  features: { gap: 4, marginTop: 4 },
  featureText: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  formArea: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  formScroll: { padding: 20, paddingBottom: 40, gap: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  cardSub: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.sm,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  error: { color: colors.error, fontSize: 13, fontWeight: '500' },
  links: { gap: 12, marginTop: 4, alignItems: 'center' },
  link: { color: colors.textMuted, fontSize: 14 },
  linkBold: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  demo: { gap: 10, paddingHorizontal: 4 },
  demoTitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  demoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  demoChip: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  demoChipText: { color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
});
