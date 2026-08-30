import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { appleHealthProvider } from "../lib/health/appleHealthProvider";
import { DEFAULT_HEALTH_READ_METRICS } from "../lib/health/healthProvider";
import type { DailyHealthSummary } from "../lib/health/healthTypes";

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function metric(value: number | null | undefined, suffix = "") {
  return value == null ? "—" : `${Math.round(value)}${suffix}`;
}

export default function HealthRecoveryScreen() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DailyHealthSummary | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS !== "ios") { setAvailable(false); setLoading(false); return; }
    try {
      const isAvailable = await appleHealthProvider.isAvailable();
      setAvailable(isAvailable);
      if (isAvailable && connected) setSummary(await appleHealthProvider.readDailySummary(todayKey()));
    } catch (error) {
      console.warn("Unable to refresh Apple Health", error);
    } finally { setLoading(false); }
  }, [connected]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function connect() {
    setLoading(true);
    try {
      const authorization = await appleHealthProvider.requestAuthorization(DEFAULT_HEALTH_READ_METRICS, []);
      if (!authorization.available) { setAvailable(false); return; }
      setConnected(true);
      setSummary(await appleHealthProvider.readDailySummary(todayKey()));
    } catch (error) {
      Alert.alert("Apple Health", "Fortomnia could not connect to Apple Health. You can try again after checking Health permissions in Settings.");
      console.warn(error);
    } finally { setLoading(false); }
  }

  const cards = [
    ["moon-outline", "Sleep", metric(summary?.sleepMinutes ? summary.sleepMinutes / 60 : null, " hr")],
    ["pulse-outline", "Resting HR", metric(summary?.restingHeartRateBpm, " bpm")],
    ["heart-outline", "HRV", metric(summary?.heartRateVariabilityMs, " ms")],
    ["footsteps-outline", "Steps", metric(summary?.steps)],
    ["flame-outline", "Active Energy", metric(summary?.activeEnergyKcal, " kcal")],
    ["barbell-outline", "Workout", metric(summary?.workoutMinutes, " min")],
  ] as const;

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>HEALTH & WEARABLES</Text><Text style={styles.title}>Recovery</Text></View><Ionicons name="watch-outline" size={30} color="#60A5FA" /></View>
    <Text style={styles.subtitle}>Bring your Apple Watch and Apple Health signals into Fortomnia. Your health data stays permission-controlled and is used to build better recovery and training context.</Text>

    <View style={styles.connectionCard}>
      <View style={styles.connectionRow}><View style={styles.appleIcon}><Ionicons name="heart" size={22} color="#F5F5F5" /></View><View style={styles.flex}><Text style={styles.cardTitle}>Apple Health</Text><Text style={styles.muted}>{available === false ? "Not available on this device" : connected ? "Connected for this session" : "Connect to import recovery signals"}</Text></View></View>
      {loading ? <ActivityIndicator style={styles.loader} /> : !connected && available !== false ? <Pressable style={styles.primaryButton} onPress={connect}><Text style={styles.primaryButtonText}>Connect Apple Health</Text></Pressable> : connected ? <Pressable style={styles.secondaryButton} onPress={() => void refresh()}><Ionicons name="refresh" size={16} color="#E5E7EB" /><Text style={styles.secondaryButtonText}>Refresh today's data</Text></Pressable> : null}
    </View>

    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>TODAY'S SIGNALS</Text><Text style={styles.sectionHint}>{connected ? "From authorized Apple Health data" : "Connect Apple Health to populate"}</Text></View>
    <View style={styles.grid}>{cards.map(([icon, label, value]) => <View key={label} style={styles.metricCard}><Ionicons name={icon} size={20} color="#60A5FA" /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>)}</View>

    <View style={styles.insightCard}><Ionicons name="analytics-outline" size={24} color="#A78BFA" /><View style={styles.flex}><Text style={styles.cardTitle}>Recovery Intelligence</Text><Text style={styles.muted}>Next, Fortomnia will compare sleep, resting heart rate, HRV and recent training against your own baseline instead of relying on a generic readiness score.</Text></View></View>
    <Text style={styles.privacy}>Fortomnia only requests health categories needed for features you enable. Apple controls authorization, and you can change access at any time in Health or Settings.</Text>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B0B0B" }, content: { padding: 20, paddingBottom: 44, gap: 16 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, eyebrow: { color: "#60A5FA", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }, title: { color: "#F9FAFB", fontSize: 32, fontWeight: "800", marginTop: 2 }, subtitle: { color: "#9CA3AF", fontSize: 15, lineHeight: 22 }, connectionCard: { backgroundColor: "#141414", borderColor: "#262626", borderWidth: 1, borderRadius: 18, padding: 16, gap: 14 }, connectionRow: { flexDirection: "row", alignItems: "center", gap: 12 }, appleIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#262626", alignItems: "center", justifyContent: "center" }, flex: { flex: 1 }, cardTitle: { color: "#F3F4F6", fontSize: 16, fontWeight: "700", marginBottom: 4 }, muted: { color: "#9CA3AF", fontSize: 13, lineHeight: 19 }, loader: { marginVertical: 8 }, primaryButton: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 13, alignItems: "center" }, primaryButtonText: { color: "white", fontWeight: "800" }, secondaryButton: { borderColor: "#374151", borderWidth: 1, borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, secondaryButtonText: { color: "#E5E7EB", fontWeight: "700" }, sectionHeader: { marginTop: 4 }, sectionTitle: { color: "#D1D5DB", fontSize: 12, fontWeight: "800", letterSpacing: 1 }, sectionHint: { color: "#6B7280", fontSize: 12, marginTop: 4 }, grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 }, metricCard: { width: "48.5%", backgroundColor: "#141414", borderRadius: 16, borderWidth: 1, borderColor: "#242424", padding: 15, gap: 7 }, metricValue: { color: "#F9FAFB", fontSize: 22, fontWeight: "800" }, metricLabel: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" }, insightCard: { flexDirection: "row", gap: 12, backgroundColor: "#17131F", borderColor: "#312445", borderWidth: 1, borderRadius: 16, padding: 16 }, privacy: { color: "#6B7280", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 2 },
});
