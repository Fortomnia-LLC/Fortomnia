import { useLocalSearchParams, useRouter } from "expo-router";
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
  type ExerciseHistorySet,
  useExerciseHistory,
} from "../hooks/useExerciseHistory";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

function HistoryCard({ set }: { set: ExerciseHistorySet }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.sessionName}>{set.session_name}</Text>
        <Text style={styles.date}>
          {new Date(set.performed_at).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.performance}>
        {set.weight} {set.weight_unit} × {set.reps} reps
      </Text>

      <Text style={styles.details}>
        Set {set.set_number}
        {set.reps_in_reserve !== null
          ? ` • ${set.reps_in_reserve} RIR`
          : ""}
      </Text>
    </View>
  );
}

export default function ExerciseHistoryScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exerciseId = Array.isArray(id) ? id[0] : id;

  const {
    errorMessage,
    exercise,
    isLoading,
    refreshHistory,
    sets,
  } = useExerciseHistory(exerciseId);

  const bestWeight = sets.reduce(
    (best, set) => Math.max(best, set.weight),
    0,
  );
  function handleToggleArchive() {
    if (!session?.user.id || !exercise?.owner_id) {
      Alert.alert(
        "Unable to update exercise",
        "Only your custom exercises can be archived.",
      );
      return;
    }

    const nextArchivedState = !exercise.is_archived;

    Alert.alert(
      nextArchivedState
        ? "Archive custom exercise?"
        : "Reactivate custom exercise?",
      nextArchivedState
        ? `${exercise.name} will be hidden from exercise pickers, but its workout history will be preserved.`
        : `${exercise.name} will return to your exercise library and pickers.`,
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          text: nextArchivedState ? "Archive" : "Reactivate",
          onPress: async () => {
            const { data, error } = await supabase
              .from("exercises")
              .update({
                is_archived: nextArchivedState,
              })
              .eq("id", exercise.id)
              .eq("owner_id", session.user.id)
              .select("id")
              .maybeSingle();

            if (error || !data) {
              Alert.alert(
                "Unable to update exercise",
                error?.message ?? "The custom exercise was not updated.",
              );
              return;
            }

            await refreshHistory();
          },
        },
      ],
    );
  }
  async function handleDeleteExercise() {
    if (!session?.user.id || !exercise?.owner_id) {
      Alert.alert(
        "Unable to delete exercise",
        "Only your custom exercises can be deleted.",
      );
      return;
    }

    const [
      setsResult,
      templateExercisesResult,
      sessionExercisesResult,
    ] = await Promise.all([
      supabase
        .from("workout_sets")
        .select("id", { count: "exact", head: true })
        .eq("exercise_id", exercise.id)
        .eq("user_id", session.user.id),
      supabase
        .from("workout_template_exercises")
        .select("id", { count: "exact", head: true })
        .eq("exercise_id", exercise.id)
        .eq("user_id", session.user.id),
      supabase
        .from("workout_session_exercises")
        .select("id", { count: "exact", head: true })
        .eq("exercise_id", exercise.id)
        .eq("user_id", session.user.id),
    ]);

    const firstError =
      setsResult.error ??
      templateExercisesResult.error ??
      sessionExercisesResult.error;

    if (firstError) {
      Alert.alert("Unable to delete exercise", firstError.message);
      return;
    }

    const referenceCount =
      (setsResult.count ?? 0) +
      (templateExercisesResult.count ?? 0) +
      (sessionExercisesResult.count ?? 0);

    if (referenceCount > 0) {
      Alert.alert(
        "Exercise is in use",
        "This exercise is connected to workout history or a template, so it cannot be deleted without damaging your records.",
      );
      return;
    }

    Alert.alert(
      "Delete custom exercise?",
      `${exercise.name} will be permanently removed.`,
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          style: "destructive",
          text: "Delete permanently",
          onPress: async () => {
            const { data, error } = await supabase
              .from("exercises")
              .delete()
              .eq("id", exercise.id)
              .eq("owner_id", session.user.id)
              .select("id")
              .maybeSingle();

            if (error || !data) {
              Alert.alert(
                "Unable to delete exercise",
                error?.message ?? "The custom exercise was not deleted.",
              );
              return;
            }

            router.replace("/training");
          },
        },
      ],
    );
  }
  if (isLoading && !exercise) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Text style={styles.error}>
          {errorMessage ?? "Exercise not found."}
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
        onRefresh={() => void refreshHistory()}
        refreshing={isLoading}
        renderItem={({ item }) => <HistoryCard set={item} />}
        ListHeaderComponent={
          <View>
            <Pressable
              onPress={() => router.replace("/training")}
              style={styles.navigation}
            >
              <Text style={styles.navigationText}>‹ Training</Text>
            </Pressable>

            <Text style={styles.eyebrow}>EXERCISE HISTORY</Text>
            <Text style={styles.title}>{exercise.name}</Text>
            <Text style={styles.subtitle}>
              {exercise.muscle_group}
              {exercise.equipment ? ` • ${exercise.equipment}` : ""}
            </Text>
            {exercise.is_archived ? (
              <Text style={styles.archivedStatus}>ARCHIVED</Text>
            ) : null}
                        {exercise.owner_id ? (
              <View style={styles.customActions}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/new-exercise",
                      params: { exerciseId: exercise.id },
                    })
                  }
                  style={styles.editButton}
                >
                  <Text style={styles.editButtonText}>
                    Edit custom exercise
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleToggleArchive}
                  style={styles.archiveButton}
                >
                  <Text style={styles.archiveButtonText}>
                    {exercise.is_archived ? "Reactivate" : "Archive"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleDeleteExercise()}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>
                    Delete custom exercise
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>{sets.length}</Text>
                <Text style={styles.summaryLabel}>logged sets</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>
                  {sets.length > 0 ? bestWeight : "—"}
                </Text>
                <Text style={styles.summaryLabel}>
                  best {sets[0]?.weight_unit ?? ""}
                </Text>
              </View>
            </View>

            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}

            <Text style={styles.sectionTitle}>Performance history</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyText}>
              Log this exercise in a workout to begin tracking progress.
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
    color: "#2563EB",
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
  subtitle: {
    color: "#9CA3AF",
    fontSize: 15,
    marginBottom: 22,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 26,
  },
  summaryCard: {
    backgroundColor: "#1A1A1A",
    borderColor: "#2A2A2A",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  summaryNumber: {
    color: "#F97316",
    fontSize: 25,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 4,
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
  sessionName: {
    color: "#FFFFFF",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  date: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  performance: {
    color: "#F97316",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
  },
  details: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 6,
  },
  archivedStatus: {
    color: "#FBBF24",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 18,
    marginTop: -10,
  },
  customActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
    marginTop: -10,
  },
  editButton: {
    borderColor: "#2563EB",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  editButtonText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
  },
  archiveButton: {
    borderColor: "#9CA3AF",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  archiveButtonText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    borderColor: "#F87171",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  deleteButtonText: {
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
    marginTop: 8,
  },
  error: {
    color: "#F87171",
    marginBottom: 18,
    textAlign: "center",
  },
  backButton: {
    borderColor: "#2563EB",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backText: {
    color: "#2563EB",
    fontWeight: "700",
  },
});
