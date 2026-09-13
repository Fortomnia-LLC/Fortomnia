import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { WorkoutSession } from "../domain/workouts";
import { supabase } from "../lib/supabase";
import { workoutRepository } from "../repositories/supabaseWorkoutRepository";

export type { WorkoutSession } from "../domain/workouts";

export function useWorkoutSessions() {
  const [workoutSessions, setWorkoutSessions] = useState<
    WorkoutSession[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadWorkoutSessions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setWorkoutSessions([]);
      setErrorMessage(sessionError.message);
      setIsLoading(false);
      return;
    }

    if (!session?.user.id) {
      setWorkoutSessions([]);
      setIsLoading(false);
      return;
    }

    try {
      const workouts = await workoutRepository.listRecentWorkouts(
        session.user.id,
      );
      setWorkoutSessions(workouts);
    } catch (error) {
      setWorkoutSessions([]);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load workouts.",
      );
    }

    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadWorkoutSessions();
    }, [loadWorkoutSessions]),
  );

  return {
    errorMessage,
    isLoading,
    refreshWorkoutSessions: loadWorkoutSessions,
    workoutSessions,
  };
}
