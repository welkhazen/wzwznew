import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { requestPushPermission } from "@/lib/onesignal";

export default function Home() {
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const handleEnablePush = async () => {
    try {
      const granted = await requestPushPermission();
      setPushStatus(granted ? "Push enabled" : "Push denied");
    } catch (error) {
      setPushStatus(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>raW</Text>
      <Text style={styles.subtitle}>Find your people. Grow behind your avatar.</Text>

      <Pressable style={styles.button} onPress={handleEnablePush}>
        <Text style={styles.buttonText}>Enable notifications</Text>
      </Pressable>

      {pushStatus ? <Text style={styles.status}>{pushStatus}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0d0d0d",
  },
  title: {
    color: "#F1C42D",
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: 6,
  },
  subtitle: {
    color: "#a8a8a8",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  button: {
    marginTop: 40,
    backgroundColor: "#F1C42D",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
  },
  buttonText: {
    color: "#0d0d0d",
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontSize: 12,
  },
  status: {
    marginTop: 24,
    color: "#cbd5e1",
    fontSize: 13,
  },
});
