export type ExerciseVariation = {
  aliases: string[];
  attachment: string | null;
  execution_style: string | null;
  exercise_id: string;
  grip: string | null;
  id: string;
  is_default: boolean;
  laterality: "alternating" | "bilateral" | "unilateral" | null;
  name: string;
  sort_order: number;
  stance: string | null;
};

export function formatExerciseVariation(
  exerciseName: string,
  variation: Pick<ExerciseVariation, "name"> | null,
): string {
  return variation ? `${exerciseName} — ${variation.name}` : exerciseName;
}

export function defaultExerciseVariation(
  variations: ExerciseVariation[],
): ExerciseVariation | null {
  return variations.find((variation) => variation.is_default) ?? variations[0] ?? null;
}
