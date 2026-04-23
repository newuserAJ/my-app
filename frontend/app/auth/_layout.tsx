import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="name" />
      <Stack.Screen name="focus" />
      <Stack.Screen name="hub" />
      <Stack.Screen name="network" />
      <Stack.Screen name="details" />
      <Stack.Screen name="login" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
