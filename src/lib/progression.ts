export type ProgressionInput = {
  reps: number;
  repsInReserve: number | null;
  weight: number;
  weightUnit: "lb" | "kg";
};

export type ProgressionSuggestion = {
  explanation: string;
  reps: number;
  weight: number;
  weightUnit: "lb" | "kg";
};

export function getRepsFirstSuggestion(
  input: ProgressionInput,
): ProgressionSuggestion {
  const canAddRep =
    input.repsInReserve !== null && input.repsInReserve >= 2;

  if (canAddRep) {
    return {
      explanation:
        "You had at least 2 reps in reserve, so aim for one more rep.",
      reps: input.reps + 1,
      weight: input.weight,
      weightUnit: input.weightUnit,
    };
  }

  return {
    explanation:
      "Repeat this performance before increasing the target.",
    reps: input.reps,
    weight: input.weight,
    weightUnit: input.weightUnit,
  };
}
