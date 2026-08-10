import { Stack } from 'expo-router';

import { RoleGuard } from '@/src/components/staff/RoleGuard';

export default function MedecinLayout() {
  return (
    <RoleGuard allowed="medecin">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
