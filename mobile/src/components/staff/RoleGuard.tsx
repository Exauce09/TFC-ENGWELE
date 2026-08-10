import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import LoadingScreen from '@/src/components/LoadingScreen';
import { getHomeRoute, isMedecinRole } from '@/src/constants/roles';
import { useAuth } from '@/src/context/AuthContext';

type Props = {
  children: ReactNode;
  allowed: string[] | 'medecin' | ((role: string) => boolean);
};

export function RoleGuard({ children, allowed }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect href="/(auth)/login" />;

  const ok =
    allowed === 'medecin'
      ? isMedecinRole(user.role)
      : typeof allowed === 'function'
        ? allowed(user.role)
        : allowed.includes(user.role);

  if (!ok) {
    return <Redirect href={getHomeRoute(user.role) as never} />;
  }

  return <>{children}</>;
}
