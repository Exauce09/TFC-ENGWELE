import { Stack } from 'expo-router';

import { RoleGuard } from '@/src/components/staff/RoleGuard';

export default function InfirmierLayout() {
  return (
    <RoleGuard allowed={['infirmier']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
