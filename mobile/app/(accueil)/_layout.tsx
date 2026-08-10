import { Stack } from 'expo-router';

import { RoleGuard } from '@/src/components/staff/RoleGuard';

export default function AccueilLayout() {
  return (
    <RoleGuard allowed={['receptionniste']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
