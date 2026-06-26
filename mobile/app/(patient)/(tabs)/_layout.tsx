import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { colors } from '@/src/constants/theme';

export default function PatientTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: Platform.select({
          android: { height: 60, paddingBottom: 8 },
          default: {},
        }),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', headerTitle: 'Mon espace' }} />
      <Tabs.Screen name="rdv" options={{ title: 'RDV', headerTitle: 'Rendez-vous' }} />
      <Tabs.Screen name="factures" options={{ title: 'Factures', headerTitle: 'Mes factures' }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', headerTitle: 'Mon profil' }} />
    </Tabs>
  );
}
