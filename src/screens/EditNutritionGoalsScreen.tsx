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

import { useProfile } from "../hooks/useProfile";
import {
  ACTIVITY_LABELS,
  ACTIVITY_LEVELS,
  CALORIE_DIRECTION_LABELS,
  CALORIE_DIRECTIONS,
  getMacroRecommendation,
  type ActivityLevel,
  type CalorieDirection,
  type EquationSex,
} from "../lib/macroRecommendation";
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
  const { profile } = useProfile();
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [equationSex, setEquationSex] =
    useState<EquationSex>("male");
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("moderate");
  const [calorieDirection, setCalorieDirection] =
    useState<CalorieDirection>("maintain");
  const [recommendationExplanation, setRecommendationExplanation] =
    useState<string | null>(null);
  const [calories, setCalories] = useState(initialCalories);
  const [protein, setProtein] = useState(initialProtein);
  const [carbs, setCarbs] = useState(initialCarbs);
  const [fat, setFat] = useState(initialFat);
  const [fiber, setFiber] = useState(initialFiber);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setAge(profile.age_years === null ? "" : String(profile.age_years));
      setHeightCm(profile.height_cm === null ? "" : String(profile.height_cm));
      setWeightKg(profile.weight_kg === null ? "" : String(profile.weight_kg));
      setEquationSex(profile.equation_sex ?? "male");
      setActivityLevel(profile.activity_level);
      setCalorieDirection(profile.calorie_direction);
    }
  }, [profile]);

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

  function handleCalculateRecommendation() {
    if (!profile) {
      setErrorMessage("Your coaching profile is still loading.");
      return;
    }

    try {
      const recommendation = getMacroRecommendation({
        activityLevel,
        age: Number(age),
        calorieDirection,
        equationSex,
        heightCm: Number(heightCm),
        trainingGoals: profile.training_goals,
        weightKg: Number(weightKg),
      });

      setCalories(String(recommendation.calories));
      setProtein(String(recommendation.proteinGrams));
      setCarbs(String(recommendation.carbsGrams));
      setFat(String(recommendation.fatGrams));
      setFiber(String(recommendation.fiberGrams));
      setRecommendationExplanation(recommendation.explanation);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to calculate a recommendation.",
      );
    }
  }

  async function handleSave() {
    const parsedAge = Number(age);
    const parsedHeight = Number(heightCm);
    const parsedWeight = Number(weightKg);
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

    await supabase
      .from("profiles")
      .update({
        activity_level: activityLevel,
        age_years: Number.isFinite(parsedAge) ? parsedAge : null,
        calorie_direction: calorieDirection,
        equation_sex: equationSex,
        height_cm: Number.isFinite(parsedHeight) ? parsedHeight : null,
        weight_kg: Number.isFinite(parsedWeight) ? parsedWeight : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

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

        <Text style={styles.eyebrow}>FORTOMNIA</Text>
        <Text style={styles.title}>Nutrition goals</Text>
        <Text style={styles.subtitle}>
          Set your daily calorie and macro targets.
        </Text>

        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationEyebrow}>COACH ESTIMATE</Text>
          <Text style={styles.recommendationTitle}>
            Calculate a starting point
          </Text>
          <Text style={styles.recommendationDescription}>
            For adults 18+. These estimates can be wrong for individuals and
            should be adjusted using your real weight, recovery, and performance
            trends.
          </Text>

          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                keyboardType="number-pad"
                onChangeText={setAge}
                placeholder="35"
                placeholderTextColor="#727885"
                style={styles.input}
                value={age}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setHeightCm}
                placeholder="175"
                placeholderTextColor="#727885"
                style={styles.input}
                value={heightCm}
              />
            </View>
          </View>

          <Text style={styles.label}>Body weight (kg)</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setWeightKg}
            placeholder="80"
            placeholderTextColor="#727885"
            style={styles.input}
            value={weightKg}
          />

          <Text style={styles.label}>Equation sex</Text>
          <Text style={styles.fieldHint}>
            The Mifflin–St Jeor equation uses different constants for male and
            female physiology.
          </Text>
          <View style={styles.choiceRow}>
            {(["female", "male"] as EquationSex[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => setEquationSex(option)}
                style={[
                  styles.choiceButton,
                  equationSex === option && styles.choiceButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    equationSex === option && styles.choiceTextSelected,
                  ]}
                >
                  {option === "female" ? "Female" : "Male"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Daily activity</Text>
          <View style={styles.choiceWrap}>
            {ACTIVITY_LEVELS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setActivityLevel(option)}
                style={[
                  styles.choiceButton,
                  activityLevel === option && styles.choiceButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    activityLevel === option && styles.choiceTextSelected,
                  ]}
                >
                  {ACTIVITY_LABELS[option]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Calorie direction</Text>
          <View style={styles.choiceWrap}>
            {CALORIE_DIRECTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setCalorieDirection(option)}
                style={[
                  styles.choiceButton,
                  calorieDirection === option && styles.choiceButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    calorieDirection === option && styles.choiceTextSelected,
                  ]}
                >
                  {CALORIE_DIRECTION_LABELS[option]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleCalculateRecommendation}
            style={styles.calculateButton}
          >
            <Text style={styles.calculateButtonText}>
              Calculate recommendation
            </Text>
          </Pressable>

          {recommendationExplanation ? (
            <Text style={styles.recommendationExplanation}>
              {recommendationExplanation}
            </Text>
          ) : null}
        </View>

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
  recommendationCard: {
    backgroundColor: "#15120F",
    borderColor: "#4A2D12",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    padding: 16,
  },
  recommendationEyebrow: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  recommendationTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
  },
  recommendationDescription: {
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
    marginTop: 6,
  },
  fieldHint: {
    color: "#727885",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
    marginTop: -4,
  },
  choiceRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  choiceButton: {
    borderColor: "#333333",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  choiceButtonSelected: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  choiceText: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "700",
  },
  choiceTextSelected: {
    color: "#0B0B0B",
  },
  calculateButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 11,
  },
  calculateButtonText: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "800",
  },
  recommendationExplanation: {
    color: "#D1D5DB",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
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
