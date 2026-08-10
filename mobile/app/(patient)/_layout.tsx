import { Redirect, Stack, useSegments } from 'expo-router';

import LoadingScreen from '@/src/components/LoadingScreen';
import { getHomeRoute } from '@/src/constants/roles';
import { useAuth } from '@/src/context/AuthContext';

export default function PatientLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role !== 'patient') {
    return <Redirect href={getHomeRoute(user.role) as never} />;
  }

  const onOnboarding = (segments as string[]).includes('premiere-connexion');
  if (user.needs_onboarding && !onOnboarding) {
    return <Redirect href="/(patient)/premiere-connexion" />;
  }

  return <Stack screenOptions={{ headerShown: false, headerTintColor: '#0284c7' }} />;
}
