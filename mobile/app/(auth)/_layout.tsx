import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: '#0d9488',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Connexion' }} />
      <Stack.Screen name="register" options={{ title: 'Inscription' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Mot de passe oublié' }} />
    </Stack>
  );
}
