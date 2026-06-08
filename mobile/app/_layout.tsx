import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initOneSignal } from "@/lib/onesignal";

export default function RootLayout() {
  useEffect(() => {
    initOneSignal();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0d0d0d" },
          headerTintColor: "#F1C42D",
          contentStyle: { backgroundColor: "#0d0d0d" },
        }}
      />
    </SafeAreaProvider>
  );
}
