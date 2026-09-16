import { useEffect, useState } from "react";

import {
  type ExerciseVariation,
} from "../lib/exerciseVariations";
import { supabase } from "../lib/supabase";

export function useExerciseVariations(exerciseId: string | null) {
  const [variations, setVariations] = useState<ExerciseVariation[]>([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [variationError, setVariationError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadVariations() {
      if (!exerciseId) {
        setVariations([]);
        setVariationError(null);
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

      setVariations(error ? [] : ((data ?? []) as ExerciseVariation[]));
      setVariationError(error?.message ?? null);
      setIsLoadingVariations(false);
    }

    void loadVariations();
    return () => {
      isCurrent = false;
    };
  }, [exerciseId]);

  return { isLoadingVariations, variationError, variations };
}
