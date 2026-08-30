export type SpecialtyExerciseCandidate = {
  exerciseName: string;
  specificity: number;
  available: boolean;
  notes?: string | null;
};

export type SpecialtyExerciseRecommendation = SpecialtyExerciseCandidate & {
  reason: string;
};

export function rankSpecialtyExerciseCandidates(
  candidates: SpecialtyExerciseCandidate[],
): SpecialtyExerciseRecommendation[] {
  return candidates
    .filter((candidate) => candidate.available)
    .sort((a, b) => b.specificity - a.specificity || a.exerciseName.localeCompare(b.exerciseName))
    .map((candidate) => ({
      ...candidate,
      reason:
        candidate.specificity >= 90
          ? "Highly event-specific practice."
          : candidate.specificity >= 70
            ? "Strong transfer when direct event equipment is unavailable."
            : "Useful general preparation with lower event specificity.",
    }));
}

export function chooseBestSpecialtyExercise(
  candidates: SpecialtyExerciseCandidate[],
): SpecialtyExerciseRecommendation | null {
  return rankSpecialtyExerciseCandidates(candidates)[0] ?? null;
}
