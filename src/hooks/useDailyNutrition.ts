import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { supabase } from "../lib/supabase";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type NutritionEntry = {
  calories: number;
  carbs_g: number;
  consumed_at: string;
  entry_date: string;
  fat_g: number;
  fiber_g: number;
  food_name: string;
  id: string;
  meal_type: MealType;
  notes: string | null;
  protein_g: number;
  serving_description: string | null;
};

export type NutritionGoals = {
  calorie_target: number;
  carbs_target_g: number;
  fat_target_g: number;
  fiber_target_g: number;
  protein_target_g: number;
};

type NutritionEntryRow = Omit<
  NutritionEntry,
  "carbs_g" | "fat_g" | "fiber_g" | "protein_g"
> & {
  carbs_g: number | string;
  fat_g: number | string;
  fiber_g: number | string;
  protein_g: number | string;
};

type NutritionGoalsRow = {
  calorie_target: number;
  carbs_target_g: number | string;
  fat_target_g: number | string;
  fiber_target_g: number | string;
  protein_target_g: number | string;
};

const defaultGoals: NutritionGoals = {
  calorie_target: 2000,
  carbs_target_g: 200,
  fat_target_g: 70,
  fiber_target_g: 25,
  protein_target_g: 150,
};

export function useDailyNutrition(entryDate: string) {
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>(defaultGoals);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNutrition = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [entriesResult, goalsResult] = await Promise.all([
      supabase
        .from("nutrition_entries")
        .select(
          `
            id,
            entry_date,
            consumed_at,
            meal_type,
            food_name,
            serving_description,
            calories,
            protein_g,
            carbs_g,
            fat_g,
            fiber_g,
            notes
          `,
        )
        .eq("entry_date", entryDate)
        .order("consumed_at", { ascending: true }),

      supabase
        .from("nutrition_goals")
        .select(
          `
            calorie_target,
            protein_target_g,
            carbs_target_g,
            fat_target_g,
            fiber_target_g
          `,
        )
        .maybeSingle(),
    ]);

    if (entriesResult.error) {
      setEntries([]);
      setErrorMessage(entriesResult.error.message);
      setIsLoading(false);
      return;
    }

    if (goalsResult.error) {
      setEntries([]);
      setErrorMessage(goalsResult.error.message);
      setIsLoading(false);
      return;
    }

    const normalizedEntries = (
      entriesResult.data as NutritionEntryRow[]
    ).map((entry) => ({
      ...entry,
      carbs_g: Number(entry.carbs_g),
      fat_g: Number(entry.fat_g),
      fiber_g: Number(entry.fiber_g),
      protein_g: Number(entry.protein_g),
    }));

    const goalRow = goalsResult.data as NutritionGoalsRow | null;

    setEntries(normalizedEntries);
    setGoals(
      goalRow
        ? {
            calorie_target: goalRow.calorie_target,
            carbs_target_g: Number(goalRow.carbs_target_g),
            fat_target_g: Number(goalRow.fat_target_g),
            fiber_target_g: Number(goalRow.fiber_target_g),
            protein_target_g: Number(goalRow.protein_target_g),
          }
        : defaultGoals,
    );
    setIsLoading(false);
  }, [entryDate]);

  useFocusEffect(
    useCallback(() => {
      void loadNutrition();
    }, [loadNutrition]),
  );

  const totals = useMemo(
    () =>
      entries.reduce(
        (total, entry) => ({
          calories: total.calories + entry.calories,
          carbs_g: total.carbs_g + entry.carbs_g,
          fat_g: total.fat_g + entry.fat_g,
          fiber_g: total.fiber_g + entry.fiber_g,
          protein_g: total.protein_g + entry.protein_g,
        }),
        {
          calories: 0,
          carbs_g: 0,
          fat_g: 0,
          fiber_g: 0,
          protein_g: 0,
        },
      ),
    [entries],
  );

  return {
    entries,
    errorMessage,
    goals,
    isLoading,
    refreshNutrition: loadNutrition,
    totals,
  };
}
