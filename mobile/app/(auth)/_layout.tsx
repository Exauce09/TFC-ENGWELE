import { Stack } from 'expo-router';

import { colors } from '@/src/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen
        name="register"
        options={{
          headerShown: true,
          title: 'Inscription',
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.card },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          title: 'Mot de passe oublié',
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.card },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
