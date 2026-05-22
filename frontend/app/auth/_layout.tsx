import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
      <Stack.Screen name="name" options={{ title: "Full Name" }} />
      <Stack.Screen name="details" options={{ title: "Additional Details" }} />
      <Stack.Screen name="contacts-permission" options={{ title: "Connect with Friends" }} />
      <Stack.Screen name="login" options={{ title: "Login" }} />
    </Stack>
  );
}
