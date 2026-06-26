import { Redirect, Stack } from 'expo-router';

import LoadingScreen from '@/src/components/LoadingScreen';
import { useAuth } from '@/src/context/AuthContext';

export default function PatientLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role !== 'patient') {
    return <Redirect href="/(app)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
