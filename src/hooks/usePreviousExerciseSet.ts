import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

export type PreviousExerciseSet = {
  performed_at: string;
  reps: number;
  reps_in_reserve: number | null;
  weight: number;
  weight_unit: "lb" | "kg";
};

type PreviousExerciseSetRow = Omit<
  PreviousExerciseSet,
  "weight"
> & {
  weight: number | string;
};

export function usePreviousExerciseSet(
  exerciseId: string | null,
  currentWorkoutId: string | undefined,
) {
  const [previousSet, setPreviousSet] =
    useState<PreviousExerciseSet | null>(null);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [previousError, setPreviousError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadPreviousSet() {
      if (!exerciseId || !currentWorkoutId) {
        setPreviousSet(null);
        setPreviousError(null);
        return;
      }

      setIsLoadingPrevious(true);
      setPreviousError(null);

      const { data, error } = await supabase
        .from("workout_sets")
        .select(
          "weight, weight_unit, reps, reps_in_reserve, performed_at",
        )
        .eq("exercise_id", exerciseId)
        .order("performed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isCurrent) {
        return;
      }

      if (error) {
        setPreviousSet(null);
        setPreviousError(error.message);
      } else if (data) {
        const row = data as PreviousExerciseSetRow;

        setPreviousSet({
          performed_at: row.performed_at,
          reps: row.reps,
          reps_in_reserve: row.reps_in_reserve,
          weight: Number(row.weight),
          weight_unit: row.weight_unit,
        });
      } else {
        setPreviousSet(null);
      }

      setIsLoadingPrevious(false);
    }

    void loadPreviousSet();

    return () => {
      isCurrent = false;
    };
  }, [currentWorkoutId, exerciseId]);

  return {
    isLoadingPrevious,
    previousError,
    previousSet,
  };
}
