export const TRAINING_LOCATIONS = [
  "commercial_gym",
  "home_gym",
  "garage_gym",
  "school_team_facility",
  "outdoors",
  "other",
] as const;

export type TrainingLocation = (typeof TRAINING_LOCATIONS)[number];

export const TRAINING_LOCATION_LABELS: Record<TrainingLocation, string> = {
  commercial_gym: "Commercial gym",
  garage_gym: "Garage gym",
  home_gym: "Home gym",
  other: "Other",
  outdoors: "Outdoors",
  school_team_facility: "School / team facility",
};

export type CoachQuestionnaire = {
  cardioFocus: string;
  mobilityFocus: string;
  nutritionFocus: string;
  preferredCardio: string[];
  primaryFocus: string;
  priorityMetricCurrent: number | null;
  priorityMetricName: string;
  priorityMetricTarget: number | null;
  priorityMetricUnit: string;
  sessionMinutes: number | null;
  sports: string[];
  targetEventDate: string | null;
  targetEventName: string;
  trainingLocationDetails: string;
  trainingLocations: TrainingLocation[];
  weeklyTrainingDays: number | null;
};

export function parseCommaSeparated(value: string, limit = 12): string[] {
  const unique = new Map<string, string>();
  for (const item of value.split(",")) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase();
    if (!unique.has(key)) unique.set(key, trimmed);
  }
  return [...unique.values()].slice(0, limit);
}

export function buildCoachPlanPreview(questionnaire: CoachQuestionnaire): {
  cardio: string;
  mobility: string;
  nutrition: string;
  training: string;
} {
  const focus = questionnaire.primaryFocus.trim() || "overall athletic performance";
  const metric = questionnaire.priorityMetricName.trim();
  const metricGoal =
    metric && questionnaire.priorityMetricTarget !== null
      ? ` Track ${metric} toward ${questionnaire.priorityMetricTarget}${questionnaire.priorityMetricUnit ? ` ${questionnaire.priorityMetricUnit}` : ""}.`
      : "";
  const event = questionnaire.targetEventName.trim()
    ? ` Programming will build toward ${questionnaire.targetEventName.trim()}${questionnaire.targetEventDate ? ` on ${questionnaire.targetEventDate}` : ""}.`
    : "";
  const days = questionnaire.weeklyTrainingDays
    ? `${questionnaire.weeklyTrainingDays} training days per week`
    : "your available training schedule";

  return {
    training: `Prioritize ${focus} across ${days}.${metricGoal}${event}`,
    nutrition:
      questionnaire.nutritionFocus.trim() ||
      "Set calories and macros from your body data, activity, training demands, and goal direction, then adjust from real progress.",
    cardio:
      questionnaire.cardioFocus.trim() ||
      "Add conditioning that supports the primary goal without unnecessarily interfering with strength or recovery.",
    mobility:
      questionnaire.mobilityFocus.trim() ||
      "Use targeted warm-up mobility and short stretching work based on the movements, sports, and limitations you identify.",
  };
}
