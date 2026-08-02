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

import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function EditNutritionGoalsScreen() {
  const router = useRouter();
  const {
    calories: caloriesParam,
    carbs: carbsParam,
    fat: fatParam,
    fiber: fiberParam,
    protein: proteinParam,
  } = useLocalSearchParams<{
    calories?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
    protein?: string;
  }>();

  const initialCalories = firstParam(caloriesParam) ?? "2000";
  const initialProtein = firstParam(proteinParam) ?? "150";
  const initialCarbs = firstParam(carbsParam) ?? "200";
  const initialFat = firstParam(fatParam) ?? "70";
  const initialFiber = firstParam(fiberParam) ?? "25";

  const { session } = useAuth();
  const [calories, setCalories] = useState(initialCalories);
  const [protein, setProtein] = useState(initialProtein);
  const [carbs, setCarbs] = useState(initialCarbs);
  const [fat, setFat] = useState(initialFat);
  const [fiber, setFiber] = useState(initialFiber);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setCalories(initialCalories);
    setProtein(initialProtein);
    setCarbs(initialCarbs);
    setFat(initialFat);
    setFiber(initialFiber);
    setErrorMessage(null);
  }, [
    initialCalories,
    initialCarbs,
    initialFat,
    initialFiber,
    initialProtein,
  ]);

  async function handleSave() {
    const parsedCalories = Number(calories);
    const parsedProtein = Number(protein);
    const parsedCarbs = Number(carbs);
    const parsedFat = Number(fat);
    const parsedFiber = Number(fiber);

    if (!session?.user.id) {
      setErrorMessage("No authenticated user was found.");
      return;
    }

    if (
      !Number.isInteger(parsedCalories) ||
      parsedCalories < 500 ||
      parsedCalories > 10000
    ) {
      setErrorMessage(
        "Calories must be a whole number from 500 to 10,000.",
      );
      return;
    }

    const macroGoals = [
      { label: "Protein", max: 2000, value: parsedProtein },
      { label: "Carbs", max: 2000, value: parsedCarbs },
      { label: "Fat", max: 2000, value: parsedFat },
      { label: "Fiber", max: 500, value: parsedFiber },
    ];

    const invalidGoal = macroGoals.find(
      (goal) =>
        !Number.isFinite(goal.value) ||
        goal.value < 0 ||
        goal.value > goal.max,
    );

    if (invalidGoal) {
      setErrorMessage(
        `${invalidGoal.label} must be from 0 to ${invalidGoal.max} grams.`,
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("nutrition_goals")
      .upsert(
        {
          calorie_target: parsedCalories,
          carbs_target_g: parsedCarbs,
          fat_target_g: parsedFat,
          fiber_target_g: parsedFiber,
          protein_target_g: parsedProtein,
          updated_at: new Date().toISOString(),
          user_id: session.user.id,
        },
        {
          onConflict: "user_id",
        },
      )
      .select("user_id")
      .maybeSingle();

    setIsSaving(false);

    if (error || !data) {
      setErrorMessage(
        error?.message ?? "Your nutrition goals were not saved.",
      );
      return;
    }

    router.replace("/nutrition");
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
          onPress={() => router.replace("/nutrition")}
          style={styles.navigation}
        >
          <Text style={styles.navigationText}>‹ Nutrition</Text>
        </Pressable>

        <Text style={styles.eyebrow}>IRONFORGE</Text>
        <Text style={styles.title}>Nutrition goals</Text>
        <Text style={styles.subtitle}>
          Set your daily calorie and macro targets.
        </Text>

        <Text style={styles.label}>Calories</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setCalories}
          selectTextOnFocus
          style={styles.input}
          value={calories}
        />

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setProtein}
              selectTextOnFocus
              style={styles.input}
              value={protein}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Carbs (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setCarbs}
              selectTextOnFocus
              style={styles.input}
              value={carbs}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fat (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setFat}
              selectTextOnFocus
              style={styles.input}
              value={fat}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fiber (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setFiber}
              selectTextOnFocus
              style={styles.input}
              value={fiber}
            />
          </View>
        </View>

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
            <Text style={styles.saveText}>Save goals</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  input: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
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
