import { Stack } from "expo-router";
import {
  Afacad_400Regular,
  Afacad_600SemiBold,
  Afacad_700Bold,
  useFonts,
} from "@expo-google-fonts/afacad";
import { AuthProvider } from "../src/context/AuthContext";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Afacad-Regular": Afacad_400Regular,
    "Afacad-SemiBold": Afacad_600SemiBold,
    "Afacad-Bold": Afacad_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

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
            animation: "none",
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
