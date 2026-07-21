import { Link } from "expo-router";
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
  type Exercise,
  useExercises,
} from "../hooks/useExercises";
import { useWorkoutSessions } from "../hooks/useWorkoutSessions";

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>

        {exercise.owner_id ? (
          <Text style={styles.customBadge}>CUSTOM</Text>
        ) : null}
      </View>

      <Text style={styles.exerciseDetails}>
        {exercise.muscle_group}
        {exercise.equipment ? ` • ${exercise.equipment}` : ""}
      </Text>
    </View>
  );
}

export default function TrainingScreen() {
  const {
    errorMessage,
    exercises,
    isLoading,
    refreshExercises,
  } = useExercises();

  const {
    errorMessage: workoutError,
    isLoading: workoutsLoading,
    refreshWorkoutSessions,
    workoutSessions,
  } = useWorkoutSessions();

  if (isLoading && exercises.length === 0) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={exercises}
        keyExtractor={(exercise) => exercise.id}
        onRefresh={() => {
          void Promise.all([
            refreshExercises(),
            refreshWorkoutSessions(),
          ]);
        }}
        refreshing={isLoading || workoutsLoading}
       
        renderItem={({ item }) => (
          <ExerciseCard exercise={item} />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>IRONFORGE</Text>
            <Text style={styles.title}>Training</Text>
            <Text style={styles.subtitle}>
              Your exercise library is ready for workout logging.
            </Text>
            <Link href="/new-workout" asChild>
              <Pressable style={styles.startButton}>
                <Text style={styles.startButtonText}>
                  Start workout
                </Text>
              </Pressable>
            </Link>
            <Text style={styles.sectionTitle}>
              Recent workouts
            </Text>

            {workoutError ? (
              <Text style={styles.error}>{workoutError}</Text>
            ) : null}

            {workoutSessions.length === 0 ? (
              <Text style={styles.sessionEmpty}>
                No workouts logged yet.
              </Text>
            ) : (
             workoutSessions.map((workout) => (
                <Link
                  key={workout.id}
                  href={{
                    pathname: "/workout/[id]",
                    params: { id: workout.id },
                  }}
                  asChild
                >
                  <Pressable style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <Text style={styles.sessionName}>
                        {workout.name}
                      </Text>

                      <Text
                        style={[
                          styles.sessionStatus,
                          workout.completed_at
                            ? styles.completedStatus
                            : styles.activeStatus,
                        ]}
                      >
                        {workout.completed_at
                          ? "COMPLETED"
                          : "ACTIVE"}
                      </Text>
                    </View>

                    <Text style={styles.sessionDate}>
                      {new Date(
                        workout.started_at,
                      ).toLocaleDateString()}
                    </Text>
                  </Pressable>
                </Link>
              ))
            )}
            <View style={styles.summary}>
              <Text style={styles.summaryNumber}>
                {exercises.length}
              </Text>
              <Text style={styles.summaryLabel}>
                available exercises
              </Text>
            </View>

            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}

            <Text style={styles.sectionTitle}>
              Exercise library
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No exercises are available yet.
          </Text>
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
  },
  screen: {
    backgroundColor: "#0B0B0B",
    flex: 1,
  },
  listContent: {
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 30,
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    marginTop: 8,
  },
  summary: {
    alignItems: "baseline",
    backgroundColor: "#1A1A1A",
    borderColor: "#2A2A2A",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
    padding: 20,
  },
  summaryNumber: {
    color: "#F97316",
    fontSize: 30,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "#D1D5DB",
    fontSize: 15,
  },
  error: {
    color: "#F87171",
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  cardHeader: {
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
  customBadge: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  exerciseDetails: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 7,
  },
  empty: {
    color: "#9CA3AF",
    paddingVertical: 30,
    textAlign: "center",
  },
startButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 20,
    minHeight: 52,
  },
  startButtonText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
  sessionEmpty: {
    color: "#9CA3AF",
    marginBottom: 24,
  },
  sessionCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  sessionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sessionName: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  sessionStatus: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  activeStatus: {
    color: "#F97316",
  },
  completedStatus: {
    color: "#34D399",
  },
  sessionDate: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 7,
  },
});
