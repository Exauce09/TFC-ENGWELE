import { Stack } from 'expo-router';

import { RoleGuard } from '@/src/components/staff/RoleGuard';

export default function AdminLayout() {
  return (
    <RoleGuard allowed={['admin']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
