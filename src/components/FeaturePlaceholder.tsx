import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type FeaturePlaceholderProps = {
  description: string;
  icon: string;
  title: string;
};

export function FeaturePlaceholder({
  description,
  icon,
  title,
}: FeaturePlaceholderProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>IRONFORGE</Text>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Coming next</Text>
          <Text style={styles.cardText}>
            This section is ready for its first functional milestone.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#0B0B0B",
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 24,
  },
  icon: {
    fontSize: 54,
    marginBottom: 18,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
  },
  description: {
    color: "#9CA3AF",
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 30,
    marginTop: 10,
  },
  card: {
    backgroundColor: "#1A1A1A",
    borderColor: "#2A2A2A",
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardText: {
    color: "#D1D5DB",
    fontSize: 15,
    lineHeight: 22,
  },
});
