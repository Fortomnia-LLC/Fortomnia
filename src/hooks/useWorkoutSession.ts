import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { supabase } from "../lib/supabase";

export type LoggedSet = {
  duration_seconds: number | null;
  exercise_id: string;
  exercise_name: string;
  id: string;
  performance_type: "reps" | "time";
  reps: number;
  reps_in_reserve: number | null;
  set_number: number;
  set_type: "warmup" | "working";
  weight: number;
  weight_unit: "lb" | "kg";
};
export type PlannedExercise = {
  exercise_id: string;
  exercise_name: string;
  id: string;
  position: number;
  rep_max: number;
  rep_min: number;
  target_rir: number;
  target_sets: number;
};
export type WorkoutDetail = {
  completed_at: string | null;
  id: string;
  name: string;
  notes: string | null;
  started_at: string;
};

type WorkoutSetRow = {
  duration_seconds: number | null;
  exercise_id: string;
  exercises:
  | { name: string }
  | { name: string }[]
  | null;
  id: string;
  performance_type: "reps" | "time";
  reps: number;
  reps_in_reserve: number | null;
  set_number: number;
  set_type: "warmup" | "working";
  weight: number | string;
  weight_unit: "lb" | "kg";
};
type PlannedExerciseRow = {
  exercise_id: string;
  exercises:
    | { name: string }
    | { name: string }[]
    | null;
  id: string;
  position: number;
  rep_max: number;
  rep_min: number;
  target_rir: number;
  target_sets: number;
};
export function useWorkoutSession(workoutId: string | undefined) {
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [plannedExercises, setPlannedExercises] =
    useState<PlannedExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadWorkout = useCallback(async () => {
    if (!workoutId) {
      setWorkout(null);
      setSets([]);
      setPlannedExercises([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const [workoutResult, setsResult, planResult] = await Promise.all([
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
            duration_seconds,
            performance_type,
            set_number,
            set_type,
            reps,
            weight,
            weight_unit,
            reps_in_reserve,
            exercises (name)
          `,
        )
        .eq("session_id", workoutId)
        .order("set_number"),
          supabase
        .from("workout_session_exercises")
        .select(
          `
            id,
            exercise_id,
            position,
            target_sets,
            rep_min,
            rep_max,
            target_rir,
            exercises (name)
          `,
        )
        .eq("session_id", workoutId)
        .order("position"),
]);

    if (workoutResult.error) {
      setWorkout(null);
      setSets([]);
      setPlannedExercises([]);
      setErrorMessage(workoutResult.error.message);
      setIsLoading(false);
      return;
    }

    if (setsResult.error) {
      setWorkout(workoutResult.data as WorkoutDetail);
      setSets([]);
      setPlannedExercises([]);
      setErrorMessage(setsResult.error.message);
      setIsLoading(false);
      return;
    }

    if (planResult.error) {
      setWorkout(workoutResult.data as WorkoutDetail);
      setSets([]);
      setPlannedExercises([]);
      setErrorMessage(planResult.error.message);
      setIsLoading(false);
      return;
    }
    const normalizedSets = (setsResult.data as WorkoutSetRow[]).map(
  (set) => {
    const exercise = Array.isArray(set.exercises)
      ? set.exercises[0]
      : set.exercises;

    return {
      duration_seconds: set.duration_seconds,
      exercise_id: set.exercise_id,
      exercise_name: exercise?.name ?? "Unknown exercise",
      id: set.id,
      performance_type: set.performance_type,
      reps: set.reps,
      reps_in_reserve: set.reps_in_reserve,
      set_number: set.set_number,
      set_type: set.set_type,
      weight: Number(set.weight),
      weight_unit: set.weight_unit,
    };
  },
);

        const normalizedPlannedExercises = (
      planResult.data as PlannedExerciseRow[]
    ).map((item) => {
      const exercise = Array.isArray(item.exercises)
        ? item.exercises[0]
        : item.exercises;

      return {
        exercise_id: item.exercise_id,
        exercise_name: exercise?.name ?? "Unknown exercise",
        id: item.id,
        position: item.position,
        rep_max: item.rep_max,
        rep_min: item.rep_min,
        target_rir: item.target_rir,
        target_sets: item.target_sets,
      };
    });
      setWorkout(workoutResult.data as WorkoutDetail);
    setSets(normalizedSets);
    setPlannedExercises(normalizedPlannedExercises);
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
    plannedExercises,
    refreshWorkout: loadWorkout,
    sets,
    workout,
  };
}
