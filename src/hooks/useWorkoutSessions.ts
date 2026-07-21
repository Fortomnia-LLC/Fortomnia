import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { supabase } from "../lib/supabase";

export type WorkoutSession = {
  completed_at: string | null;
  created_at: string;
  id: string;
  name: string;
  notes: string | null;
  started_at: string;
  user_id: string;
};

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

    const { data, error } = await supabase
      .from("workout_sessions")
      .select(
        "id, user_id, name, started_at, completed_at, notes, created_at",
      )
      .eq("user_id", session.user.id)
      .order("started_at", { ascending: false })
      .limit(5);

    if (error) {
      setWorkoutSessions([]);
      setErrorMessage(error.message);
    } else {
      setWorkoutSessions((data ?? []) as WorkoutSession[]);
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
