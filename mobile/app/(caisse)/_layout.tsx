import { Stack } from 'expo-router';

import { RoleGuard } from '@/src/components/staff/RoleGuard';

export default function CaisseLayout() {
  return (
    <RoleGuard allowed={['caissier']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
