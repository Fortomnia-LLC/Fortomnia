import { Link } from "expo-router";
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
import { useWeeklyAnalytics } from "../hooks/useWeeklyAnalytics";
import {
  getLocalDateKey,
  useDailyNutrition,
} from "../hooks/useDailyNutrition";
import { useProfile } from "../hooks/useProfile";
import { useSupplements } from "../hooks/useSupplements";
import { useWorkoutSessions } from "../hooks/useWorkoutSessions";
import { isProtocolDue } from "../lib/supplementSchedule";
import { useAuth } from "../providers/AuthProvider";

export default function DashboardScreen() {
  const today = getLocalDateKey();
  const { session } = useAuth();

  const {
    errorMessage: profileError,
    isLoading: profileLoading,
    profile,
    refreshProfile,
  } = useProfile();

  const {
    errorMessage: nutritionError,
    goals,
    isLoading: nutritionLoading,
    refreshNutrition,
    totals,
  } = useDailyNutrition(today);

  const {
    errorMessage: supplementError,
    isLoading: supplementsLoading,
    latestLogByProtocol,
    protocols,
    refreshSupplements,
  } = useSupplements(today);

  const {
    errorMessage: workoutError,
    isLoading: workoutsLoading,
    refreshWorkoutSessions,
    workoutSessions,
  } = useWorkoutSessions();

  const {
    analytics,
    errorMessage: analyticsError,
    isLoading: analyticsLoading,
    refreshAnalytics,
  } = useWeeklyAnalytics(today);
  const displayName =
    profile?.display_name?.trim() ||
    session?.user.email?.split("@")[0] ||
    "Athlete";

  const activeWorkout = workoutSessions.find(
    (workout) => !workout.completed_at,
  );
  const latestWorkout = workoutSessions[0];

  const scheduledProtocols = protocols.filter(
    (protocol) =>
      protocol.is_active && isProtocolDue(protocol, today),
  );
  const supplementsTaken = scheduledProtocols.filter(
    (protocol) =>
      latestLogByProtocol.get(protocol.id)?.status === "taken",
  ).length;

  const caloriePercent =
    goals.calorie_target > 0
      ? Math.min(
          100,
          Math.round(
            (totals.calories / goals.calorie_target) * 100,
          ),
        )
      : 0;

  const isLoading =
    profileLoading ||
    nutritionLoading ||
    supplementsLoading ||
    analyticsLoading ||
    workoutsLoading;


  const errors = [
    profileError,
    nutritionError,
    supplementError,
    analyticsError,
    workoutError,
  ].filter((error): error is string => Boolean(error));

  if (isLoading && !profile && workoutSessions.length === 0) {
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
            refreshing={isLoading}
            tintColor="#F97316"
            onRefresh={() => {
              void Promise.all([
                refreshProfile(),
                refreshNutrition(),
                refreshSupplements(),
                refreshAnalytics(),
                refreshWorkoutSessions(),
              ]);
            }}
          />
        }
      >
        <Text style={styles.eyebrow}>FORTOMNIA</Text>
        <Text style={styles.title}>Welcome, {displayName}</Text>
        <Text style={styles.date}>
          {new Date(`${today}T12:00:00`).toLocaleDateString(
            undefined,
            { dateStyle: "full" },
          )}
        </Text>

        {errors.length > 0 ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={styles.error}
          >
            Some dashboard data could not load: {errors.join(" • ")}
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>Today</Text>

        <Link href="/nutrition" asChild>
          <Pressable style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Nutrition</Text>
              <Text style={styles.cardAction}>View ›</Text>
            </View>

            <Text style={styles.primaryValue}>
              {totals.calories}
              <Text style={styles.primaryUnit}>
                {" "}
                / {goals.calorie_target} cal
              </Text>
            </Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${caloriePercent}%` },
                ]}
              />
            </View>

            <Text style={styles.details}>
              P {Math.round(totals.protein_g)}g • C{" "}
              {Math.round(totals.carbs_g)}g • F{" "}
              {Math.round(totals.fat_g)}g
            </Text>
          </Pressable>
        </Link>

        <Link href="/supplements" asChild>
          <Pressable style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Supplements</Text>
              <Text style={styles.cardAction}>View ›</Text>
            </View>

            <Text style={styles.primaryValue}>
              {supplementsTaken}
              <Text style={styles.primaryUnit}>
                {" "}
                / {scheduledProtocols.length} taken
              </Text>
            </Text>

            <Text style={styles.details}>
              Scheduled protocols due today
            </Text>
          </Pressable>
        </Link>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Training</Text>
            <Link href="/training" asChild>
              <Pressable>
                <Text style={styles.cardAction}>View ›</Text>
              </Pressable>
            </Link>
          </View>

          {activeWorkout ? (
            <>
              <Text style={styles.primaryValue}>
                {activeWorkout.name}
              </Text>
              <Text style={styles.details}>Workout in progress</Text>

              <Link
                href={{
                  pathname: "/workout/[id]",
                  params: { id: activeWorkout.id },
                }}
                asChild
              >
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>
                    Continue workout
                  </Text>
                </Pressable>
              </Link>
            </>
          ) : latestWorkout ? (
            <>
              <Text style={styles.primaryValue}>
                {latestWorkout.name}
              </Text>
              <Text style={styles.details}>
                Last workout:{" "}
                {new Date(
                  latestWorkout.started_at,
                ).toLocaleDateString()}
              </Text>

              <Link href="/new-workout" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>
                    Start workout
                  </Text>
                </Pressable>
              </Link>
            </>
          ) : (
            <>
              <Text style={styles.details}>
                No workouts logged yet.
              </Text>

              <Link href="/new-workout" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>
                    Start first workout
                  </Text>
                </Pressable>
              </Link>
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Last 7 days</Text>

        <View style={styles.card}>
          <View style={styles.analyticsGrid}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {analytics.workoutsCompleted}
              </Text>
              <Text style={styles.metricLabel}>
                workouts completed
              </Text>
            </View>

            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {analytics.setsLogged}
              </Text>
              <Text style={styles.metricLabel}>sets logged</Text>
            </View>

            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {analytics.nutritionDaysLogged}/7
              </Text>
              <Text style={styles.metricLabel}>
                nutrition days
              </Text>
            </View>

            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {analytics.supplementAdherencePercent === null
                  ? "—"
                  : `${analytics.supplementAdherencePercent}%`}
              </Text>
              <Text style={styles.metricLabel}>
                supplement adherence
              </Text>
            </View>
          </View>
          <View style={styles.activityStrip}>
            {analytics.days.map((day) => (
              <View key={day.date} style={styles.activityDay}>
                <Text style={styles.activityDayLabel}>
                  {day.label.slice(0, 1)}
                </Text>

                <Text
                  style={[
                    styles.activitySignal,
                    day.workoutCompleted
                      ? styles.trainingSignal
                      : styles.inactiveSignal,
                  ]}
                >
                  W
                </Text>

                <Text
                  style={[
                    styles.activitySignal,
                    day.nutritionLogged
                      ? styles.nutritionSignal
                      : styles.inactiveSignal,
                  ]}
                >
                  N
                </Text>

                <Text
                  style={[
                    styles.activitySignal,
                    day.supplementAdherencePercent === null
                      ? styles.inactiveSignal
                      : day.supplementAdherencePercent === 100
                        ? styles.supplementSignal
                        : styles.partialSignal,
                  ]}
                >
                  S
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.activityLegend}>
            W workout • N nutrition • S scheduled supplements
          </Text>
          <Text style={styles.analyticsDetails}>
            Logged-day averages: {analytics.averageCalories} calories •{" "}
            {analytics.averageProteinG}g protein
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>

        <View style={styles.quickActions}>
          <Link href="/new-workout" asChild>
            <Pressable style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Start workout</Text>
            </Pressable>
          </Link>

          <Link
            href={{
              pathname: "/new-nutrition-entry",
              params: { date: today },
            }}
            asChild
          >
            <Pressable style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Log food</Text>
            </Pressable>
          </Link>
        </View>
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
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 3,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 8,
  },
  date: {
    color: "#9CA3AF",
    fontSize: 15,
    marginBottom: 26,
    marginTop: 6,
  },
  error: {
    color: "#F87171",
    lineHeight: 20,
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  cardAction: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  primaryUnit: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
  },
  progressTrack: {
    backgroundColor: "#333333",
    borderRadius: 999,
    height: 8,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#F97316",
    borderRadius: 999,
    height: "100%",
  },
  details: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 10,
    marginTop: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#0B0B0B",
    fontSize: 14,
    fontWeight: "800",
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metric: {
    backgroundColor: "#21170D",
    borderColor: "#4A2D12",
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    padding: 14,
  },
  metricValue: {
    color: "#F97316",
    fontSize: 24,
    fontWeight: "800",
  },
  metricLabel: {
    color: "#D1D5DB",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  activityStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  activityDay: {
    alignItems: "center",
    flex: 1,
    gap: 5,
  },
  activityDayLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  activitySignal: {
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "800",
    height: 24,
    lineHeight: 24,
    overflow: "hidden",
    textAlign: "center",
    width: 24,
  },
  trainingSignal: {
    backgroundColor: "#F97316",
    color: "#0B0B0B",
  },
  nutritionSignal: {
    backgroundColor: "#60A5FA",
    color: "#0B0B0B",
  },
  supplementSignal: {
    backgroundColor: "#34D399",
    color: "#0B0B0B",
  },
  partialSignal: {
    backgroundColor: "#FBBF24",
    color: "#0B0B0B",
  },
  inactiveSignal: {
    backgroundColor: "#292929",
    color: "#6B7280",
  },
  activityLegend: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 12,
    textAlign: "center",
  },
  analyticsDetails: {
    borderTopColor: "#333333",
    borderTopWidth: 1,
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
    paddingTop: 14,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
  },
  quickButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 13,
  },
  quickButtonText: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "700",
  },
});
