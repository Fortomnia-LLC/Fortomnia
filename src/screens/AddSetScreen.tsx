import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useExercises } from "../hooks/useExercises";
import { useProfile } from "../hooks/useProfile";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export default function AddSetScreen() {
  const router = useRouter();
  const {
    exerciseId: initialExerciseId,
    id,
    reps: initialReps,
    rir: initialRir,
    setId,
    weight: initialWeight,
  } = useLocalSearchParams<{
    exerciseId?: string;
    id: string;
    reps?: string;
    rir?: string;
    setId?: string;
    weight?: string;
  }>();

  const workoutId = Array.isArray(id) ? id[0] : id;
  const editingSetId = Array.isArray(setId) ? setId[0] : setId;
  const isEditing = Boolean(editingSetId);

  const { session } = useAuth();
  const { exercises, isLoading } = useExercises();
  const { profile } = useProfile();

  const [exerciseId, setExerciseId] = useState<string | null>(
    initialExerciseId ?? null,
  );
  const [weight, setWeight] = useState(initialWeight ?? "0");
  const [reps, setReps] = useState(initialReps ?? "");
  const [rir, setRir] = useState(initialRir ?? "2");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!exerciseId && exercises.length > 0) {
      setExerciseId(exercises[0].id);
    }
  }, [exerciseId, exercises]);

  async function handleSave() {
    if (!session?.user.id || !workoutId || !exerciseId) {
      setErrorMessage("Workout, user, or exercise is missing.");
      return;
    }

    const parsedWeight = Number(weight);
    const parsedReps = Number(reps);
    const parsedRir = rir.trim() === "" ? null : Number(rir);

    if (!Number.isFinite(parsedWeight) || parsedWeight < 0) {
      setErrorMessage("Weight must be zero or greater.");
      return;
    }

    if (
      !Number.isInteger(parsedReps) ||
      parsedReps <= 0
    ) {
      setErrorMessage("Reps must be a positive whole number.");
      return;
    }

    if (
      parsedRir !== null &&
      (!Number.isInteger(parsedRir) ||
        parsedRir < 0 ||
        parsedRir > 10)
    ) {
      setErrorMessage("RIR must be a whole number from 0 to 10.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

        const { data: activeWorkout, error: workoutError } = await supabase
      .from("workout_sessions")
      .select("id")
      .eq("id", workoutId)
      .eq("user_id", session.user.id)
      .is("completed_at", null)
      .maybeSingle();

    if (workoutError || !activeWorkout) {
      setErrorMessage(
        workoutError?.message ?? "Completed workouts cannot be changed.",
      );
      setIsSaving(false);
      return;
    }

    if (isEditing && editingSetId) {
      const { data, error } = await supabase
        .from("workout_sets")
        .update({
          exercise_id: exerciseId,
          reps: parsedReps,
          reps_in_reserve: parsedRir,
          weight: parsedWeight,
          weight_unit: profile?.preferred_weight_unit ?? "lb",
        })
        .eq("id", editingSetId)
        .eq("session_id", workoutId)
        .eq("user_id", session.user.id)
        .select("id")
        .maybeSingle();

      setIsSaving(false);

      if (error || !data) {
        setErrorMessage(
          error?.message ?? "The set was not updated.",
        );
        return;
      }

      router.replace({
        pathname: "/workout/[id]",
        params: { id: workoutId },
      });
      return;
    }
      const { data: latestSet, error: latestSetError } =
      await supabase
        .from("workout_sets")
        .select("set_number")
        .eq("session_id", workoutId)
        .eq("exercise_id", exerciseId)
        .order("set_number", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestSetError) {
      setErrorMessage(latestSetError.message);
      setIsSaving(false);
      return;
    }

    const nextSetNumber = (latestSet?.set_number ?? 0) + 1;

    const { error } = await supabase
      .from("workout_sets")
      .insert({
        exercise_id: exerciseId,
        reps: parsedReps,
        reps_in_reserve: parsedRir,
        session_id: workoutId,
        set_number: nextSetNumber,
        user_id: session.user.id,
        weight: parsedWeight,
        weight_unit: profile?.preferred_weight_unit ?? "lb",
      });

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace({
      pathname: "/workout/[id]",
      params: { id: workoutId },
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#F97316" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
  automaticallyAdjustKeyboardInsets
  contentContainerStyle={styles.content}
  keyboardDismissMode="interactive"
  keyboardShouldPersistTaps="handled"
        >
        <Pressable
          onPress={() =>
            router.replace({
              pathname: "/workout/[id]",
              params: { id: workoutId },
            })
          }
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Workout</Text>
        </Pressable>

                  <Text style={styles.eyebrow}>IRONFORGE</Text>
          <Text style={styles.title}>
            {isEditing ? "Edit set" : "Log set"}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? "Correct the exercise or performance values."
              : "Choose an exercise and record your performance."}
          </Text>

        <Text style={styles.label}>Exercise</Text>

        <View style={styles.exerciseList}>
          {exercises.map((exercise) => {
            const selected = exercise.id === exerciseId;

            return (
              <Pressable
                key={exercise.id}
                onPress={() => setExerciseId(exercise.id)}
                style={[
                  styles.exerciseButton,
                  selected && styles.exerciseButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.exerciseText,
                    selected && styles.exerciseTextSelected,
                  ]}
                >
                  {exercise.name}
                </Text>
                <Text style={styles.exerciseDetail}>
                  {exercise.muscle_group}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>
          Weight ({profile?.preferred_weight_unit ?? "lb"})
        </Text>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={setWeight}
          selectTextOnFocus
          style={styles.input}
          value={weight}
        />

        <Text style={styles.label}>Reps</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setReps}
          placeholder="8"
          placeholderTextColor="#727885"
          style={styles.input}
          value={reps}
        />

        <Text style={styles.label}>Reps in reserve</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setRir}
          placeholder="2"
          placeholderTextColor="#727885"
          style={styles.input}
          value={rir}
        />

        {errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : null}

        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.saveButton, isSaving && styles.disabled]}
        >
          {isSaving ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
              <Text style={styles.saveText}>
                {isEditing ? "Save changes" : "Save set"}
              </Text>
          )}
        </Pressable>
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
    paddingBottom: 40,
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
  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
    marginTop: 8,
  },
  label: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  exerciseList: {
    gap: 8,
    marginBottom: 24,
  },
  exerciseButton: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  exerciseButtonSelected: {
    borderColor: "#F97316",
  },
  exerciseText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  exerciseTextSelected: {
    color: "#F97316",
  },
  exerciseDetail: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 17,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: {
    color: "#F87171",
    marginBottom: 14,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  saveText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
});
