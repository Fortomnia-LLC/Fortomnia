import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  type LoggedSet,
  useWorkoutSession,
} from "../hooks/useWorkoutSession";

function SetCard({ set }: { set: LoggedSet }) {
  return (
    <View style={styles.setCard}>
      <View style={styles.setHeader}>
        <Text style={styles.exerciseName}>{set.exercise_name}</Text>
        <Text style={styles.setNumber}>SET {set.set_number}</Text>
      </View>

      <Text style={styles.performance}>
        {set.weight} {set.weight_unit} × {set.reps} reps
      </Text>

      {set.reps_in_reserve !== null ? (
        <Text style={styles.rir}>
          {set.reps_in_reserve} reps in reserve
        </Text>
      ) : null}
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Array.isArray(id) ? id[0] : id;

  const {
    errorMessage,
    isLoading,
    refreshWorkout,
    sets,
    workout,
  } = useWorkoutSession(workoutId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
    );
  }

    if (!workout) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Text style={styles.error}>
          {errorMessage ?? "Workout not found."}
        </Text>

        <Pressable
          onPress={() => router.replace("/training")}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Return to Training</Text>
        </Pressable>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={sets}
        keyExtractor={(set) => set.id}
        onRefresh={() => void refreshWorkout()}
        refreshing={isLoading}
        renderItem={({ item }) => <SetCard set={item} />}
        ListHeaderComponent={
          <View>
            <Pressable
              onPress={() => router.replace("/training")}
              style={styles.navigation}
            >
              <Text style={styles.navigationText}>‹ Training</Text>
            </Pressable>

            <Text style={styles.eyebrow}>ACTIVE WORKOUT</Text>
            <Text style={styles.title}>{workout.name}</Text>
            <Text style={styles.date}>
              Started{" "}
              {new Date(workout.started_at).toLocaleString()}
            </Text>

            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}

            <View style={styles.summary}>
              <Text style={styles.summaryNumber}>{sets.length}</Text>
              <Text style={styles.summaryLabel}>logged sets</Text>
            </View>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/workout/[id]/add-set",
                    params: { id: workoutId },
                  })
                }
                style={styles.logSetButton}
              >
                <Text style={styles.logSetText}>Log set</Text>
              </Pressable>
            <Text style={styles.sectionTitle}>Workout sets</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No sets logged yet</Text>
            <Text style={styles.emptyText}>
              The next step is selecting an exercise and recording
              weight, reps, and RIR.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  screen: {
    backgroundColor: "#0B0B0B",
    flex: 1,
  },
  listContent: {
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  navigation: {
    alignSelf: "flex-start",
    paddingBottom: 18,
    paddingTop: 18,
  },
  navigationText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "700",
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
  },
  date: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 22,
    marginTop: 8,
  },
  summary: {
    alignItems: "baseline",
    backgroundColor: "#1A1A1A",
    borderColor: "#2A2A2A",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 26,
    padding: 18,
  },
  summaryNumber: {
    color: "#F97316",
    fontSize: 28,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "#D1D5DB",
    fontSize: 15,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  setCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  setHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exerciseName: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  setNumber: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  performance: {
    color: "#D1D5DB",
    fontSize: 16,
    marginTop: 10,
  },
  rir: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 5,
  },
  emptyCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  error: {
    color: "#F87171",
    marginBottom: 18,
    textAlign: "center",
  },
  backButton: {
    borderColor: "#F97316",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backText: {
    color: "#F97316",
    fontWeight: "700",
  },
  logSetButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 24,
    minHeight: 52,
  },
  logSetText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
});
