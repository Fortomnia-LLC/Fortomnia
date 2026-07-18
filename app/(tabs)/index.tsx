import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
 import { useAuth } from "../../src/providers/AuthProvider";

export default function App() {
  const { signOut } = useAuth();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.logoContainer}>
        <Text style={styles.logo}>⚒️</Text>
        <Text style={styles.title}>IRONFORGE</Text>
        <Text style={styles.tagline}>Forge Your Strongest Self</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome, Greg 👋</Text>
        <Text style={styles.cardText}>
          IronForge is officially alive!
        </Text>
      </View>     
        <Pressable
        onPress={() => void signOut()}
        style={styles.signOutButton}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0B0B",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },

  logo: {
    fontSize: 60,
    marginBottom: 16,
  },

  title: {
    color: "#F97316",
    fontSize: 36,
    fontWeight: "bold",
    letterSpacing: 3,
  },

  tagline: {
    color: "#9CA3AF",
    marginTop: 10,
    fontSize: 18,
  },

  card: {
    width: "100%",
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 24,
  },

  cardTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 10,
  },

  cardText: {
    color: "#D1D5DB",
    fontSize: 16,
  },
  signOutButton: {
    borderColor: "#F97316",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  signOutText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "600",
  },
});
