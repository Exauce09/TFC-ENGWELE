import { Stack } from 'expo-router';

import { RoleGuard } from '@/src/components/staff/RoleGuard';

export default function LaboLayout() {
  return (
    <RoleGuard allowed={['laborantin']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
