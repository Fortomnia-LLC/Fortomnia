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
    workoutsLoading;

  const errors = [
    profileError,
    nutritionError,
    supplementError,
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
                refreshWorkoutSessions(),
              ]);
            }}
          />
        }
      >
        <Text style={styles.eyebrow}>IRONFORGE</Text>
        <Text style={styles.title}>Welcome, {displayName}</Text>
        <Text style={styles.date}>
          {new Date(`${today}T12:00:00`).toLocaleDateString(
            undefined,
            { dateStyle: "full" },
          )}
        </Text>

        {errors.length > 0 ? (
          <Text style={styles.error}>
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
