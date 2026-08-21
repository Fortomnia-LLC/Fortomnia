export const TRAINING_GOALS = [
  "strength",
  "muscle",
  "fat_loss",
  "athleticism",
  "general_fitness",
] as const;

export const TRAINING_STYLES = [
  "bodybuilding",
  "powerlifting",
  "powerbuilding",
  "functional",
  "mixed",
] as const;

export type TrainingGoal = (typeof TRAINING_GOALS)[number];
export type TrainingStyle = (typeof TRAINING_STYLES)[number];

export const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  athleticism: "Athletic performance",
  fat_loss: "Fat loss",
  general_fitness: "General fitness",
  muscle: "Build muscle",
  strength: "Build strength",
};

export const TRAINING_STYLE_LABELS: Record<TrainingStyle, string> = {
  bodybuilding: "Bodybuilding",
  functional: "Functional",
  mixed: "Mixed",
  powerbuilding: "Powerbuilding",
  powerlifting: "Powerlifting",
};

export function parseFavoriteAthletes(value: string): string[] {
  const unique = new Map<string, string>();

  for (const item of value.split(",")) {
    const athlete = item.trim();

    if (athlete) {
      unique.set(athlete.toLocaleLowerCase(), athlete);
    }
  }

  return [...unique.values()].slice(0, 10);
}

export function buildCoachProfileSummary(
  goals: TrainingGoal[],
  style: TrainingStyle,
  favoriteAthletes: string[],
): string {
  const goalText =
    goals.length > 0
      ? goals.map((goal) => TRAINING_GOAL_LABELS[goal]).join(", ")
      : "your selected goals";
  const inspirationText =
    favoriteAthletes.length > 0
      ? ` Inspiration: ${favoriteAthletes.join(", ")}.`
      : "";

  return (
    `Fortomnia will prioritize ${goalText.toLocaleLowerCase()} using a ` +
    `${TRAINING_STYLE_LABELS[style].toLocaleLowerCase()} approach.` +
    inspirationText
  );
}
