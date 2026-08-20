import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  type LoggedSet,
  type PlannedExercise,
  useWorkoutSession,
} from "../hooks/useWorkoutSession";

import {
  getNextWorkoutSet,
  groupWorkoutSets,
} from "../lib/workoutSets";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { useState } from "react";

type SetCardProps = {
  canModify: boolean;
  onDelete: (set: LoggedSet) => void;
  onEdit: (set: LoggedSet) => void;
  set: LoggedSet;
};

function SetCard({
  canModify,
  onDelete,
  onEdit,
  set,
}: SetCardProps) {
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

      {canModify ? (
        <View style={styles.setActions}>
          <Pressable
            onPress={() => onEdit(set)}
            style={styles.editSetButton}
          >
            <Text style={styles.editSetText}>Edit set</Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(set)}
            style={styles.deleteSetButton}
          >
            <Text style={styles.deleteSetText}>Delete set</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
type PlannedExerciseCardProps = {
  canLog: boolean;
  completedSets: number;
  exercise: PlannedExercise;
  onLog: (exercise: PlannedExercise) => void;
};

function PlannedExerciseCard({
  canLog,
  completedSets,
  exercise,
  onLog,
}: PlannedExerciseCardProps) {
  const targetReached = completedSets >= exercise.target_sets;

  return (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text style={styles.planPosition}>{exercise.position}</Text>
        <Text style={styles.planExerciseName}>
          {exercise.exercise_name}
        </Text>
      </View>

      <Text style={styles.planTarget}>
        {exercise.target_sets} sets × {exercise.rep_min}–
        {exercise.rep_max} reps • {exercise.target_rir} RIR
      </Text>

      <Text style={styles.planProgress}>
        {completedSets} of {exercise.target_sets} sets logged
      </Text>

      {canLog && !targetReached ? (
        <Pressable
          onPress={() => onLog(exercise)}
          style={styles.planLogButton}
        >
          <Text style={styles.planLogText}>Log next set</Text>
        </Pressable>
      ) : targetReached ? (
        <Text style={styles.planComplete}>TARGET COMPLETE</Text>
      ) : null}
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Array.isArray(id) ? id[0] : id;
  const { session } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);
  const {
    errorMessage,
    isLoading,
    plannedExercises,
    refreshWorkout,
    sets,
    workout,
  } = useWorkoutSession(workoutId);
  const nextWorkoutSet = getNextWorkoutSet(sets, plannedExercises);

  function handleLogNextSet() {
    if (!nextWorkoutSet) {
      return;
    }

    const { exercise, lastSet } = nextWorkoutSet;

    router.push({
      pathname: "/workout/[id]/add-set",
      params: {
        exerciseId: exercise.exercise_id,
        id: workoutId,
        repMax: String(exercise.rep_max),
        repMin: String(exercise.rep_min),
        reps: String(lastSet?.reps ?? exercise.rep_min),
        rir: String(
          lastSet?.reps_in_reserve ?? exercise.target_rir,
        ),
        ...(lastSet ? { weight: String(lastSet.weight) } : {}),
      },
    });
  }

  function handleLogPlannedExercise(exercise: PlannedExercise) {
    router.push({
      pathname: "/workout/[id]/add-set",
      params: {
        exerciseId: exercise.exercise_id,
        id: workoutId,
         repMax: String(exercise.rep_max),
         repMin: String(exercise.rep_min),
         reps: String(exercise.rep_min),
        rir: String(exercise.target_rir),
      },
    });
  }

    function handleEditSet(set: LoggedSet) {
    router.push({
      pathname: "/workout/[id]/add-set",
      params: {
        exerciseId: set.exercise_id,
        id: workoutId,
        reps: String(set.reps),
        rir:
          set.reps_in_reserve === null
            ? ""
            : String(set.reps_in_reserve),
        setId: set.id,
        weight: String(set.weight),
      },
    });
  }
    function handleCompleteWorkout() {
    if (!session?.user.id || !workoutId) {
      Alert.alert("Unable to complete workout", "Your session is missing.");
      return;
    }

    Alert.alert(
      "Complete workout?",
      "You can still view this workout after completing it.",
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          style: "destructive",
          text: "Complete",
          onPress: async () => {
            setIsCompleting(true);

            const { data, error } = await supabase
              .from("workout_sessions")
              .update({
                completed_at: new Date().toISOString(),
              })
              .eq("id", workoutId)
              .eq("user_id", session.user.id)
              .is("completed_at", null)
              .select("id")
              .maybeSingle();

            setIsCompleting(false);

            if (error || !data) {
              Alert.alert(
                "Unable to complete workout",
                error?.message ?? "The workout was not updated.",
              );
              return;
            }

            router.replace("/training");
          },
        },
      ],
    );
  }
    function handleDeleteSet(set: LoggedSet) {
    if (!session?.user.id || !workoutId || workout?.completed_at) {
      Alert.alert(
        "Unable to delete set",
        "Only sets in an active workout can be deleted.",
      );
      return;
    }

    Alert.alert(
      "Delete set?",
      `${set.exercise_name}: ${set.weight} ${set.weight_unit} × ${set.reps}`,
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          style: "destructive",
          text: "Delete",
          onPress: async () => {
            const { error } = await supabase
              .from("workout_sets")
              .delete()
              .eq("id", set.id)
              .eq("user_id", session.user.id);

            if (error) {
              Alert.alert("Unable to delete set", error.message);
              return;
            }

            await refreshWorkout();
          },
        },
      ],
    );
  }
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
        data={groupWorkoutSets(
          sets,
          plannedExercises.map((exercise) => exercise.exercise_id),
        )}
        keyExtractor={(group) => group.exerciseId}
        onRefresh={() => void refreshWorkout()}
        refreshing={isLoading}
        renderItem={({ item: group }) => (
          <View style={styles.exerciseGroup}>
            <Text style={styles.groupExerciseName}>
              {group.exerciseName}
            </Text>
            <Text style={styles.groupSetCount}>
              {group.sets.length} {group.sets.length === 1 ? "set" : "sets"}
            </Text>
            {group.sets.map((set) => (
              <SetCard
                canModify={!workout.completed_at}
                key={set.id}
                onDelete={handleDeleteSet}
                onEdit={handleEditSet}
                set={set}
              />
            ))}
          </View>
        )}
        ListHeaderComponent={
          <View>
            <Pressable
              onPress={() => router.replace("/training")}
              style={styles.navigation}
            >
              <Text style={styles.navigationText}>‹ Training</Text>
            </Pressable>

            <Text style={styles.eyebrow}>
            {workout.completed_at ? "COMPLETED WORKOUT" : "ACTIVE WORKOUT"}
           </Text>
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

            {!workout.completed_at && nextWorkoutSet ? (
              <View style={styles.nextSetCard}>
                <Text style={styles.nextSetEyebrow}>UP NEXT</Text>
                <Text style={styles.nextSetTitle}>
                  {nextWorkoutSet.exercise.exercise_name}
                </Text>
                <Text style={styles.nextSetProgress}>
                  Set {nextWorkoutSet.setNumber} of{" "}
                  {nextWorkoutSet.exercise.target_sets}
                </Text>
                <Text style={styles.nextSetTarget}>
                  {nextWorkoutSet.lastSet
                    ? `${nextWorkoutSet.lastSet.weight} ${nextWorkoutSet.lastSet.weight_unit} × ${nextWorkoutSet.lastSet.reps} reps prefilled`
                    : `${nextWorkoutSet.exercise.rep_min}–${nextWorkoutSet.exercise.rep_max} reps • ${nextWorkoutSet.exercise.target_rir} RIR`}
                </Text>
                <Pressable
                  onPress={handleLogNextSet}
                  style={styles.nextSetButton}
                >
                  <Text style={styles.nextSetButtonText}>
                    Start next set
                  </Text>
                </Pressable>
              </View>
            ) : null}
              {plannedExercises.length > 0 ? (
                <View style={styles.planList}>
                  <Text style={styles.sectionTitle}>Workout plan</Text>

                                    {plannedExercises.map((exercise) => (
                    <PlannedExerciseCard
                      canLog={!workout.completed_at}
                      completedSets={
                        sets.filter(
                          (set) =>
                            set.exercise_id === exercise.exercise_id,
                        ).length
                      }
                      exercise={exercise}
                      key={exercise.id}
                      onLog={handleLogPlannedExercise}
                    />
                  ))}
                </View>
              ) : null}
                              {!workout.completed_at ? (
                <>
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

                  <Pressable
                    disabled={isCompleting}
                    onPress={handleCompleteWorkout}
                    style={[
                      styles.completeButton,
                      isCompleting && styles.buttonDisabled,
                    ]}
                  >
                    {isCompleting ? (
                      <ActivityIndicator color="#F97316" />
                    ) : (
                      <Text style={styles.completeText}>
                        Complete workout
                      </Text>
                    )}
                  </Pressable>
                </>
              ) : null}
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
    nextSetCard: {
    backgroundColor: "#21170D",
    borderColor: "#F97316",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    padding: 18,
  },
  nextSetEyebrow: {
    color: "#F97316",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  nextSetTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  nextSetProgress: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 5,
  },
  nextSetTarget: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 6,
  },
  nextSetButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 10,
    marginTop: 16,
    paddingVertical: 12,
  },
  nextSetButtonText: {
    color: "#0B0B0B",
    fontSize: 15,
    fontWeight: "800",
  },
  planList: {
    marginBottom: 18,
  },
    planCard: {
    backgroundColor: "#21170D",
    borderColor: "#4A2D12",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
  },
  planHeader: {
    alignItems: "center",
    flexDirection: "row",
  },
  planPosition: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "800",
    marginRight: 10,
    minWidth: 20,
  },
  planExerciseName: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  planTarget: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 8,
  },
    planProgress: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 6,
  },
  planLogButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 9,
  },
  planLogText: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "800",
  },
  planComplete: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  exerciseGroup: {
    backgroundColor: "#121212",
    borderColor: "#292929",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  groupExerciseName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  groupSetCount: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 12,
    marginTop: 3,
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
      setActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  editSetButton: {
    borderColor: "#F97316",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editSetText: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteSetButton: {
    borderColor: "#F87171",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteSetText: {
    color: "#F87171",
    fontSize: 13,
    fontWeight: "700",
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
    completeButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 24,
    minHeight: 52,
  },
  completeText: {
    color: "#F97316",
    fontSize: 16,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
