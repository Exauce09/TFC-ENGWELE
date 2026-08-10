import { Stack } from 'expo-router';

import { RoleGuard } from '@/src/components/staff/RoleGuard';
import { SPECIALITE_BY_ROLE } from '@/src/constants/roles';

export default function SpecialiteLayout() {
  return (
    <RoleGuard allowed={(role) => !!SPECIALITE_BY_ROLE[role]}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGuard>
  );
}
