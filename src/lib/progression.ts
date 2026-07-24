export type ProgressionInput = {
  repMax?: number;
  repMin?: number;
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
  const canProgress =
    input.repsInReserve !== null && input.repsInReserve >= 2;

  const hasRepRange =
    input.repMin !== undefined &&
    input.repMax !== undefined &&
    input.repMin <= input.repMax;

  if (
    canProgress &&
    hasRepRange &&
    input.reps >= input.repMax!
  ) {
    const weightIncrease = input.weightUnit === "lb" ? 5 : 2.5;

    return {
      explanation:
        "You reached the top of the rep range with room left. Increase the weight and return to the range minimum.",
      reps: input.repMin!,
      weight: Number((input.weight + weightIncrease).toFixed(2)),
      weightUnit: input.weightUnit,
    };
  }

  if (canProgress) {
    const nextReps =
      hasRepRange
        ? Math.min(input.reps + 1, input.repMax!)
        : input.reps + 1;

    return {
      explanation:
        "You had at least 2 reps in reserve, so aim for one more rep.",
      reps: nextReps,
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
