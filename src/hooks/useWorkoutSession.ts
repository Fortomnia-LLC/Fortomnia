import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { supabase } from "../lib/supabase";

export type LoggedSet = {
  exercise_id: string;
  exercise_name: string;
  id: string;
  reps: number;
  reps_in_reserve: number | null;
  set_number: number;
  weight: number;
  weight_unit: "lb" | "kg";
};

export type WorkoutDetail = {
  completed_at: string | null;
  id: string;
  name: string;
  notes: string | null;
  started_at: string;
};

type WorkoutSetRow = {
  exercise_id: string;
  exercises:
  | { name: string }
  | { name: string }[]
  | null;
  id: string;
  reps: number;
  reps_in_reserve: number | null;
  set_number: number;
  weight: number | string;
  weight_unit: "lb" | "kg";
};

export function useWorkoutSession(workoutId: string | undefined) {
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadWorkout = useCallback(async () => {
    if (!workoutId) {
      setWorkout(null);
      setSets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const [workoutResult, setsResult] = await Promise.all([
      supabase
        .from("workout_sessions")
        .select("id, name, started_at, completed_at, notes")
        .eq("id", workoutId)
        .single(),

      supabase
        .from("workout_sets")
        .select(
          `
            id,
            exercise_id,
            set_number,
            reps,
            weight,
            weight_unit,
            reps_in_reserve,
            exercises (name)
          `,
        )
        .eq("session_id", workoutId)
        .order("set_number"),
    ]);

    if (workoutResult.error) {
      setWorkout(null);
      setSets([]);
      setErrorMessage(workoutResult.error.message);
      setIsLoading(false);
      return;
    }

    if (setsResult.error) {
      setWorkout(workoutResult.data as WorkoutDetail);
      setSets([]);
      setErrorMessage(setsResult.error.message);
      setIsLoading(false);
      return;
    }

       const normalizedSets = (setsResult.data as WorkoutSetRow[]).map(
  (set) => {
    const exercise = Array.isArray(set.exercises)
      ? set.exercises[0]
      : set.exercises;

    return {
      exercise_id: set.exercise_id,
      exercise_name: exercise?.name ?? "Unknown exercise",
      id: set.id,
      reps: set.reps,
      reps_in_reserve: set.reps_in_reserve,
      set_number: set.set_number,
      weight: Number(set.weight),
      weight_unit: set.weight_unit,
    };
  },
);

    setWorkout(workoutResult.data as WorkoutDetail);
    setSets(normalizedSets);
    setIsLoading(false);
  }, [workoutId]);

  useFocusEffect(
    useCallback(() => {
      void loadWorkout();
    }, [loadWorkout]),
  );

  return {
    errorMessage,
    isLoading,
    refreshWorkout: loadWorkout,
    sets,
    workout,
  };
}
