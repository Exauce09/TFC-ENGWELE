import { Redirect } from 'expo-router';

import LoadingScreen from '@/src/components/LoadingScreen';
import { getHomeRoute } from '@/src/constants/roles';
import { useAuth } from '@/src/context/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={getHomeRoute(user.role) as never} />;
}
