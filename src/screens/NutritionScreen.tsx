import { useState } from "react";
import { Link, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  type NutritionEntry,
  useDailyNutrition,
} from "../hooks/useDailyNutrition";
import {
  getCalorieTargetForDate,
  WEEKDAY_LABELS,
} from "../lib/calorieTargets";
import { getLocalDateKey } from "../lib/dates";
import { buildMealProgress } from "../lib/mealProgress";
import { getPerMealTargets } from "../lib/mealTargets";
import { flOzToMl, mlToFlOz } from "../lib/measurementUnits";
import { useProfile } from "../hooks/useProfile";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
type NutritionEntryCardProps = {
  entry: NutritionEntry;
  onDelete: (entry: NutritionEntry) => void;
  onEdit: (entry: NutritionEntry) => void;
};

function NutritionEntryCard({
  entry,
  onDelete,
  onEdit,
}: NutritionEntryCardProps) {
  return (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryTitleGroup}>
          <Text style={styles.entryName}>{entry.food_name}</Text>
          <Text style={styles.mealType}>
            {entry.meal_number ? `MEAL ${entry.meal_number}` : entry.meal_type.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.entryCalories}>
          {entry.calories} cal
        </Text>
      </View>

      {entry.serving_description ? (
        <Text style={styles.serving}>
          {entry.serving_description}
        </Text>
      ) : null}

      <Text style={styles.entryMacros}>
        P {entry.protein_g}g • C {entry.carbs_g}g • F {entry.fat_g}g
      </Text>

      <View style={styles.entryActions}>
        <Pressable
          onPress={() => onEdit(entry)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit food</Text>
        </Pressable>

        <Pressable
          onPress={() => onDelete(entry)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete food</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MacroCard({
  label,
  target,
  value,
}: {
  label: string;
  target: number;
  value: number;
}) {
  const remaining = Math.round(target - value);
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{Math.round(value)}g</Text>
      <Text style={styles.macroTarget}>
        of {Math.round(target)}g
      </Text>
      <Text
        style={[
          styles.remaining,
          remaining < 0 && styles.overTarget,
        ]}
      >
        {remaining >= 0
          ? `${remaining}g left`
          : `${Math.abs(remaining)}g over`}
      </Text>
    </View>
  );
}
function shiftDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);

  return getLocalDateKey(date);
}
export default function NutritionScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const today = getLocalDateKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [customWaterAmount, setCustomWaterAmount] = useState("");
  const [waterErrorMessage, setWaterErrorMessage] = useState<string | null>(
    null,
  );
  const isToday = selectedDate === today;
  const {
    addWater,
    deleteWater,
    entries,
    errorMessage,
    goals,
    isLoading,
    isSavingWater,
    refreshNutrition,
    totals,
    waterEntries,
    waterTotalMl,
  } = useDailyNutrition(selectedDate);
  const { profile } = useProfile();
  const usesFluidOunces = profile?.preferred_weight_unit !== "kg";
  const waterUnit = usesFluidOunces ? "fl oz" : "mL";
  const quickWaterAmounts = usesFluidOunces
    ? [8, 12, 16]
    : [250, 500, 750];
  const waterTotal = usesFluidOunces
    ? mlToFlOz(waterTotalMl)
    : waterTotalMl;
  const waterGoal =
    goals.water_target_ml === null
      ? null
      : usesFluidOunces
        ? mlToFlOz(goals.water_target_ml)
        : goals.water_target_ml;
  const effectiveCalorieTarget = getCalorieTargetForDate(
    goals.calorie_target,
    goals.weekday_calorie_targets,
    selectedDate,
  );
  const selectedWeekday = new Date(
    `${selectedDate}T00:00:00Z`,
  ).getUTCDay();
  const calorieRemaining = effectiveCalorieTarget - totals.calories;
  const perMealTargets = getPerMealTargets(
    { ...goals, calorie_target: effectiveCalorieTarget },
    goals.meal_count,
  );
  const mealProgress = buildMealProgress(entries, goals.meal_count);
  async function handleAddWater(displayAmount: number) {
    const amountMl = usesFluidOunces
      ? flOzToMl(displayAmount)
      : Math.round(displayAmount);
    const saveError = await addWater(amountMl);

    if (saveError) {
      setWaterErrorMessage(saveError);
      return;
    }

    setCustomWaterAmount("");
    setWaterErrorMessage(null);
  }

  function handleAddCustomWater() {
    const parsedAmount = Number(customWaterAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setWaterErrorMessage(`Enter a water amount greater than 0 ${waterUnit}.`);
      return;
    }

    void handleAddWater(parsedAmount);
  }

  function handleDeleteWater(entryId: string, amountMl: number) {
    const amount = usesFluidOunces
      ? `${mlToFlOz(amountMl)} fl oz`
      : `${amountMl} mL`;

    Alert.alert("Delete water entry?", `${amount} will be removed.`, [
      { style: "cancel", text: "Cancel" },
      {
        style: "destructive",
        text: "Delete",
        onPress: async () => {
          const deleteError = await deleteWater(entryId);
          setWaterErrorMessage(deleteError);
        },
      },
    ]);
  }

  function handleEditEntry(entry: NutritionEntry) {
    router.push({
      pathname: "/new-nutrition-entry",
      params: {
        calories: String(entry.calories),
        carbs: String(entry.carbs_g),
        date: entry.entry_date,
        entryId: entry.id,
        fat: String(entry.fat_g),
        fiber: String(entry.fiber_g),
        foodName: entry.food_name,
        mealCount: String(goals.meal_count),
        mealNumber: String(entry.meal_number ?? 1),
        protein: String(entry.protein_g),
        serving: entry.serving_description ?? "",
      },
    });
  }

  function handleDeleteEntry(entry: NutritionEntry) {
    if (!session?.user.id) {
      Alert.alert(
        "Unable to delete food",
        "Your user session is missing.",
      );
      return;
    }

    Alert.alert(
      "Delete food?",
      `${entry.food_name} will be removed from this nutrition log.`,
      [
        {
          style: "cancel",
          text: "Cancel",
        },
        {
          style: "destructive",
          text: "Delete",
          onPress: async () => {
            const { data, error } = await supabase
              .from("nutrition_entries")
              .delete()
              .eq("id", entry.id)
              .eq("user_id", session.user.id)
              .select("id")
              .maybeSingle();

            if (error || !data) {
              Alert.alert(
                "Unable to delete food",
                error?.message ?? "The food entry was not removed.",
              );
              return;
            }

            await refreshNutrition();
          },
        },
      ],
    );
  }

  if (isLoading && entries.length === 0) {
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
        data={entries}
        keyExtractor={(entry) => entry.id}
        onRefresh={() => void refreshNutrition()}
        refreshing={isLoading}
        renderItem={({ item }) => (
  <NutritionEntryCard
    entry={item}
    onDelete={handleDeleteEntry}
    onEdit={handleEditEntry}
  />
)}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>FORTOMNIA</Text>
            <Text style={styles.title}>Nutrition</Text>
            <Text style={styles.date}>
              {new Date(
                `${selectedDate}T12:00:00`,
              ).toLocaleDateString(undefined, {
                dateStyle: "full",
              })}
            </Text>
            <View style={styles.dateNavigation}>
              <Pressable
                  accessibilityLabel="View previous day"
                  accessibilityRole="button"
                  onPress={() =>
                  setSelectedDate((current) => shiftDate(current, -1))
                }
                style={styles.dateButton}
              >
                <Text style={styles.dateButtonText}>‹ Previous</Text>
              </Pressable>

              <Pressable
                  accessibilityLabel="Return to today"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isToday }}
                disabled={isToday}
                onPress={() => setSelectedDate(today)}
                style={[
                  styles.todayButton,
                  isToday && styles.dateButtonDisabled,
                ]}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </Pressable>

              <Pressable
                  accessibilityLabel="View next day"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isToday }}
                disabled={isToday}
                onPress={() =>
                  setSelectedDate((current) => shiftDate(current, 1))
                }
                style={[
                  styles.dateButton,
                  isToday && styles.dateButtonDisabled,
                ]}
              >
                <Text style={styles.dateButtonText}>Next ›</Text>
              </Pressable>
            </View>
                         <Link
              href={{
                pathname: "/new-nutrition-entry",
                params: {
                  date: selectedDate,
                  mealCount: String(goals.meal_count),
                },
              }}
              asChild
            >
              <Pressable style={styles.logButton}>
                <Text style={styles.logButtonText}>Log food</Text>
              </Pressable>
            </Link>
                         <Link
              href={{
                pathname: "/nutrition-goals",
                params: {
                  calories: String(goals.calorie_target),
                  carbs: String(goals.carbs_target_g),
                  fat: String(goals.fat_target_g),
                  fiber: String(goals.fiber_target_g),
                  mealCount: String(goals.meal_count),
                  protein: String(goals.protein_target_g),
                  waterGoalMl:
                    goals.water_target_ml === null
                      ? ""
                      : String(goals.water_target_ml),
                  weekdayCalories: goals.weekday_calorie_targets.join(","),
                },
              }}
              asChild
            >
              <Pressable style={styles.goalsButton}>
                <Text style={styles.goalsButtonText}>
                  Edit nutrition goals
                </Text>
              </Pressable>
            </Link>

            {errorMessage ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={styles.error}
          >
            {errorMessage}
          </Text>
            ) : null}

            <View style={styles.calorieCard}>
              <Text style={styles.calorieLabel}>
  {isToday ? "TODAY'S CALORIES" : "DAILY CALORIES"}
</Text>
              <Text style={styles.calorieValue}>
                {totals.calories}
              </Text>
              <Text style={styles.calorieTarget}>
                of {effectiveCalorieTarget} calories
                {goals.weekday_calorie_targets.length === 7
                  ? ` • ${WEEKDAY_LABELS[selectedWeekday]} target`
                  : ""}
              </Text>
              <Text
                style={[
                  styles.remaining,
                  calorieRemaining < 0 && styles.overTarget,
                ]}
              >
                {calorieRemaining >= 0
                  ? `${calorieRemaining} calories remaining`
                  : `${Math.abs(calorieRemaining)} calories over`}
              </Text>
            </View>

            <View style={styles.macroRow}>
              <MacroCard
                label="Protein"
                target={goals.protein_target_g}
                value={totals.protein_g}
              />
              <MacroCard
                label="Carbs"
                target={goals.carbs_target_g}
                value={totals.carbs_g}
              />
              <MacroCard
                label="Fat"
                target={goals.fat_target_g}
                value={totals.fat_g}
              />
            </View>

            <Text style={styles.fiber}>
              Fiber: {Math.round(totals.fiber_g)}g of{" "}
              {Math.round(goals.fiber_target_g)}g
            </Text>

            <View style={styles.waterCard}>
              <Text style={styles.waterEyebrow}>WATER</Text>
              <Text style={styles.waterValue}>
                {waterTotal} {waterUnit}
              </Text>
              <Text style={styles.waterGoal}>
                {waterGoal === null
                  ? "Set a personal goal in Nutrition goals"
                  : `of ${waterGoal} ${waterUnit}`}
              </Text>

              <View style={styles.waterQuickActions}>
                {quickWaterAmounts.map((amount) => (
                  <Pressable
                    accessibilityLabel={`Add ${amount} ${waterUnit} of water`}
                    accessibilityRole="button"
                    disabled={isSavingWater}
                    key={amount}
                    onPress={() => void handleAddWater(amount)}
                    style={[
                      styles.waterQuickButton,
                      isSavingWater && styles.waterButtonDisabled,
                    ]}
                  >
                    <Text style={styles.waterQuickText}>
                      +{amount} {waterUnit}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.waterCustomRow}>
                <TextInput
                  accessibilityLabel={`Custom water amount in ${waterUnit}`}
                  inputMode="decimal"
                  onChangeText={setCustomWaterAmount}
                  placeholder={usesFluidOunces ? "Custom fl oz" : "Custom mL"}
                  placeholderTextColor="#727885"
                  style={styles.waterInput}
                  value={customWaterAmount}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={isSavingWater}
                  onPress={handleAddCustomWater}
                  style={[
                    styles.waterAddButton,
                    isSavingWater && styles.waterButtonDisabled,
                  ]}
                >
                  <Text style={styles.waterAddText}>Add water</Text>
                </Pressable>
              </View>

              {waterErrorMessage ? (
                <Text
                  accessibilityLiveRegion="polite"
                  accessibilityRole="alert"
                  style={styles.waterError}
                >
                  {waterErrorMessage}
                </Text>
              ) : null}

              {waterEntries.length > 0 ? (
                <View style={styles.waterEntryList}>
                  {waterEntries.map((entry) => (
                    <View key={entry.id} style={styles.waterEntry}>
                      <Text style={styles.waterEntryText}>
                        {usesFluidOunces
                          ? `${mlToFlOz(entry.amount_ml)} fl oz`
                          : `${entry.amount_ml} mL`}
                      </Text>
                      <Pressable
                        accessibilityLabel="Delete water entry"
                        accessibilityRole="button"
                        disabled={isSavingWater}
                        onPress={() =>
                          handleDeleteWater(entry.id, entry.amount_ml)
                        }
                      >
                        <Text style={styles.waterDeleteText}>Delete</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.perMealCard}>
              <Text style={styles.perMealTitle}>
                PER-MEAL TARGET • {goals.meal_count} MEALS
              </Text>
              <Text style={styles.perMealCalories}>
                About {perMealTargets.calories} calories per meal
              </Text>
              <Text style={styles.perMealMacros}>
                P {perMealTargets.proteinGrams}g • C {perMealTargets.carbsGrams}g
                {" • "}F {perMealTargets.fatGrams}g • Fiber{" "}
                {perMealTargets.fiberGrams}g
              </Text>
            </View>

            <Text style={styles.mealProgressHeading}>Meal progress</Text>
            <View style={styles.mealProgressList}>
              {mealProgress.map((meal) => {
                const caloriesRemaining =
                  perMealTargets.calories - meal.calories;

                return (
                  <View key={meal.mealNumber} style={styles.mealProgressCard}>
                    <View style={styles.mealProgressHeader}>
                      <Text style={styles.mealProgressTitle}>
                        Meal {meal.mealNumber}
                      </Text>
                      <Text
                        style={[
                          styles.mealProgressRemaining,
                          caloriesRemaining < 0 && styles.overTarget,
                        ]}
                      >
                        {caloriesRemaining >= 0
                          ? `${caloriesRemaining} cal left`
                          : `${Math.abs(caloriesRemaining)} cal over`}
                      </Text>
                    </View>
                    <Text style={styles.mealProgressCalories}>
                      {meal.calories} / {perMealTargets.calories} calories
                    </Text>
                    <Text style={styles.mealProgressMacros}>
                      P {Math.round(meal.proteinGrams)}g /{" "}
                      {perMealTargets.proteinGrams}g • C{" "}
                      {Math.round(meal.carbsGrams)}g /{" "}
                      {perMealTargets.carbsGrams}g • F{" "}
                      {Math.round(meal.fatGrams)}g / {perMealTargets.fatGrams}g
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>
  {isToday ? "Today's food" : "Food log"}
</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
  {isToday ? "No food logged today" : "No food logged for this day"}
</Text>
            <Text style={styles.emptyText}>
              Add your first meal to begin tracking calories and macros.
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
    paddingTop: 24,
  },
  eyebrow: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    marginTop: 8,
  },
  date: {
    color: "#9CA3AF",
    fontSize: 15,
    marginBottom: 24,
    marginTop: 6,
  },
  error: {
    color: "#F87171",
    marginBottom: 18,
  },
  dateNavigation: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  dateButton: {
    alignItems: "center",
    borderColor: "#333333",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  dateButtonText: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
  },
  todayButton: {
    alignItems: "center",
    borderColor: "#2563EB",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
  },
  todayButtonText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "800",
  },
  dateButtonDisabled: {
    opacity: 0.35,
  },
  logButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 52,
  },
  goalsButton: {
    alignItems: "center",
    borderColor: "#2563EB",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 20,
    minHeight: 52,
  },
  goalsButtonText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "800",
  },
  logButtonText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "800",
  },
  calorieCard: {
    backgroundColor: "#1A1A1A",
    borderColor: "#2A2A2A",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  calorieLabel: {
    color: "#F97316",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  calorieValue: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "800",
    marginTop: 8,
  },
  calorieTarget: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 3,
  },
  macroRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  macroCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  macroLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "700",
  },
  macroValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 7,
  },
  macroTarget: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 2,
  },
  remaining: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
  },
  overTarget: {
    color: "#F87171",
  },
  fiber: {
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 28,
    marginTop: 12,
  },
  waterCard: {
    backgroundColor: "#111827",
    borderColor: "#2563EB",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    padding: 18,
  },
  waterEyebrow: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  waterValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 7,
  },
  waterGoal: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 3,
  },
  waterQuickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  waterQuickButton: {
    borderColor: "#2563EB",
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  waterQuickText: {
    color: "#60A5FA",
    fontSize: 13,
    fontWeight: "700",
  },
  waterCustomRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  waterInput: {
    backgroundColor: "#171717",
    borderColor: "#374151",
    borderRadius: 9,
    borderWidth: 1,
    color: "#FFFFFF",
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  waterAddButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 9,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  waterAddText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  waterButtonDisabled: {
    opacity: 0.5,
  },
  waterError: {
    color: "#F87171",
    fontSize: 12,
    marginTop: 10,
  },
  waterEntryList: {
    gap: 7,
    marginTop: 14,
  },
  waterEntry: {
    alignItems: "center",
    backgroundColor: "#171717",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  waterEntryText: {
    color: "#D1D5DB",
    fontSize: 13,
  },
  waterDeleteText: {
    color: "#F87171",
    fontSize: 12,
    fontWeight: "700",
  },
  perMealCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    padding: 14,
  },
  perMealTitle: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  perMealCalories: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  perMealMacros: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 5,
  },
  mealProgressHeading: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  mealProgressList: {
    gap: 8,
    marginBottom: 24,
  },
  mealProgressCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 12,
    borderWidth: 1,
    padding: 13,
  },
  mealProgressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mealProgressTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  mealProgressRemaining: {
    color: "#34D399",
    fontSize: 11,
    fontWeight: "700",
  },
  mealProgressCalories: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 7,
  },
  mealProgressMacros: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  entryCard: {
    backgroundColor: "#171717",
    borderColor: "#292929",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  entryHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  entryTitleGroup: {
    flex: 1,
    paddingRight: 12,
  },
  entryName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  mealType: {
    color: "#F97316",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 5,
  },
  entryCalories: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  serving: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 10,
  },
  entryMacros: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 8,
  },
  entryActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  editButton: {
    borderColor: "#2563EB",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    borderColor: "#F87171",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
});
