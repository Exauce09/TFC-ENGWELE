import { Redirect, Stack } from 'expo-router';

import LoadingScreen from '@/src/components/LoadingScreen';
import { useAuth } from '@/src/context/AuthContext';

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role === 'patient') {
    return <Redirect href="/(patient)/(tabs)" />;
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
