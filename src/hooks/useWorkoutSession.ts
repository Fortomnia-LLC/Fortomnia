import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type {
  LoggedSet,
  PlannedExercise,
  WorkoutDetail,
} from "../domain/workouts";
import { workoutRepository } from "../repositories/supabaseWorkoutRepository";
import { useAuth } from "../providers/AuthProvider";

export type { LoggedSet, PlannedExercise, WorkoutDetail } from "../domain/workouts";
export function useWorkoutSession(workoutId: string | undefined) {
  const { session } = useAuth();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [plannedExercises, setPlannedExercises] =
    useState<PlannedExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadWorkout = useCallback(async () => {
    if (!workoutId || !session?.user.id) {
      setWorkout(null);
      setSets([]);
      setPlannedExercises([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const detail = await workoutRepository.getWorkoutDetail(
        workoutId,
        session.user.id,
      );
      setWorkout(detail.workout);
      setSets(detail.sets);
      setPlannedExercises(detail.plannedExercises);
    } catch (error) {
      setWorkout(null);
      setSets([]);
      setPlannedExercises([]);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load workout.",
      );
    }
    setIsLoading(false);
  }, [session?.user.id, workoutId]);

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
