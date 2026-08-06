import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { supabase } from "../lib/supabase";

export type ExerciseMovementPattern =
  | "squat"
  | "hinge"
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "lunge"
  | "carry"
  | "rotation"
  | "isolation"
  | "conditioning"
  | "mobility"
  | "other";

export type Exercise = {
  aliases: string[];
  created_at: string;
  equipment: string | null;
  id: string;
  instructions: string | null;
  is_unilateral: boolean;
  movement_pattern: ExerciseMovementPattern;
  muscle_group: string;
  name: string;
  owner_id: string | null;
  secondary_muscles: string[];
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
          is_unilateral,
          created_at
        `,
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
