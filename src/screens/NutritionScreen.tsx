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
  View,
} from "react-native";

import {
  type NutritionEntry,
  useDailyNutrition,
} from "../hooks/useDailyNutrition";
import { getLocalDateKey } from "../lib/dates";
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
            {entry.meal_type.toUpperCase()}
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
  const isToday = selectedDate === today;
  const {
    entries,
    errorMessage,
    goals,
    isLoading,
    refreshNutrition,
    totals,
  } = useDailyNutrition(selectedDate);
  const calorieRemaining =
    goals.calorie_target - totals.calories;
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
        mealType: entry.meal_type,
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
                params: { date: selectedDate },
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
                  protein: String(goals.protein_target_g),
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
                of {goals.calorie_target} calories
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
    borderColor: "#F97316",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
  },
  todayButtonText: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "800",
  },
  dateButtonDisabled: {
    opacity: 0.35,
  },
  logButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 52,
  },
  goalsButton: {
    alignItems: "center",
    borderColor: "#F97316",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 20,
    minHeight: 52,
  },
  goalsButtonText: {
    color: "#F97316",
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
    borderColor: "#F97316",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    color: "#F97316",
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
    lineHeight: 21,
    marginTop: 8,
  },
});
