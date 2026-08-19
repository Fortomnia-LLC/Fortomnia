export type ProgressionInput = {
  repMax?: number;
  repMin?: number;
  reps: number;
  repsInReserve: number | null;
  weight: number;
  weightUnit: "lb" | "kg";
};

export type AthleteProgressionRules = {
  minimumRepsInReserve: number;
  weightIncrease: Record<ProgressionInput["weightUnit"], number>;
};

export type ProgressionSuggestion = {
  explanation: string;
  reps: number;
  weight: number;
  weightUnit: "lb" | "kg";
};

export const DEFAULT_PROGRESSION_RULES: AthleteProgressionRules = {
  minimumRepsInReserve: 2,
  weightIncrease: {
    kg: 2.5,
    lb: 5,
  },
};

function validateRules(rules: AthleteProgressionRules): void {
  if (
    !Number.isFinite(rules.minimumRepsInReserve) ||
    rules.minimumRepsInReserve < 0
  ) {
    throw new RangeError("minimumRepsInReserve must be a non-negative number");
  }

  for (const unit of ["lb", "kg"] as const) {
    if (
      !Number.isFinite(rules.weightIncrease[unit]) ||
      rules.weightIncrease[unit] <= 0
    ) {
      throw new RangeError(`weightIncrease.${unit} must be greater than zero`);
    }
  }
}

export function getRepsFirstSuggestion(
  input: ProgressionInput,
  rules: AthleteProgressionRules = DEFAULT_PROGRESSION_RULES,
): ProgressionSuggestion {
  validateRules(rules);

  const canProgress =
    input.repsInReserve !== null &&
    input.repsInReserve >= rules.minimumRepsInReserve;

  const hasRepRange =
    input.repMin !== undefined &&
    input.repMax !== undefined &&
    input.repMin <= input.repMax;

  if (canProgress && hasRepRange && input.reps >= input.repMax!) {
    const weightIncrease = rules.weightIncrease[input.weightUnit];

    return {
      explanation:
        `You reached the top of the rep range with at least ${rules.minimumRepsInReserve} reps in reserve. ` +
        `Increase the weight by ${weightIncrease} ${input.weightUnit} and return to the range minimum.`,
      reps: input.repMin!,
      weight: Number((input.weight + weightIncrease).toFixed(2)),
      weightUnit: input.weightUnit,
    };
  }

  if (canProgress) {
    const nextReps = hasRepRange
      ? Math.min(input.reps + 1, input.repMax!)
      : input.reps + 1;

    return {
      explanation:
        `You had at least ${rules.minimumRepsInReserve} reps in reserve, so aim for one more rep.`,
      reps: nextReps,
      weight: input.weight,
      weightUnit: input.weightUnit,
    };
  }

  return {
    explanation:
      `Repeat this performance until you have at least ${rules.minimumRepsInReserve} reps in reserve.`,
    reps: input.reps,
    weight: input.weight,
    weightUnit: input.weightUnit,
  };
}
