import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Hotake",
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: "Profile - Hotake",
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            title: "Authentication - Hotake",
            animationEnabled: false,
          }}
        />
        <Stack.Screen
          name="graph"
          options={{
            title: "Network Graph - Hotake",
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
