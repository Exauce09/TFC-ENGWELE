import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';

import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { getHomeRoute } from '@/src/constants/roles';
import { colors, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

export default function PremiereConnexionScreen() {
  const { user, setCurrentUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    phone: '',
    date_naissance: '',
    sexe: 'F',
    adresse: '',
    commune: 'Matete',
    ville: 'Kinshasa',
    contact_urgence_nom: '',
    contact_urgence_tel: '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/me');
        if (cancelled) return;
        const u = res.data.data;
        const p = u.patient || {};
        setForm((f) => ({
          ...f,
          phone: u.phone || '',
          date_naissance: p.date_naissance ? String(p.date_naissance).slice(0, 10) : '',
          sexe: p.sexe || 'F',
          adresse: p.adresse || '',
          commune: p.commune || 'Matete',
          ville: p.ville || 'Kinshasa',
          contact_urgence_nom: p.contact_urgence_nom || '',
          contact_urgence_tel: p.contact_urgence_tel || '',
        }));
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== 'patient') return <Redirect href={getHomeRoute(user.role) as never} />;

  const submit = async () => {
    if (!form.password || form.password !== form.password_confirmation) {
      Alert.alert('Mot de passe', 'Les mots de passe doivent correspondre.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.post('/patient/premiere-connexion', form);
      const next = res.data.data;
      if (next) setCurrentUser({ ...user, ...next, needs_onboarding: false });
      await refreshUser();
      router.replace('/(patient)/(tabs)');
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Impossible de finaliser');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>Centre Médical AMEN</Text>
      <Text style={styles.title}>Première connexion</Text>
      <Text style={styles.sub}>
        Complétez votre profil patient et choisissez un nouveau mot de passe.
      </Text>

      {(
        [
          ['phone', 'Téléphone'],
          ['date_naissance', 'Date naissance (AAAA-MM-JJ)'],
          ['sexe', 'Sexe (M/F)'],
          ['adresse', 'Adresse'],
          ['commune', 'Commune'],
          ['ville', 'Ville'],
          ['contact_urgence_nom', 'Contact urgence (nom)'],
          ['contact_urgence_tel', 'Contact urgence (tél)'],
          ['password', 'Nouveau mot de passe'],
          ['password_confirmation', 'Confirmer mot de passe'],
        ] as const
      ).map(([key, label]) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            value={(form as any)[key]}
            onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
            style={styles.input}
            secureTextEntry={key.includes('password')}
            placeholderTextColor={colors.textLight}
          />
        </View>
      ))}

      <PrimaryButton label="Valider mon profil" onPress={submit} loading={busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 10, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 8 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: colors.navySoft },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
  },
});
