import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { colors, shadows } from '@/src/constants/theme';

function TabIcon({
  name,
  color,
  focused,
}: {
  name: 'home' | 'calendar' | 'wallet' | 'person';
  color: string;
  focused: boolean;
}) {
  const icons = {
    home: focused ? 'home' : 'home-outline',
    calendar: focused ? 'calendar' : 'calendar-outline',
    wallet: focused ? 'wallet' : 'wallet-outline',
    person: focused ? 'person' : 'person-outline',
  } as const;
  return <Ionicons name={icons[name]} size={24} color={color} />;
}

export default function PatientTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        headerShown: false,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rdv"
        options={{
          title: 'RDV',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar" color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="factures"
        options={{
          title: 'Factures',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="wallet" color={String(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" color={String(color)} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    ...shadows.card,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
