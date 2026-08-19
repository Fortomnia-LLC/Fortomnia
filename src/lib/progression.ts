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

export type RecentExerciseSet = {
  performedAt: string;
  reps: number;
  repsInReserve: number | null;
  sessionId: string;
  weight: number;
  weightUnit: ProgressionInput["weightUnit"];
};

export type ExerciseRecommendation = ProgressionSuggestion & {
  basedOnSetCount: number;
  performedAt: string;
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


export function getExerciseRecommendation(
  recentSets: RecentExerciseSet[],
  repRange: Pick<ProgressionInput, "repMax" | "repMin"> = {},
  rules: AthleteProgressionRules = DEFAULT_PROGRESSION_RULES,
): ExerciseRecommendation | null {
  if (recentSets.length === 0) {
    return null;
  }

  const sortedSets = [...recentSets].sort(
    (left, right) =>
      new Date(right.performedAt).getTime() -
      new Date(left.performedAt).getTime(),
  );
  const mostRecentSet = sortedSets[0];
  const lastWorkoutSets = sortedSets.filter(
    (set) =>
      set.sessionId === mostRecentSet.sessionId &&
      set.weightUnit === mostRecentSet.weightUnit,
  );
  const workingWeight = Math.max(
    ...lastWorkoutSets.map((set) => set.weight),
  );
  const workingSets = lastWorkoutSets.filter(
    (set) => set.weight === workingWeight,
  );
  const limitingSet = workingSets.reduce((current, set) => {
    if (set.reps !== current.reps) {
      return set.reps < current.reps ? set : current;
    }

    const currentRir = current.repsInReserve ?? -1;
    const setRir = set.repsInReserve ?? -1;
    return setRir < currentRir ? set : current;
  });
  const suggestion = getRepsFirstSuggestion(
    {
      ...repRange,
      reps: limitingSet.reps,
      repsInReserve: limitingSet.repsInReserve,
      weight: limitingSet.weight,
      weightUnit: limitingSet.weightUnit,
    },
    rules,
  );
  const setLabel = workingSets.length === 1 ? "set" : "sets";

  return {
    ...suggestion,
    basedOnSetCount: workingSets.length,
    explanation:
      `Based on ${workingSets.length} working ${setLabel} from your last workout. ` +
      suggestion.explanation,
    performedAt: mostRecentSet.performedAt,
  };
}
