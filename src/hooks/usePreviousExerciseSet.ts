import { useEffect, useState } from "react";

import type { MetricUnit, PerformanceType } from "../lib/performanceMetrics";
import { supabase } from "../lib/supabase";

export type PreviousExerciseSet = {
  duration_seconds: number | null;
  metric_unit: MetricUnit | null;
  metric_value: number | null;
  performed_at: string;
  performance_type: PerformanceType;
  reps: number;
  reps_in_reserve: number | null;
  session_id: string;
  weight: number;
  weight_unit: "lb" | "kg";
};

type PreviousExerciseSetRow = Omit<PreviousExerciseSet, "weight"> & {
  weight: number | string;
};

export function usePreviousExerciseSet(
  exerciseId: string | null,
  currentWorkoutId: string | undefined,
  performanceType: PerformanceType = "reps",
  exerciseVariantId: string | null = null,
) {
  const [previousSets, setPreviousSets] = useState<PreviousExerciseSet[]>([]);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [previousError, setPreviousError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadPreviousSets() {
      if (!exerciseId || !currentWorkoutId) {
        setPreviousSets([]);
        setPreviousError(null);
        return;
      }

      setIsLoadingPrevious(true);
      setPreviousError(null);

      let query = supabase
        .from("workout_sets")
        .select(
          "session_id, weight, weight_unit, reps, reps_in_reserve, performed_at, set_type, set_variant, performance_type, duration_seconds, metric_value, metric_unit",
        )
        .eq("exercise_id", exerciseId)
        .is("deleted_at", null)
        .eq("set_type", "working")
        .eq("set_variant", "standard")
        .eq("performance_type", performanceType)
        .neq("session_id", currentWorkoutId)
        .order("performed_at", { ascending: false })
        .limit(12);

      query = exerciseVariantId
        ? query.eq("exercise_variant_id", exerciseVariantId)
        : query.is("exercise_variant_id", null);

      const { data, error } = await query;

      if (!isCurrent) {
        return;
      }

      if (error) {
        setPreviousSets([]);
        setPreviousError(error.message);
      } else {
        setPreviousSets(
          ((data ?? []) as PreviousExerciseSetRow[]).map((row) => ({
            duration_seconds: row.duration_seconds,
            metric_unit: row.metric_unit,
            metric_value:
              row.metric_value === null ? null : Number(row.metric_value),
            performed_at: row.performed_at,
            performance_type: row.performance_type,
            reps: row.reps,
            reps_in_reserve: row.reps_in_reserve,
            session_id: row.session_id,
            weight: Number(row.weight),
            weight_unit: row.weight_unit,
          })),
        );
      }

      setIsLoadingPrevious(false);
    }

    void loadPreviousSets();

    return () => {
      isCurrent = false;
    };
  }, [currentWorkoutId, exerciseId, exerciseVariantId, performanceType]);

  return {
    isLoadingPrevious,
    previousError,
    previousSet: previousSets[0] ?? null,
    previousSets,
  };
}
