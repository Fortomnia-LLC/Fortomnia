import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

export type PreviousExerciseSet = {
  performed_at: string;
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

      const { data, error } = await supabase
        .from("workout_sets")
        .select(
          "session_id, weight, weight_unit, reps, reps_in_reserve, performed_at, set_type",
        )
        .eq("exercise_id", exerciseId)
        .eq("set_type", "working")
        .neq("session_id", currentWorkoutId)
        .order("performed_at", { ascending: false })
        .limit(12);

      if (!isCurrent) {
        return;
      }

      if (error) {
        setPreviousSets([]);
        setPreviousError(error.message);
      } else {
        setPreviousSets(
          ((data ?? []) as PreviousExerciseSetRow[]).map((row) => ({
            performed_at: row.performed_at,
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
  }, [currentWorkoutId, exerciseId]);

  return {
    isLoadingPrevious,
    previousError,
    previousSet: previousSets[0] ?? null,
    previousSets,
  };
}
