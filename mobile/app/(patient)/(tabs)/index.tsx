import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AnimatedCard } from '@/src/components/ui/AnimatedScreen';
import GradientHero from '@/src/components/ui/GradientHero';
import MedicalCard from '@/src/components/ui/MedicalCard';
import StatCard from '@/src/components/ui/StatCard';
import { images } from '@/src/constants/images';
import { colors, radius, statutColors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

type Rdv = {
  id: number;
  date_rdv: string;
  heure_rdv: string;
  statut: string;
  motif?: string;
  medecin?: { user?: { name?: string } };
};

type Facture = {
  id: number;
  statut: string;
  montant_total: number;
};

export default function PatientHomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rdvList, setRdvList] = useState<Rdv[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);

  const load = async () => {
    try {
      const [rdvRes, factRes] = await Promise.all([
        api.get('/patient/rendez-vous'),
        api.get('/patient/factures'),
      ]);
      setRdvList(rdvRes.data.data || []);
      setFactures(factRes.data.data || []);
    } catch {
      // silencieux — stats à 0
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const prochains = rdvList.filter((r) => ['confirme', 'en_attente'].includes(r.statut));
  const impayees = factures.filter((f) => ['emise', 'partiellement_payee'].includes(f.statut));
  const prochain = prochains[0];

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <GradientHero
        imageUri={images.heroDashboard}
        title={`Bonjour, ${user?.name?.split(' ')[0] ?? 'Patient'} 👋`}
        subtitle="Votre santé, notre priorité absolue"
        height={200}
      />

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            <View style={styles.statsRow}>
              <AnimatedCard delay={100}>
                <StatCard
                  icon="calendar"
                  label="Prochains RDV"
                  value={prochains.length}
                  subtitle="à venir"
                  gradient={['#0284c7', '#0ea5e9']}
                />
              </AnimatedCard>
              <AnimatedCard delay={180}>
                <StatCard
                  icon="wallet"
                  label="Factures"
                  value={impayees.length}
                  subtitle="en attente"
                  gradient={['#0f766e', '#14b8a6']}
                />
              </AnimatedCard>
            </View>

            <AnimatedCard delay={260}>
              <Pressable
                onPress={() => router.push('/(patient)/(tabs)/rdv')}
                style={styles.ctaWrap}
              >
                <LinearGradient colors={['#0369a1', '#0d9488']} style={styles.cta}>
                  <View>
                    <Text style={styles.ctaTitle}>Prendre un rendez-vous</Text>
                    <Text style={styles.ctaSub}>Consultation en quelques clics</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={36} color="rgba(255,255,255,0.9)" />
                </LinearGradient>
              </Pressable>
            </AnimatedCard>

            {prochain ? (
              <AnimatedCard delay={340}>
                <MedicalCard>
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionTitle}>Prochain rendez-vous</Text>
                    <View style={[styles.badge, { backgroundColor: statutColors[prochain.statut]?.bg }]}>
                      <Text style={[styles.badgeText, { color: statutColors[prochain.statut]?.text }]}>
                        {prochain.statut.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.rdvDate}>
                    {prochain.date_rdv} · {prochain.heure_rdv}
                  </Text>
                  <Text style={styles.rdvDoctor}>
                    {prochain.medecin?.user?.name ?? 'Médecin AMEN'}
                  </Text>
                  {prochain.motif ? <Text style={styles.rdvMotif}>{prochain.motif}</Text> : null}
                </MedicalCard>
              </AnimatedCard>
            ) : null}

            <AnimatedCard delay={420}>
              <Text style={styles.sectionTitle}>Services rapides</Text>
              <View style={styles.quickGrid}>
                {[
                  { icon: 'document-text' as const, label: 'Dossier', route: '/(patient)/(tabs)/profil' },
                  { icon: 'medkit' as const, label: 'Ordonnances', route: '/(patient)/(tabs)/profil' },
                  { icon: 'videocam' as const, label: 'Téléconsult.', route: '/(patient)/(tabs)/rdv' },
                  { icon: 'notifications' as const, label: 'Alertes', route: '/(patient)/(tabs)/profil' },
                ].map((item) => (
                  <Pressable
                    key={item.label}
                    style={styles.quickItem}
                    onPress={() => router.push(item.route as never)}
                  >
                    <View style={styles.quickIcon}>
                      <Ionicons name={item.icon} size={22} color={colors.primary} />
                    </View>
                    <Text style={styles.quickLabel}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </AnimatedCard>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20, gap: 18, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  ctaWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: radius.lg,
  },
  ctaTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  ctaSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  rdvDate: { fontSize: 15, fontWeight: '700', color: colors.primary },
  rdvDoctor: { fontSize: 14, color: colors.text, marginTop: 6, fontWeight: '600' },
  rdvMotif: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  quickItem: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
});
