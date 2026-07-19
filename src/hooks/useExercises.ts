import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { supabase } from "../lib/supabase";

export type Exercise = {
  created_at: string;
  equipment: string | null;
  id: string;
  muscle_group: string;
  name: string;
  owner_id: string | null;
};

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("exercises")
      .select(
        "id, owner_id, name, muscle_group, equipment, created_at",
      )
      .order("name");

    if (error) {
      setExercises([]);
      setErrorMessage(error.message);
    } else {
      setExercises((data ?? []) as Exercise[]);
    }

    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadExercises();
    }, [loadExercises]),
  );

  return {
    errorMessage,
    exercises,
    isLoading,
    refreshExercises: loadExercises,
  };
}
