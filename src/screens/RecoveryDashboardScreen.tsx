import { Link, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRecoveryCheckIns } from "../hooks/useRecoveryCheckIns";
import { getLocalDateKey } from "../lib/dates";

function formatShortDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function RecoveryDashboardScreen() {
  const router = useRouter();
  const today = getLocalDateKey();
  const {
    currentDay,
    days,
    errorMessage,
    isLoading,
    refreshRecovery,
  } = useRecoveryCheckIns(today);

  const chronologicalDays = [...days].reverse();
  const weightDays = chronologicalDays.filter(
    (day) => day.body_weight !== null && day.body_weight_unit !== null,
  );

  if (isLoading && days.length === 0) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => void refreshRecovery()}
            refreshing={isLoading}
            tintColor="#F97316"
          />
        }
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Home</Text>
        </Pressable>

        <Text style={styles.eyebrow}>FORTOMNIA</Text>
        <Text style={styles.title}>Recovery</Text>
        <Text style={styles.subtitle}>
          A training-planning estimate based on your recent recovery signals.
          It is not medical advice.
        </Text>

        {errorMessage ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={styles.error}
          >
            {errorMessage}
          </Text>
        ) : null}

        {currentDay ? (
          <View style={styles.heroCard}>
            <Text style={styles.cardEyebrow}>TODAY&apos;S READINESS</Text>

            <View style={styles.heroScoreRow}>
              <Text style={styles.heroScore}>{currentDay.readiness.score}</Text>
              <Text style={styles.heroScoreUnit}>/100</Text>
              <Text style={styles.heroBand}>
                {currentDay.readiness.label}
              </Text>
            </View>

            <Text style={styles.heroRecommendation}>
              {currentDay.readiness.recommendation}
            </Text>

            <Link href="/recovery-check-in" asChild>
              <Pressable
                accessibilityLabel="Update today's recovery check-in"
                accessibilityRole="button"
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Update check-in</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No check-in for today</Text>
            <Text style={styles.emptyText}>
              Add today&apos;s sleep, energy, soreness, stress, and mood to
              calculate readiness.
            </Text>

            <Link href="/recovery-check-in" asChild>
              <Pressable
                accessibilityLabel="Start today's recovery check-in"
                accessibilityRole="button"
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Start check-in</Text>
              </Pressable>
            </Link>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Seven-day readiness</Text>
          <Text style={styles.sectionDescription}>
            Scores appear for days with a completed check-in.
          </Text>

          {chronologicalDays.length > 0 ? (
            <View style={styles.chart}>
              {chronologicalDays.map((day) => (
                <View key={day.id} style={styles.chartColumn}>
                  <Text style={styles.chartScore}>{day.readiness.score}</Text>
                  <View style={styles.chartTrack}>
                    <View
                      accessibilityLabel={`${formatShortDate(
                        day.checkin_date,
                      )}: readiness ${day.readiness.score} of 100`}
                      style={[
                        styles.chartBar,
                        { height: `${Math.max(day.readiness.score, 6)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartDay}>
                    {new Date(
                      `${day.checkin_date}T12:00:00`,
                    ).toLocaleDateString(undefined, { weekday: "short" })}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyInline}>No recovery history yet.</Text>
          )}
        </View>

        {currentDay ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>What shaped today&apos;s score</Text>
            <Text style={styles.sectionDescription}>
              Each normalized factor contributes according to its displayed
              weight.
            </Text>

            {currentDay.readiness.factors.map((factor) => (
              <View key={factor.key} style={styles.factorRow}>
                <View style={styles.factorHeader}>
                  <Text style={styles.factorLabel}>{factor.label}</Text>
                  <Text style={styles.factorValue}>
                    {factor.score}/100 · {Math.round(factor.weight * 100)}%
                  </Text>
                </View>
                <View style={styles.factorTrack}>
                  <View
                    style={[styles.factorFill, { width: `${factor.score}%` }]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Body-weight history</Text>
          <Text style={styles.sectionDescription}>
            Optional weights recorded with recovery check-ins.
          </Text>

          {weightDays.length > 0 ? (
            weightDays.map((day) => (
              <View key={day.id} style={styles.weightRow}>
                <Text style={styles.weightDate}>
                  {formatShortDate(day.checkin_date)}
                </Text>
                <Text style={styles.weightValue}>
                  {day.body_weight} {day.body_weight_unit}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyInline}>
              Add optional body weight during a check-in to begin the trend.
            </Text>
          )}
        </View>

        <Text style={styles.footerNotice}>
          Readiness supports planning. Symptoms, injuries, or health concerns
          should be evaluated by a qualified professional.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    flex: 1,
    justifyContent: "center",
  },
  screen: {
    backgroundColor: "#0B0B0B",
    flex: 1,
  },
  content: {
    paddingBottom: 48,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  navigation: {
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  navigationText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "700",
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 10,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
    marginTop: 8,
  },
  error: {
    color: "#F87171",
    marginBottom: 14,
  },
  heroCard: {
    backgroundColor: "#21170D",
    borderColor: "#4A2D12",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 20,
  },
  cardEyebrow: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroScoreRow: {
    alignItems: "baseline",
    flexDirection: "row",
    marginTop: 8,
  },
  heroScore: {
    color: "#F97316",
    fontSize: 46,
    fontWeight: "800",
  },
  heroScoreUnit: {
    color: "#9CA3AF",
    fontSize: 14,
    marginLeft: 3,
  },
  heroBand: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 12,
  },
  heroRecommendation: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 10,
    marginTop: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#0B0B0B",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 20,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
  card: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },
  sectionDescription: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  chart: {
    flexDirection: "row",
    gap: 8,
    height: 150,
    marginTop: 18,
  },
  chartColumn: {
    alignItems: "center",
    flex: 1,
  },
  chartScore: {
    color: "#D1D5DB",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 5,
  },
  chartTrack: {
    backgroundColor: "#292929",
    borderRadius: 6,
    flex: 1,
    justifyContent: "flex-end",
    overflow: "hidden",
    width: "100%",
  },
  chartBar: {
    backgroundColor: "#F97316",
    borderRadius: 6,
    width: "100%",
  },
  chartDay: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 5,
  },
  factorRow: {
    marginTop: 15,
  },
  factorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  factorLabel: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
  },
  factorValue: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  factorTrack: {
    backgroundColor: "#292929",
    borderRadius: 4,
    height: 7,
    marginTop: 7,
    overflow: "hidden",
  },
  factorFill: {
    backgroundColor: "#F97316",
    borderRadius: 4,
    height: "100%",
  },
  weightRow: {
    borderBottomColor: "#292929",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  weightDate: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  weightValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyInline: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
  },
  footerNotice: {
    color: "#6B7280",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
});
