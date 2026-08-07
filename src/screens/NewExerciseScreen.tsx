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

import {
  type ExerciseMovementPattern,
} from "../hooks/useExercises";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

const movementPatterns: ExerciseMovementPattern[] = [
  "squat",
  "hinge",
  "horizontal_push",
  "vertical_push",
  "horizontal_pull",
  "vertical_pull",
  "lunge",
  "carry",
  "rotation",
  "isolation",
  "conditioning",
  "mobility",
  "other",
];

function formatOption(value: string) {
  return value.replaceAll("_", " ");
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function NewExerciseScreen() {
  const router = useRouter();
  const { exerciseId: exerciseIdParam } = useLocalSearchParams<{
    exerciseId?: string;
  }>();
  const editingExerciseId = Array.isArray(exerciseIdParam)
    ? exerciseIdParam[0]
    : exerciseIdParam;
  const isEditing = Boolean(editingExerciseId);
  const { session } = useAuth();

  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [aliases, setAliases] = useState("");
  const [secondaryMuscles, setSecondaryMuscles] = useState("");
  const [movementPattern, setMovementPattern] =
    useState<ExerciseMovementPattern>("other");
  const [instructions, setInstructions] = useState("");
  const [isUnilateral, setIsUnilateral] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingExercise, setIsLoadingExercise] = useState(
    isEditing,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    let isActive = true;

    async function loadExercise() {
      if (!editingExerciseId || !session?.user.id) {
        setIsLoadingExercise(false);
        return;
      }

      setIsLoadingExercise(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("exercises")
        .select(
          `
            name,
            muscle_group,
            equipment,
            aliases,
            secondary_muscles,
            movement_pattern,
            instructions,
            is_unilateral
          `,
        )
        .eq("id", editingExerciseId)
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (error || !data) {
        setErrorMessage(
          error?.message ?? "Custom exercise not found.",
        );
        setIsLoadingExercise(false);
        return;
      }

      setName(data.name);
      setMuscleGroup(data.muscle_group);
      setEquipment(data.equipment ?? "");
      setAliases((data.aliases ?? []).join(", "));
      setSecondaryMuscles(
        (data.secondary_muscles ?? []).join(", "),
      );
      setMovementPattern(
        data.movement_pattern as ExerciseMovementPattern,
      );
      setInstructions(data.instructions ?? "");
      setIsUnilateral(data.is_unilateral);
      setIsLoadingExercise(false);
    }

    void loadExercise();

    return () => {
      isActive = false;
    };
  }, [editingExerciseId, session?.user.id]);

    async function handleSave() {
    const trimmedName = name.trim();
    const trimmedMuscleGroup = muscleGroup.trim();

    if (!session?.user.id) {
      setErrorMessage("No authenticated user was found.");
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Exercise name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMessage("Exercise name must be 100 characters or fewer.");
      return;
    }

    if (!trimmedMuscleGroup) {
      setErrorMessage("Primary muscle group is required.");
      return;
    }

        setIsSaving(true);
    setErrorMessage(null);

    const values = {
      aliases: parseList(aliases),
      equipment: equipment.trim() || null,
      instructions: instructions.trim() || null,
      is_unilateral: isUnilateral,
      movement_pattern: movementPattern,
      muscle_group: trimmedMuscleGroup,
      name: trimmedName,
      secondary_muscles: parseList(secondaryMuscles),
    };

    let savedExerciseId: string;

    if (isEditing && editingExerciseId) {
      const { data, error } = await supabase
        .from("exercises")
        .update(values)
        .eq("id", editingExerciseId)
        .eq("owner_id", session.user.id)
        .select("id")
        .maybeSingle();

      if (error || !data) {
        setIsSaving(false);

        if (error?.code === "23505") {
          setErrorMessage(
            "You already have a custom exercise with this name.",
          );
        } else {
          setErrorMessage(
            error?.message ?? "The custom exercise was not updated.",
          );
        }
        return;
      }

      savedExerciseId = data.id;
    } else {
      const { data, error } = await supabase
        .from("exercises")
        .insert({
          ...values,
          owner_id: session.user.id,
        })
        .select("id")
        .single();

      if (error) {
        setIsSaving(false);

        if (error.code === "23505") {
          setErrorMessage(
            "You already have a custom exercise with this name.",
          );
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      savedExerciseId = data.id;
    }

    setIsSaving(false);

    router.replace({
      pathname: "/exercise/[id]",
      params: { id: savedExerciseId },
    });
   }
if (isLoadingExercise) {
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
          onPress={() => {
            if (isEditing && editingExerciseId) {
              router.replace({
                pathname: "/exercise/[id]",
                params: { id: editingExerciseId },
              });
            } else {
              router.replace("/training");
            }
          }}
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>
  {isEditing ? "‹ Exercise" : "‹ Training"}
</Text>
        </Pressable>

        <Text style={styles.eyebrow}>EXERCISE LIBRARY</Text>
       <Text style={styles.title}>
          {isEditing ? "Edit custom exercise" : "Custom exercise"}
        </Text>
        <Text style={styles.subtitle}>
          {isEditing
            ? "Update your private exercise details."
            : "Add a private exercise that only appears in your library."}
        </Text>
       <Text style={styles.label}>Exercise name</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={setName}
          placeholder="Cable Y-raise"
          placeholderTextColor="#727885"
          style={styles.input}
          value={name}
        />

        <Text style={styles.label}>Primary muscle group</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={setMuscleGroup}
          placeholder="Shoulders"
          placeholderTextColor="#727885"
          style={styles.input}
          value={muscleGroup}
        />

        <Text style={styles.label}>Equipment (optional)</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={setEquipment}
          placeholder="Cable"
          placeholderTextColor="#727885"
          style={styles.input}
          value={equipment}
        />

        <Text style={styles.label}>Aliases (optional)</Text>
        <TextInput
          onChangeText={setAliases}
          placeholder="Y raise, cable trap raise"
          placeholderTextColor="#727885"
          style={styles.input}
          value={aliases}
        />
        <Text style={styles.helper}>
          Separate multiple aliases with commas.
        </Text>

        <Text style={styles.label}>Secondary muscles (optional)</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={setSecondaryMuscles}
          placeholder="Traps, upper back"
          placeholderTextColor="#727885"
          style={styles.input}
          value={secondaryMuscles}
        />
        <Text style={styles.helper}>
          Separate multiple muscle groups with commas.
        </Text>

        <Text style={styles.label}>Movement pattern</Text>
        <View style={styles.optionRow}>
          {movementPatterns.map((option) => {
            const selected = movementPattern === option;

            return (
              <Pressable
                key={option}
                onPress={() => setMovementPattern(option)}
                style={[
                  styles.optionButton,
                  selected && styles.optionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {formatOption(option)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Configuration</Text>
        <Pressable
          onPress={() => setIsUnilateral((current) => !current)}
          style={[
            styles.toggleButton,
            isUnilateral && styles.toggleButtonSelected,
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              isUnilateral && styles.toggleTextSelected,
            ]}
          >
            {isUnilateral
              ? "Unilateral exercise"
              : "Bilateral exercise"}
          </Text>
        </Pressable>

        <Text style={styles.label}>Instructions (optional)</Text>
        <TextInput
          multiline
          onChangeText={setInstructions}
          placeholder="Add setup notes or form cues..."
          placeholderTextColor="#727885"
          style={[styles.input, styles.notesInput]}
          textAlignVertical="top"
          value={instructions}
        />

        {errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : null}

        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          style={[
            styles.saveButton,
            isSaving && styles.disabled,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
            <Text style={styles.saveText}>
  {isEditing ? "Save changes" : "Create exercise"}
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
    paddingBottom: 48,
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  navigation: {
    alignSelf: "flex-start",
    marginBottom: 28,
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
    marginBottom: 12,
    marginTop: 8,
  },
  label: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 18,
  },
  input: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 110,
  },
  helper: {
    color: "#727885",
    fontSize: 12,
    marginTop: 6,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    borderColor: "#333333",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionButtonSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  optionText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  optionTextSelected: {
    color: "#0B0B0B",
  },
  toggleButton: {
    alignItems: "center",
    borderColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    padding: 13,
  },
  toggleButtonSelected: {
    backgroundColor: "#2A180B",
    borderColor: "#F97316",
  },
  toggleText: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "700",
  },
  toggleTextSelected: {
    color: "#FDBA74",
  },
  error: {
    color: "#F87171",
    lineHeight: 20,
    marginTop: 18,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 10,
    marginTop: 24,
    paddingVertical: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  saveText: {
    color: "#0B0B0B",
    fontSize: 15,
    fontWeight: "800",
  },
});
