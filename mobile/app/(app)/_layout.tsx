import { Redirect, Stack } from 'expo-router';

import LoadingScreen from '@/src/components/LoadingScreen';
import { getHomeRoute } from '@/src/constants/roles';
import { useAuth } from '@/src/context/AuthContext';

/** Fallback pour rôles non mappés — redirige vers l'espace métier. */
export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const home = getHomeRoute(user.role);
  if (home !== '/(app)/home') {
    return <Redirect href={home as never} />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#0d9488',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="home" options={{ title: 'AMEN' }} />
    </Stack>
  );
}
