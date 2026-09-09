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

import { type MealType } from "../hooks/useDailyNutrition";
import { getLocalDateKey } from "../lib/dates";
import {
  buildRememberedFoods,
  type RememberedFood,
} from "../lib/nutritionHistory";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

const mealTypes: MealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];
function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
export default function AddNutritionEntryScreen() {
    const router = useRouter();
  const {
    calories: caloriesParam,
    carbs: carbsParam,
    date: dateParam,
    entryId: entryIdParam,
    fat: fatParam,
    fiber: fiberParam,
    foodName: foodNameParam,
    mealType: mealTypeParam,
    protein: proteinParam,
    serving: servingParam,
  } = useLocalSearchParams<{
    calories?: string;
    carbs?: string;
    date?: string;
    entryId?: string;
    fat?: string;
    fiber?: string;
    foodName?: string;
    mealType?: string;
    protein?: string;
    serving?: string;
  }>();

  const entryDate = firstParam(dateParam) ?? getLocalDateKey();
  const editingEntryId = firstParam(entryIdParam);
  const initialMealType = firstParam(mealTypeParam) as
    | MealType
    | undefined;
  const initialFoodName = firstParam(foodNameParam);
  const initialServing = firstParam(servingParam);
  const initialCalories = firstParam(caloriesParam);
  const initialProtein = firstParam(proteinParam);
  const initialCarbs = firstParam(carbsParam);
  const initialFat = firstParam(fatParam);
  const initialFiber = firstParam(fiberParam);
  const isEditing = Boolean(editingEntryId);

  const { session } = useAuth();
  const [mealType, setMealType] = useState<MealType>(
    initialMealType ?? "breakfast",
  );
  const [foodName, setFoodName] = useState(initialFoodName ?? "");
  const [serving, setServing] = useState(initialServing ?? "");
  const [calories, setCalories] = useState(initialCalories ?? "");
  const [protein, setProtein] = useState(initialProtein ?? "");
  const [carbs, setCarbs] = useState(initialCarbs ?? "");
  const [fat, setFat] = useState(initialFat ?? "");
  const [fiber, setFiber] = useState(initialFiber ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberedFoods, setRememberedFoods] = useState<RememberedFood[]>([]);
  const [isLoadingRememberedFoods, setIsLoadingRememberedFoods] = useState(
    !isEditing,
  );

  useEffect(() => {
    setMealType(initialMealType ?? "breakfast");
    setFoodName(initialFoodName ?? "");
    setServing(initialServing ?? "");
    setCalories(initialCalories ?? "");
    setProtein(initialProtein ?? "");
    setCarbs(initialCarbs ?? "");
    setFat(initialFat ?? "");
    setFiber(initialFiber ?? "");
    setErrorMessage(null);
  }, [
    editingEntryId,
    initialCalories,
    initialCarbs,
    initialFat,
    initialFiber,
    initialFoodName,
    initialMealType,
    initialProtein,
    initialServing,
  ]);

  useEffect(() => {
    if (!session?.user.id || isEditing) {
      setRememberedFoods([]);
      setIsLoadingRememberedFoods(false);
      return;
    }

    let isCancelled = false;

    async function loadRememberedFoods() {
      setIsLoadingRememberedFoods(true);

      const { data, error } = await supabase
        .from("nutrition_entries")
        .select(
          "food_name, serving_description, calories, protein_g, carbs_g, fat_g, fiber_g",
        )
        .eq("user_id", session!.user.id)
        .order("consumed_at", { ascending: false })
        .limit(75);

      if (isCancelled) {
        return;
      }

      if (error) {
        setRememberedFoods([]);
      } else {
        setRememberedFoods(buildRememberedFoods(data ?? []));
      }
      setIsLoadingRememberedFoods(false);
    }

    void loadRememberedFoods();

    return () => {
      isCancelled = true;
    };
  }, [isEditing, session?.user.id]);

  function applyRememberedFood(food: RememberedFood) {
    setFoodName(food.food_name);
    setServing(food.serving_description ?? "");
    setCalories(String(food.calories));
    setProtein(String(food.protein_g));
    setCarbs(String(food.carbs_g));
    setFat(String(food.fat_g));
    setFiber(String(food.fiber_g));
    setErrorMessage(null);
  }

  async function handleSave() {
    const trimmedName = foodName.trim();
    const parsedCalories = Number(calories);
    const parsedProtein = Number(protein);
    const parsedCarbs = Number(carbs);
    const parsedFat = Number(fat);
    const parsedFiber = Number(fiber);

    if (!session?.user.id) {
      setErrorMessage("No authenticated user was found.");
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Food name is required.");
      return;
    }

    if (
      !Number.isInteger(parsedCalories) ||
      parsedCalories < 0 ||
      parsedCalories > 10000
    ) {
      setErrorMessage(
        "Calories must be a whole number from 0 to 10,000.",
      );
      return;
    }

    const macros = [
      { label: "Protein", max: 2000, value: parsedProtein },
      { label: "Carbs", max: 2000, value: parsedCarbs },
      { label: "Fat", max: 2000, value: parsedFat },
      { label: "Fiber", max: 500, value: parsedFiber },
    ];

    const invalidMacro = macros.find(
      (macro) =>
        !Number.isFinite(macro.value) ||
        macro.value < 0 ||
        macro.value > macro.max,
    );

    if (invalidMacro) {
      setErrorMessage(
        `${invalidMacro.label} must be from 0 to ${invalidMacro.max} grams.`,
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    if (isEditing && editingEntryId) {
      const { data, error } = await supabase
        .from("nutrition_entries")
        .update({
          calories: parsedCalories,
          carbs_g: parsedCarbs,
          entry_date: entryDate,
          fat_g: parsedFat,
          fiber_g: parsedFiber,
          food_name: trimmedName,
          meal_type: mealType,
          protein_g: parsedProtein,
          serving_description: serving.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingEntryId)
        .eq("user_id", session.user.id)
        .select("id")
        .maybeSingle();

      setIsSaving(false);

      if (error || !data) {
        setErrorMessage(
          error?.message ?? "The food entry was not updated.",
        );
        return;
      }

      router.replace("/nutrition");
      return;
    }

    const { error } = await supabase
      .from("nutrition_entries")
      .insert({
        calories: parsedCalories,
        carbs_g: parsedCarbs,
        entry_date: entryDate,
        fat_g: parsedFat,
        fiber_g: parsedFiber,
        food_name: trimmedName,
        meal_type: mealType,
        protein_g: parsedProtein,
        serving_description: serving.trim() || null,
        user_id: session.user.id,
      });

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
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

        <Text style={styles.eyebrow}>FORTOMNIA</Text>
        <Text style={styles.title}>
          {isEditing ? "Edit food" : "Log food"}
        </Text>
        <Text style={styles.subtitle}>
        {isEditing
        ? "Correct the meal, serving, calories, or macros."
        : "Record calories and macros for today."}
     </Text>

        {!isEditing ? (
          <View style={styles.rememberedSection}>
            <View style={styles.rememberedHeader}>
              <Text style={styles.label}>Recent foods</Text>
              {isLoadingRememberedFoods ? (
                <ActivityIndicator color="#F97316" size="small" />
              ) : null}
            </View>
            {rememberedFoods.length > 0 ? (
              <ScrollView
                horizontal
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
                style={styles.rememberedList}
              >
                {rememberedFoods.map((food) => {
                  const key = `${food.food_name}::${food.serving_description ?? ""}`;

                  return (
                    <Pressable
                      accessibilityHint="Fills in the saved serving and nutrition facts"
                      accessibilityLabel={`Use saved food ${food.food_name}`}
                      accessibilityRole="button"
                      key={key}
                      onPress={() => applyRememberedFood(food)}
                      style={styles.rememberedFoodButton}
                    >
                      <Text style={styles.rememberedFoodName}>
                        {food.food_name}
                      </Text>
                      <Text style={styles.rememberedFoodDetails}>
                        {food.serving_description
                          ? `${food.serving_description} • `
                          : ""}
                        {food.calories} cal
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : !isLoadingRememberedFoods ? (
              <Text style={styles.rememberedEmpty}>
                Foods you log will appear here for quick reuse.
              </Text>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.label}>Meal</Text>
        <View style={styles.mealRow}>
          {mealTypes.map((option) => {
            const selected = mealType === option;

            return (
              <Pressable
                key={option}
                onPress={() => setMealType(option)}
                style={[
                  styles.mealButton,
                  selected && styles.mealButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.mealText,
                    selected && styles.mealTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Food name</Text>
        <TextInput
          autoCapitalize="words"
          onChangeText={setFoodName}
          placeholder="Chicken breast, oatmeal, protein shake..."
          placeholderTextColor="#727885"
          style={styles.input}
          value={foodName}
        />

        <Text style={styles.label}>Serving</Text>
        <TextInput
          onChangeText={setServing}
          placeholder="8 oz, 1 bowl, 2 scoops..."
          placeholderTextColor="#727885"
          style={styles.input}
          value={serving}
        />

        <Text style={styles.label}>Calories</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setCalories}
          placeholder="0"
          placeholderTextColor="#727885"
          style={styles.input}
          value={calories}
        />

        <View style={styles.macroRow}>
          <View style={styles.macroInputGroup}>
            <Text style={styles.label}>Protein (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setProtein}
              placeholder="0"
              placeholderTextColor="#727885"
              style={styles.input}
              value={protein}
            />
          </View>

          <View style={styles.macroInputGroup}>
            <Text style={styles.label}>Carbs (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setCarbs}
              placeholder="0"
              placeholderTextColor="#727885"
              style={styles.input}
              value={carbs}
            />
          </View>
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroInputGroup}>
            <Text style={styles.label}>Fat (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setFat}
              placeholder="0"
              placeholderTextColor="#727885"
              style={styles.input}
              value={fat}
            />
          </View>

          <View style={styles.macroInputGroup}>
            <Text style={styles.label}>Fiber (g)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setFiber}
              placeholder="0"
              placeholderTextColor="#727885"
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
            <Text style={styles.saveText}>
             {isEditing ? "Save changes" : "Save food"}
        </Text>
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
  rememberedSection: {
    marginBottom: 24,
  },
  rememberedHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  rememberedList: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  rememberedFoodButton: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
    minWidth: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rememberedFoodName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  rememberedFoodDetails: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  rememberedEmpty: {
    color: "#727885",
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  mealRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  mealButton: {
    backgroundColor: "#171717",
    borderColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mealButtonSelected: {
    borderColor: "#F97316",
  },
  mealText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  mealTextSelected: {
    color: "#F97316",
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
  macroRow: {
    flexDirection: "row",
    gap: 12,
  },
  macroInputGroup: {
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
