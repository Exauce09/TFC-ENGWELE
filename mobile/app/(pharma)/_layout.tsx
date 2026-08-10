import { Stack } from 'expo-router';

import { RoleGuard } from '@/src/components/staff/RoleGuard';

export default function PharmaLayout() {
  return (
    <RoleGuard allowed={['pharmacien']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
