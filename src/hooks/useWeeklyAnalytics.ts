import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { SupplementProtocol } from "./useSupplements";
import { isProtocolDue } from "../lib/supplementSchedule";
import { supabase } from "../lib/supabase";

export type WeeklyAnalytics = {
  averageCalories: number;
  averageProteinG: number;
  nutritionDaysLogged: number;
  supplementAdherencePercent: number | null;
  supplementsDue: number;
  supplementsTaken: number;
  setsLogged: number;
  workoutsCompleted: number;
};

type NutritionRow = {
  calories: number;
  entry_date: string;
  protein_g: number | string;
};

type ProtocolRow = Omit<SupplementProtocol, "dose_amount"> & {
  dose_amount: number | string;
};

type SupplementLogRow = {
  log_date: string;
  protocol_id: string;
  status: "taken" | "skipped";
};

const emptyAnalytics: WeeklyAnalytics = {
  averageCalories: 0,
  averageProteinG: 0,
  nutritionDaysLogged: 0,
  supplementAdherencePercent: null,
  supplementsDue: 0,
  supplementsTaken: 0,
  setsLogged: 0,
  workoutsCompleted: 0,
};

function shiftDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateKeys(startDate: string) {
  return Array.from({ length: 7 }, (_, index) =>
    shiftDate(startDate, index),
  );
}

export function useWeeklyAnalytics(today: string) {
  const [analytics, setAnalytics] =
    useState<WeeklyAnalytics>(emptyAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const startDate = shiftDate(today, -6);
    const startIso = new Date(
      `${startDate}T00:00:00`,
    ).toISOString();
    const endIso = new Date(
      `${today}T23:59:59.999`,
    ).toISOString();

    const [
      workoutsResult,
      setsResult,
      nutritionResult,
      protocolsResult,
      logsResult,
    ] = await Promise.all([
      supabase
        .from("workout_sessions")
        .select("id")
        .not("completed_at", "is", null)
        .gte("completed_at", startIso)
        .lte("completed_at", endIso),

      supabase
        .from("workout_sets")
        .select("id")
        .gte("performed_at", startIso)
        .lte("performed_at", endIso),

      supabase
        .from("nutrition_entries")
        .select("entry_date, calories, protein_g")
        .gte("entry_date", startDate)
        .lte("entry_date", today),

      supabase
        .from("supplement_protocols")
        .select(
          `
            id,
            name,
            category,
            dose_amount,
            dose_unit,
            route,
            frequency,
            scheduled_time,
            start_date,
            end_date,
            is_active,
            notes
          `,
        ),

      supabase
        .from("supplement_logs")
        .select("protocol_id, log_date, status")
        .gte("log_date", startDate)
        .lte("log_date", today),
    ]);

    const firstError =
      workoutsResult.error ??
      setsResult.error ??
      nutritionResult.error ??
      protocolsResult.error ??
      logsResult.error;

    if (firstError) {
      setAnalytics(emptyAnalytics);
      setErrorMessage(firstError.message);
      setIsLoading(false);
      return;
    }

    const nutritionRows =
      (nutritionResult.data ?? []) as NutritionRow[];
    const nutritionByDate = new Map<
      string,
      { calories: number; proteinG: number }
    >();

    for (const entry of nutritionRows) {
      const current = nutritionByDate.get(entry.entry_date) ?? {
        calories: 0,
        proteinG: 0,
      };

      current.calories += entry.calories;
      current.proteinG += Number(entry.protein_g);
      nutritionByDate.set(entry.entry_date, current);
    }

    const nutritionDaysLogged = nutritionByDate.size;
    const nutritionTotals = Array.from(
      nutritionByDate.values(),
    ).reduce(
      (total, day) => ({
        calories: total.calories + day.calories,
        proteinG: total.proteinG + day.proteinG,
      }),
      { calories: 0, proteinG: 0 },
    );

    const protocols = (
      (protocolsResult.data ?? []) as ProtocolRow[]
    ).map((protocol) => ({
      ...protocol,
      dose_amount: Number(protocol.dose_amount),
    }));

    const takenLogKeys = new Set(
      ((logsResult.data ?? []) as SupplementLogRow[])
        .filter((log) => log.status === "taken")
        .map((log) => `${log.protocol_id}:${log.log_date}`),
    );

    let supplementsDue = 0;
    let supplementsTaken = 0;

    for (const dateKey of getDateKeys(startDate)) {
      for (const protocol of protocols) {
        if (
          !protocol.is_active ||
          !isProtocolDue(protocol, dateKey)
        ) {
          continue;
        }

        supplementsDue += 1;

        if (takenLogKeys.has(`${protocol.id}:${dateKey}`)) {
          supplementsTaken += 1;
        }
      }
    }

    setAnalytics({
      averageCalories:
        nutritionDaysLogged > 0
          ? Math.round(
              nutritionTotals.calories / nutritionDaysLogged,
            )
          : 0,
      averageProteinG:
        nutritionDaysLogged > 0
          ? Math.round(
              nutritionTotals.proteinG / nutritionDaysLogged,
            )
          : 0,
      nutritionDaysLogged,
      supplementAdherencePercent:
        supplementsDue > 0
          ? Math.round((supplementsTaken / supplementsDue) * 100)
          : null,
      supplementsDue,
      supplementsTaken,
      setsLogged: setsResult.data?.length ?? 0,
      workoutsCompleted: workoutsResult.data?.length ?? 0,
    });
    setIsLoading(false);
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      void loadAnalytics();
    }, [loadAnalytics]),
  );

  return {
    analytics,
    errorMessage,
    isLoading,
    refreshAnalytics: loadAnalytics,
  };
}
