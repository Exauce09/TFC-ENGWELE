import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import MedicalCard from '@/src/components/ui/MedicalCard';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { colors, gradients, radius } from '@/src/constants/theme';
import { HOSPITAL } from '@/src/constants/hospital';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

const LINKS = [
  { icon: 'document-text-outline' as const, label: 'Mon dossier', route: '/(patient)/dossier' },
  { icon: 'medkit-outline' as const, label: 'Prescriptions', route: '/(patient)/prescriptions' },
  { icon: 'videocam-outline' as const, label: 'Téléconsultation', route: '/(patient)/teleconsultation' },
  { icon: 'notifications-outline' as const, label: 'Notifications', route: '/(patient)/notifications' },
];

export default function PatientProfilScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: '',
    password_confirmation: '',
  });

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        name: form.name.trim(),
        phone: form.phone.trim(),
      };
      if (form.password) {
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }
      await api.put('/profile', payload);
      await refreshUser?.();
      setEditing(false);
      setForm((f) => ({ ...f, password: '', password_confirmation: '' }));
      Alert.alert('OK', 'Profil mis à jour');
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || 'Mise à jour impossible');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'P';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient colors={gradients.primary} style={styles.header}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </Animated.View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </LinearGradient>

      <Animated.View entering={FadeInDown.delay(100)} style={styles.cardWrap}>
        <MedicalCard>
          {LINKS.map((l, i) => (
            <Pressable
              key={l.label}
              onPress={() => router.push(l.route as never)}
              style={[styles.linkRow, i < LINKS.length - 1 && styles.rowBorder]}
            >
              <View style={styles.rowIcon}>
                <Ionicons name={l.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.linkLabel}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </Pressable>
          ))}
        </MedicalCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180)} style={styles.cardWrap}>
        <MedicalCard>
          <View style={styles.editHead}>
            <Text style={styles.section}>Compte</Text>
            <Pressable onPress={() => setEditing((v) => !v)}>
              <Text style={styles.editBtn}>{editing ? 'Fermer' : 'Modifier'}</Text>
            </Pressable>
          </View>

          {editing ? (
            <View style={styles.form}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                value={form.name}
                onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                style={styles.input}
              />
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                value={form.phone}
                onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
                style={styles.input}
                keyboardType="phone-pad"
              />
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <TextInput
                value={form.password}
                onChangeText={(t) => setForm((f) => ({ ...f, password: t }))}
                style={styles.input}
                secureTextEntry
                placeholder="Laisser vide pour ne pas changer"
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.label}>Confirmer</Text>
              <TextInput
                value={form.password_confirmation}
                onChangeText={(t) => setForm((f) => ({ ...f, password_confirmation: t }))}
                style={styles.input}
                secureTextEntry
              />
              <PrimaryButton
                label={saving ? 'Enregistrement…' : 'Enregistrer'}
                onPress={() => void save()}
                loading={saving}
              />
            </View>
          ) : (
            <>
              <View style={[styles.row, styles.rowBorder]}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{user?.email}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Téléphone</Text>
                <Text style={styles.rowValue}>{user?.phone || '—'}</Text>
              </View>
            </>
          )}
        </MedicalCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(280)} style={styles.logoutWrap}>
        <PrimaryButton label="Se déconnecter" onPress={handleLogout} variant="outline" />
      </Animated.View>

      <Text style={styles.footer}>
        {HOSPITAL.name} · {HOSPITAL.legalName}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  cardWrap: { marginTop: 16, marginHorizontal: 20 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  editHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  section: { fontSize: 15, fontWeight: '800', color: colors.text },
  editBtn: { fontSize: 13, fontWeight: '700', color: colors.primary },
  form: { gap: 6, marginTop: 8 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#fff',
  },
  row: { paddingVertical: 12 },
  rowLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  rowValue: { fontSize: 15, color: colors.text, fontWeight: '600', marginTop: 2 },
  logoutWrap: { marginHorizontal: 20, marginTop: 16 },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textLight,
    marginTop: 24,
  },
});
