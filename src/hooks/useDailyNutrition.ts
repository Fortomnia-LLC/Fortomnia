import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

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
  meal_number: number | null;
  meal_type: MealType;
  notes: string | null;
  protein_g: number;
  serving_description: string | null;
};

export type WaterEntry = {
  amount_ml: number;
  entry_date: string;
  id: string;
  logged_at: string;
};

export type NutritionGoals = {
  calorie_target: number;
  carbs_target_g: number;
  fat_target_g: number;
  fiber_target_g: number;
  meal_count: number;
  protein_target_g: number;
  water_target_ml: number | null;
  weekday_calorie_targets: number[];
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
  meal_count: number;
  protein_target_g: number | string;
  water_target_ml: number | null;
  weekday_calorie_targets: number[] | null;
};

const defaultGoals: NutritionGoals = {
  calorie_target: 2000,
  carbs_target_g: 200,
  fat_target_g: 70,
  fiber_target_g: 25,
  meal_count: 3,
  protein_target_g: 150,
  water_target_ml: null,
  weekday_calorie_targets: [],
};

export function useDailyNutrition(entryDate: string) {
  const { session } = useAuth();
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>(defaultGoals);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingWater, setIsSavingWater] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNutrition = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [entriesResult, goalsResult, waterResult] = await Promise.all([
      supabase
        .from("nutrition_entries")
        .select(
          `
            id,
            entry_date,
            consumed_at,
            meal_type,
            meal_number,
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
            fiber_target_g,
            meal_count,
            water_target_ml,
            weekday_calorie_targets
          `,
        )
        .maybeSingle(),

      supabase
        .from("water_entries")
        .select("id, entry_date, amount_ml, logged_at")
        .eq("entry_date", entryDate)
        .order("logged_at", { ascending: true }),
    ]);

    if (entriesResult.error) {
      setEntries([]);
      setWaterEntries([]);
      setErrorMessage(entriesResult.error.message);
      setIsLoading(false);
      return;
    }

    if (goalsResult.error) {
      setEntries([]);
      setWaterEntries([]);
      setErrorMessage(goalsResult.error.message);
      setIsLoading(false);
      return;
    }

    if (waterResult.error) {
      setEntries([]);
      setWaterEntries([]);
      setErrorMessage(waterResult.error.message);
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
    const normalizedWaterEntries = (waterResult.data as WaterEntry[]).map(
      (entry) => ({
        ...entry,
        amount_ml: Number(entry.amount_ml),
      }),
    );

    setEntries(normalizedEntries);
    setWaterEntries(normalizedWaterEntries);
    setGoals(
      goalRow
        ? {
            calorie_target: goalRow.calorie_target,
            carbs_target_g: Number(goalRow.carbs_target_g),
            fat_target_g: Number(goalRow.fat_target_g),
            fiber_target_g: Number(goalRow.fiber_target_g),
            meal_count: goalRow.meal_count,
            protein_target_g: Number(goalRow.protein_target_g),
            water_target_ml: goalRow.water_target_ml,
            weekday_calorie_targets: goalRow.weekday_calorie_targets ?? [],
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

  const addWater = useCallback(
    async (amountMl: number): Promise<string | null> => {
      if (!session?.user.id) {
        return "Your user session is missing.";
      }

      if (!Number.isInteger(amountMl) || amountMl < 1 || amountMl > 10000) {
        return "Water must be between 1 and 10,000 mL.";
      }

      setIsSavingWater(true);
      const { data, error } = await supabase
        .from("water_entries")
        .insert({
          amount_ml: amountMl,
          entry_date: entryDate,
          user_id: session.user.id,
        })
        .select("id, entry_date, amount_ml, logged_at")
        .maybeSingle();
      setIsSavingWater(false);

      if (error || !data) {
        return error?.message ?? "The water entry was not saved.";
      }

      setWaterEntries((current) => [
        ...current,
        {
          ...(data as WaterEntry),
          amount_ml: Number(data.amount_ml),
        },
      ]);
      return null;
    },
    [entryDate, session?.user.id],
  );

  const deleteWater = useCallback(
    async (entryId: string): Promise<string | null> => {
      if (!session?.user.id) {
        return "Your user session is missing.";
      }

      setIsSavingWater(true);
      const { data, error } = await supabase
        .from("water_entries")
        .delete()
        .eq("id", entryId)
        .eq("user_id", session.user.id)
        .select("id")
        .maybeSingle();
      setIsSavingWater(false);

      if (error || !data) {
        return error?.message ?? "The water entry was not removed.";
      }

      setWaterEntries((current) =>
        current.filter((entry) => entry.id !== entryId),
      );
      return null;
    },
    [session?.user.id],
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

  const waterTotalMl = useMemo(
    () =>
      waterEntries.reduce(
        (total, entry) => total + entry.amount_ml,
        0,
      ),
    [waterEntries],
  );

  return {
    addWater,
    deleteWater,
    entries,
    errorMessage,
    goals,
    isLoading,
    isSavingWater,
    refreshNutrition: loadNutrition,
    totals,
    waterEntries,
    waterTotalMl,
  };
}
