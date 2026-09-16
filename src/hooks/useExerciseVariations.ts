import { useEffect, useState } from "react";

import {
  type ExerciseVariation,
} from "../lib/exerciseVariations";
import { supabase } from "../lib/supabase";

export function useExerciseVariations(exerciseId: string | null) {
  const [loadedExerciseId, setLoadedExerciseId] = useState<string | null>(null);
  const [loadedVariations, setLoadedVariations] = useState<ExerciseVariation[]>([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [variationError, setVariationError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadVariations() {
      if (!exerciseId) {
        setLoadedExerciseId(null);
        setLoadedVariations([]);
        setVariationError(null);
        setIsLoadingVariations(false);
        return;
      }

      setIsLoadingVariations(true);
      setVariationError(null);
      const { data, error } = await supabase
        .from("exercise_variants")
        .select(
          "id, exercise_id, name, grip, attachment, stance, laterality, execution_style, aliases, is_default, sort_order",
        )
        .eq("exercise_id", exerciseId)
        .order("sort_order")
        .order("name");

      if (!isCurrent) return;

      setLoadedExerciseId(exerciseId);
      setLoadedVariations(error ? [] : ((data ?? []) as ExerciseVariation[]));
      setVariationError(error?.message ?? null);
      setIsLoadingVariations(false);
    }

    void loadVariations();
    return () => {
      isCurrent = false;
    };
  }, [exerciseId]);

  const hasLoadedVariations = loadedExerciseId === exerciseId;
  const variations = hasLoadedVariations ? loadedVariations : [];

  return {
    hasLoadedVariations,
    isLoadingVariations: Boolean(exerciseId) && !hasLoadedVariations
      ? true
      : isLoadingVariations,
    variationError: hasLoadedVariations ? variationError : null,
    variations,
  };
}
