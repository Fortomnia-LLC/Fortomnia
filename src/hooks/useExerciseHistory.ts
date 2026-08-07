import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { type Exercise } from "./useExercises";
import { supabase } from "../lib/supabase";

export type ExerciseHistorySet = {
  id: string;
  performed_at: string;
  reps: number;
  reps_in_reserve: number | null;
  session_id: string;
  session_name: string;
  set_number: number;
  weight: number;
  weight_unit: "lb" | "kg";
};

type WorkoutSetRow = {
  id: string;
  performed_at: string;
  reps: number;
  reps_in_reserve: number | null;
  session_id: string;
  set_number: number;
  weight: number | string;
  weight_unit: "lb" | "kg";
  workout_sessions:
    | { name: string }
    | { name: string }[]
    | null;
};

export function useExerciseHistory(exerciseId: string | undefined) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<ExerciseHistorySet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!exerciseId) {
      setExercise(null);
      setSets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const [exerciseResult, setsResult] = await Promise.all([
      supabase
        .from("exercises")
        .select(
            `
              id,
              owner_id,
              name,
              muscle_group,
              equipment,
              aliases,
              secondary_muscles,
              movement_pattern,
              instructions,
              is_archived,
              is_unilateral,
              created_at
            `,
          )
        .eq("id", exerciseId)
        .single(),

      supabase
        .from("workout_sets")
        .select(
          `
            id,
            session_id,
            set_number,
            reps,
            weight,
            weight_unit,
            reps_in_reserve,
            performed_at,
            workout_sessions (name)
          `,
        )
        .eq("exercise_id", exerciseId)
        .order("performed_at", { ascending: false }),
    ]);

    if (exerciseResult.error) {
      setExercise(null);
      setSets([]);
      setErrorMessage(exerciseResult.error.message);
      setIsLoading(false);
      return;
    }

    if (setsResult.error) {
      setExercise(exerciseResult.data as Exercise);
      setSets([]);
      setErrorMessage(setsResult.error.message);
      setIsLoading(false);
      return;
    }

    const normalizedSets = (setsResult.data as WorkoutSetRow[]).map(
      (set) => {
        const session = Array.isArray(set.workout_sessions)
          ? set.workout_sessions[0]
          : set.workout_sessions;

        return {
          id: set.id,
          performed_at: set.performed_at,
          reps: set.reps,
          reps_in_reserve: set.reps_in_reserve,
          session_id: set.session_id,
          session_name: session?.name ?? "Workout",
          set_number: set.set_number,
          weight: Number(set.weight),
          weight_unit: set.weight_unit,
        };
      },
    );

    setExercise(exerciseResult.data as Exercise);
    setSets(normalizedSets);
    setIsLoading(false);
  }, [exerciseId]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  return {
    errorMessage,
    exercise,
    isLoading,
    refreshHistory: loadHistory,
    sets,
  };
}
