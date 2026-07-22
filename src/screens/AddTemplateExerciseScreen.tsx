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
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export default function AddTemplateExerciseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const templateId = Array.isArray(id) ? id[0] : id;

  const { session } = useAuth();
  const { exercises, isLoading } = useExercises();

  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [targetSets, setTargetSets] = useState("3");
  const [repMin, setRepMin] = useState("8");
  const [repMax, setRepMax] = useState("12");
  const [targetRir, setTargetRir] = useState("2");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseId && exercises.length > 0) {
      setExerciseId(exercises[0].id);
    }
  }, [exerciseId, exercises]);

  async function handleSave() {
    if (!session?.user.id || !templateId || !exerciseId) {
      setErrorMessage("Template, user, or exercise is missing.");
      return;
    }

    const parsedSets = Number(targetSets);
    const parsedMin = Number(repMin);
    const parsedMax = Number(repMax);
    const parsedRir = Number(targetRir);

    if (
      !Number.isInteger(parsedSets) ||
      parsedSets < 1 ||
      parsedSets > 20
    ) {
      setErrorMessage("Target sets must be from 1 to 20.");
      return;
    }

    if (
      !Number.isInteger(parsedMin) ||
      !Number.isInteger(parsedMax) ||
      parsedMin < 1 ||
      parsedMax > 100 ||
      parsedMin > parsedMax
    ) {
      setErrorMessage("Enter a valid rep range from 1 to 100.");
      return;
    }

    if (
      !Number.isInteger(parsedRir) ||
      parsedRir < 0 ||
      parsedRir > 10
    ) {
      setErrorMessage("Target RIR must be from 0 to 10.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const { data: latestExercise, error: positionError } =
      await supabase
        .from("workout_template_exercises")
        .select("position")
        .eq("template_id", templateId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (positionError) {
      setErrorMessage(positionError.message);
      setIsSaving(false);
      return;
    }

    const nextPosition = (latestExercise?.position ?? 0) + 1;

    const { error } = await supabase
      .from("workout_template_exercises")
      .insert({
        exercise_id: exerciseId,
        position: nextPosition,
        rep_max: parsedMax,
        rep_min: parsedMin,
        target_rir: parsedRir,
        target_sets: parsedSets,
        template_id: templateId,
        user_id: session.user.id,
      });

    setIsSaving(false);

    if (error) {
      if (error.code === "23505") {
        setErrorMessage("This exercise is already in the template.");
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    router.replace({
      pathname: "/template/[id]",
      params: { id: templateId },
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
              pathname: "/template/[id]",
              params: { id: templateId },
            })
          }
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Template</Text>
        </Pressable>

        <Text style={styles.eyebrow}>WORKOUT TEMPLATE</Text>
        <Text style={styles.title}>Add exercise</Text>
        <Text style={styles.subtitle}>
          Choose an exercise and define its progression range.
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

        <Text style={styles.label}>Target sets</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setTargetSets}
          selectTextOnFocus
          style={styles.input}
          value={targetSets}
        />

        <Text style={styles.label}>Rep range</Text>
        <View style={styles.rangeRow}>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setRepMin}
            selectTextOnFocus
            style={[styles.input, styles.rangeInput]}
            value={repMin}
          />
          <Text style={styles.rangeSeparator}>to</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setRepMax}
            selectTextOnFocus
            style={[styles.input, styles.rangeInput]}
            value={repMax}
          />
        </View>

        <Text style={styles.label}>Target RIR</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setTargetRir}
          selectTextOnFocus
          style={styles.input}
          value={targetRir}
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
            <Text style={styles.saveText}>Add to template</Text>
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
  rangeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  rangeInput: {
    flex: 1,
  },
  rangeSeparator: {
    color: "#9CA3AF",
    marginBottom: 20,
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
