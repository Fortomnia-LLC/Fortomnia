import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { supabase } from "../lib/supabase";

export type WorkoutTemplate = {
  created_at: string;
  id: string;
  name: string;
  notes: string | null;
  updated_at: string;
};

export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("workout_templates")
      .select("id, name, notes, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      setTemplates([]);
      setErrorMessage(error.message);
    } else {
      setTemplates((data ?? []) as WorkoutTemplate[]);
    }

    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTemplates();
    }, [loadTemplates]),
  );

  return {
    errorMessage,
    isLoading,
    refreshTemplates: loadTemplates,
    templates,
  };
}
