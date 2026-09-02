import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  appleHealthProvider,
  getAppleHealthAuthorizationRequestStatus,
} from "../lib/health/appleHealthProvider";
import { DEFAULT_HEALTH_READ_METRICS } from "../lib/health/healthProvider";
import {
  clearAppleHealthConnection,
  loadAppleHealthConnection,
  saveAppleHealthConnection,
} from "../lib/health/healthConnectionStorage";
import {
  getHealthSyncFreshness,
  shouldRestoreAppleHealth,
} from "../lib/health/healthConnection";
import { getHealthErrorPresentation } from "../lib/health/healthError";
import {
  assessRecoveryBaseline,
  RECOVERY_BASELINE_WINDOW_DAYS,
} from "../lib/health/recoveryBaseline";
import { buildRecoveryPreview } from "../lib/health/recoveryPreview";
import type {
  DailyHealthSummary,
  RecoveryAssessment,
  RecoverySignalStatus,
} from "../lib/health/healthTypes";

type DataMode = "disconnected" | "apple_health" | "preview";

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBefore(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() - amount);
  return dateKey(value);
}

function metric(
  value: number | null | undefined,
  suffix = "",
  fractionDigits = 0,
) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(fractionDigits)}${suffix}`;
}

function comparisonValue(value: number | null, unit: string) {
  if (value == null) return "—";
  if (unit === "min") return `${(value / 60).toFixed(1)} hr`;
  return `${Math.round(value)} ${unit}`;
}

function statusColor(status: RecoverySignalStatus) {
  if (status === "positive") return "#34D399";
  if (status === "caution") return "#FBBF24";
  if (status === "concern") return "#FB7185";
  if (status === "insufficient_data") return "#6B7280";
  return "#60A5FA";
}

function assessmentColor(assessment: RecoveryAssessment) {
  if (assessment.band === "recover") return "#FB7185";
  if (assessment.band === "adjust") return "#FBBF24";
  if (assessment.band === "ready") return "#34D399";
  return "#A78BFA";
}

function lastSyncLabel(value: string | null) {
  const freshness = getHealthSyncFreshness(value);
  if (freshness.status === "never_synced") return "Connected — not synced yet";
  if (freshness.status === "stale") {
    return `Last synced ${new Date(value as string).toLocaleString()} • Refresh recommended`;
  }
  if (freshness.status === "clock_skew") {
    return "Connected — check device date and time";
  }
  return `Last synced ${new Date(value as string).toLocaleString()}`;
}

export default function HealthRecoveryScreen() {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [dataMode, setDataMode] = useState<DataMode>("disconnected");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DailyHealthSummary | null>(null);
  const [assessment, setAssessment] = useState<RecoveryAssessment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const applySummaries = useCallback((summaries: DailyHealthSummary[]) => {
    const today = summaries.at(-1) ?? null;
    setSummary(today);
    setAssessment(today ? assessRecoveryBaseline(today, summaries.slice(0, -1)) : null);
  }, []);

  const loadAppleHealth = useCallback(async () => {
    const today = dateKey();
    const summaries = await appleHealthProvider.readDailySummaries(
      daysBefore(today, RECOVERY_BASELINE_WINDOW_DAYS),
      today,
    );
    applySummaries(summaries);
    const syncedAt = new Date().toISOString();
    setLastSyncedAt(syncedAt);
    void saveAppleHealthConnection(syncedAt).catch((error) => {
      console.warn("Unable to save Apple Health sync metadata", error);
    });
  }, [applySummaries]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (dataMode === "preview") {
        applySummaries(buildRecoveryPreview());
        return;
      }
      if (Platform.OS !== "ios") {
        setAvailable(false);
        return;
      }
      const isAvailable = await appleHealthProvider.isAvailable();
      setAvailable(isAvailable);
      if (isAvailable && dataMode === "apple_health") await loadAppleHealth();
    } catch (error) {
      const healthError = getHealthErrorPresentation(error);
      setErrorMessage(`Apple Health refresh failed: ${healthError.message}`);
      console.warn("Unable to refresh Apple Health", healthError.kind);
    } finally {
      setLoading(false);
    }
  }, [applySummaries, dataMode, loadAppleHealth]);

  useEffect(() => {
    let active = true;

    async function restoreConnection() {
      setLoading(true);
      try {
        if (Platform.OS !== "ios") {
          if (active) setAvailable(false);
          return;
        }

        const isAvailable = await appleHealthProvider.isAvailable();
        if (!active) return;
        setAvailable(isAvailable);
        if (!isAvailable) return;

        const stored = await loadAppleHealthConnection().catch((error) => {
          console.warn("Unable to restore Apple Health sync metadata", error);
          return null;
        });
        const requestStatus = await getAppleHealthAuthorizationRequestStatus();
        if (!active || !shouldRestoreAppleHealth(isAvailable, requestStatus, Boolean(stored))) {
          return;
        }

        if (stored) setLastSyncedAt(stored.lastSyncedAt);
        setDataMode("apple_health");
        await loadAppleHealth();
      } catch (error) {
        void clearAppleHealthConnection().catch((storageError) => {
          console.warn("Unable to clear Apple Health sync metadata", storageError);
        });
        if (active) {
          const healthError = getHealthErrorPresentation(error);
          setDataMode("disconnected");
          setLastSyncedAt(null);
          setErrorMessage(`Apple Health reconnect failed: ${healthError.message}`);
          console.warn("Unable to reconnect Apple Health", healthError.kind);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void restoreConnection();
    return () => {
      active = false;
    };
  }, [loadAppleHealth]);

  async function connect() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const authorization = await appleHealthProvider.requestAuthorization(
        DEFAULT_HEALTH_READ_METRICS,
        [],
      );
      if (!authorization.available) {
        setAvailable(false);
        return;
      }
      await saveAppleHealthConnection(null);
      setDataMode("apple_health");
      await loadAppleHealth();
    } catch (error) {
      const healthError = getHealthErrorPresentation(error);
      setErrorMessage(`Apple Health connection failed: ${healthError.message}`);
      Alert.alert("Apple Health", `Connection failed: ${healthError.message}`);
      console.warn("Unable to connect Apple Health", healthError.kind);
    } finally {
      setLoading(false);
    }
  }

  function disconnect() {
    Alert.alert(
      "Disconnect Apple Health?",
      "Fortomnia will forget this connection and clear the health summary shown here. Apple Health permissions remain under your control in iPhone Settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setLoading(true);
              try {
                await clearAppleHealthConnection();
                setDataMode("disconnected");
                setLastSyncedAt(null);
                setSummary(null);
                setAssessment(null);
                setErrorMessage(null);
              } catch (error) {
                const healthError = getHealthErrorPresentation(error);
                setErrorMessage(`Unable to disconnect Apple Health: ${healthError.message}`);
                console.warn("Unable to disconnect Apple Health", healthError.kind);
              } finally {
                setLoading(false);
              }
            })();
          },
        },
      ],
    );
  }

  function showPreview() {
    setDataMode("preview");
    setErrorMessage(null);
    applySummaries(buildRecoveryPreview());
    setLoading(false);
  }

  const cards = useMemo(
    () => [
      [
        "moon-outline",
        "Sleep",
        metric(
          summary?.sleepMinutes != null ? summary.sleepMinutes / 60 : null,
          " hr",
          1,
        ),
      ],
      ["pulse-outline", "Resting HR", metric(summary?.restingHeartRateBpm, " bpm")],
      ["heart-outline", "HRV", metric(summary?.heartRateVariabilityMs, " ms")],
      ["footsteps-outline", "Steps", metric(summary?.steps)],
      ["flame-outline", "Active Energy", metric(summary?.activeEnergyKcal, " kcal")],
      ["barbell-outline", "Workout", metric(summary?.workoutMinutes, " min")],
    ] as const,
    [summary],
  );

  const hasReadableHealthData = Boolean(
    summary &&
      [
        summary.sleepMinutes,
        summary.restingHeartRateBpm,
        summary.heartRateVariabilityMs,
        summary.steps,
        summary.activeEnergyKcal,
        summary.workoutMinutes,
      ].some((value) => typeof value === "number"),
  );

  const sourceLabel =
    dataMode === "preview"
      ? "Preview data — not your health information"
      : dataMode === "apple_health"
        ? "From authorized Apple Health data"
        : "Connect Apple Health to populate";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel="Back to recovery"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Recovery</Text>
        </Pressable>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>HEALTH & WEARABLES</Text>
            <Text style={styles.title}>Recovery</Text>
          </View>
          <Ionicons name="watch-outline" size={30} color="#60A5FA" />
        </View>
        <Text style={styles.subtitle}>
          Compare today&apos;s Apple Watch signals with your own rolling baseline,
          then use the explanation to guide—not dictate—today&apos;s training.
        </Text>

        <View style={styles.connectionCard}>
          <View style={styles.connectionRow}>
            <View style={styles.appleIcon}>
              <Ionicons name="heart" size={22} color="#F5F5F5" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Apple Health</Text>
              <Text style={styles.muted}>
                {dataMode === "apple_health"
                  ? lastSyncLabel(lastSyncedAt)
                  : available === false
                    ? "Not available on this device"
                    : "Connect to import recovery signals"}
              </Text>
            </View>
          </View>
          {loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : dataMode !== "apple_health" && available !== false ? (
            <Pressable
              accessibilityLabel="Connect Apple Health"
              accessibilityRole="button"
              style={styles.primaryButton}
              onPress={connect}
            >
              <Text style={styles.primaryButtonText}>Connect Apple Health</Text>
            </Pressable>
          ) : dataMode === "apple_health" ? (
            <Pressable
              accessibilityLabel="Refresh Apple Health data"
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={() => void refresh()}
            >
              <Ionicons name="refresh" size={16} color="#E5E7EB" />
              <Text style={styles.secondaryButtonText}>Refresh health data</Text>
            </Pressable>
          ) : null}
          {dataMode === "apple_health" ? (
            <Pressable
              accessibilityLabel="Disconnect Apple Health"
              accessibilityRole="button"
              style={styles.disconnectButton}
              onPress={disconnect}
            >
              <Text style={styles.disconnectButtonText}>Disconnect Apple Health</Text>
            </Pressable>
          ) : null}
          {dataMode !== "preview" ? (
            <Pressable
              accessibilityLabel="Preview recovery intelligence"
              accessibilityRole="button"
              style={styles.previewButton}
              onPress={showPreview}
            >
              <Text style={styles.previewButtonText}>Preview recovery intelligence</Text>
            </Pressable>
          ) : null}
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        {!loading && dataMode === "apple_health" && !hasReadableHealthData ? (
          <View style={styles.dataNotice}>
            <Ionicons name="information-circle-outline" size={20} color="#FBBF24" />
            <Text style={styles.dataNoticeText}>
              Apple Health is connected, but no recent samples were returned. Apple does
              not reveal whether read access was declined or data is unavailable. Check
              Health access in Settings and confirm your watch has synced, then refresh.
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY&apos;S SIGNALS</Text>
          <Text style={styles.sectionHint}>{sourceLabel}</Text>
        </View>
        <View style={styles.grid}>
          {cards.map(([icon, label, value]) => (
            <View key={label} style={styles.metricCard}>
              <Ionicons name={icon} size={20} color="#60A5FA" />
              <Text style={styles.metricValue}>{value}</Text>
              <Text style={styles.metricLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {assessment ? (
          <>
            <View
              style={[
                styles.assessmentCard,
                { borderColor: assessmentColor(assessment) },
              ]}
            >
              <View style={styles.assessmentHeading}>
                <Ionicons
                  name="analytics-outline"
                  size={24}
                  color={assessmentColor(assessment)}
                />
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{assessment.headline}</Text>
                  <Text style={styles.baselineLabel}>
                    {assessment.baselineDays}-day personal baseline
                    {dataMode === "preview" ? " • PREVIEW" : ""}
                  </Text>
                </View>
              </View>
              <Text style={styles.assessmentText}>{assessment.explanation}</Text>
              <View style={styles.recommendationBox}>
                <Text style={styles.recommendationLabel}>TRAINING GUIDANCE</Text>
                <Text style={styles.recommendationText}>
                  {assessment.recommendation}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>WHY FORTOMNIA FLAGGED THIS</Text>
              <Text style={styles.sectionHint}>Today compared with your rolling average</Text>
            </View>
            <View style={styles.comparisonCard}>
              {assessment.comparisons.map((comparison, index) => (
                <View
                  key={comparison.metric}
                  style={[
                    styles.comparisonRow,
                    index < assessment.comparisons.length - 1 && styles.comparisonDivider,
                  ]}
                >
                  <View style={styles.comparisonTopLine}>
                    <Text style={styles.comparisonLabel}>{comparison.label}</Text>
                    <Text style={[styles.comparisonDelta, { color: statusColor(comparison.status) }]}>
                      {comparison.deltaPercentage == null
                        ? `${comparison.observationDays}/7 days`
                        : `${comparison.deltaPercentage > 0 ? "+" : ""}${comparison.deltaPercentage}%`}
                    </Text>
                  </View>
                  <Text style={styles.comparisonValues}>
                    Today {comparisonValue(comparison.current, comparison.unit)} · Baseline {comparisonValue(comparison.baseline, comparison.unit)}
                  </Text>
                  <Text style={styles.comparisonSummary}>{comparison.summary}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.insightCard}>
            <Ionicons name="analytics-outline" size={24} color="#A78BFA" />
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Personal recovery intelligence</Text>
              <Text style={styles.muted}>
                Fortomnia uses 7–28 days of sleep, resting heart rate, and HRV
                to learn your normal range. No generic readiness score is assigned.
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.privacy}>
          Recovery guidance supports training decisions and is not medical advice.
          Apple controls Health authorization, which you can change at any time.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B0B0B" },
  content: { padding: 20, paddingBottom: 44, gap: 16 },
  navigation: { alignSelf: "flex-start" },
  navigationText: { color: "#60A5FA", fontSize: 16, fontWeight: "700" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { color: "#60A5FA", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#F9FAFB", fontSize: 32, fontWeight: "800", marginTop: 2 },
  subtitle: { color: "#9CA3AF", fontSize: 15, lineHeight: 22 },
  connectionCard: { backgroundColor: "#141414", borderColor: "#262626", borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  connectionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  appleIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#262626", alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  cardTitle: { color: "#F3F4F6", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  muted: { color: "#9CA3AF", fontSize: 13, lineHeight: 19 },
  loader: { marginVertical: 8 },
  primaryButton: { backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  primaryButtonText: { color: "white", fontWeight: "800" },
  secondaryButton: { borderColor: "#374151", borderWidth: 1, borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryButtonText: { color: "#E5E7EB", fontWeight: "700" },
  previewButton: { paddingVertical: 7, alignItems: "center" },
  previewButtonText: { color: "#93C5FD", fontSize: 13, fontWeight: "700" },
  disconnectButton: { paddingVertical: 7, alignItems: "center" },
  disconnectButtonText: { color: "#FDA4AF", fontSize: 13, fontWeight: "700" },
  error: { color: "#FDA4AF", backgroundColor: "#2A1218", padding: 12, borderRadius: 10, fontSize: 13, lineHeight: 19 },
  dataNotice: { alignItems: "flex-start", backgroundColor: "#261F0D", borderColor: "#594513", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 10, padding: 12 },
  dataNoticeText: { color: "#FDE68A", flex: 1, fontSize: 13, lineHeight: 19 },
  sectionHeader: { marginTop: 4 },
  sectionTitle: { color: "#D1D5DB", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  sectionHint: { color: "#6B7280", fontSize: 12, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  metricCard: { width: "48.5%", backgroundColor: "#141414", borderRadius: 16, borderWidth: 1, borderColor: "#242424", padding: 15, gap: 7 },
  metricValue: { color: "#F9FAFB", fontSize: 22, fontWeight: "800" },
  metricLabel: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" },
  insightCard: { flexDirection: "row", gap: 12, backgroundColor: "#17131F", borderColor: "#312445", borderWidth: 1, borderRadius: 16, padding: 16 },
  assessmentCard: { backgroundColor: "#141414", borderWidth: 1, borderRadius: 18, padding: 16, gap: 13 },
  assessmentHeading: { flexDirection: "row", gap: 12, alignItems: "center" },
  baselineLabel: { color: "#6B7280", fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
  assessmentText: { color: "#D1D5DB", fontSize: 14, lineHeight: 21 },
  recommendationBox: { backgroundColor: "#0D0D0D", borderRadius: 12, padding: 13, gap: 6 },
  recommendationLabel: { color: "#60A5FA", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  recommendationText: { color: "#E5E7EB", fontSize: 13, lineHeight: 19 },
  comparisonCard: { backgroundColor: "#141414", borderColor: "#242424", borderWidth: 1, borderRadius: 16, paddingHorizontal: 15 },
  comparisonRow: { paddingVertical: 14, gap: 5 },
  comparisonDivider: { borderBottomColor: "#292929", borderBottomWidth: 1 },
  comparisonTopLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  comparisonLabel: { color: "#F3F4F6", fontSize: 14, fontWeight: "700" },
  comparisonDelta: { fontSize: 13, fontWeight: "800" },
  comparisonValues: { color: "#9CA3AF", fontSize: 12 },
  comparisonSummary: { color: "#D1D5DB", fontSize: 12, lineHeight: 18 },
  privacy: { color: "#6B7280", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 2 },
});
