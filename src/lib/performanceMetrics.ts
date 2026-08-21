export const PERFORMANCE_TYPES = [
  "reps",
  "time",
  "distance",
  "calories",
  "rounds",
] as const;

export type PerformanceType = (typeof PERFORMANCE_TYPES)[number];
export type MetricUnit =
  | "meters"
  | "kilometers"
  | "miles"
  | "yards"
  | "calories"
  | "rounds";

export const PERFORMANCE_LABELS: Record<PerformanceType, string> = {
  calories: "Calories",
  distance: "Distance",
  reps: "Repetitions",
  rounds: "Rounds",
  time: "Time",
};

export const DISTANCE_UNITS: MetricUnit[] = [
  "meters",
  "kilometers",
  "miles",
  "yards",
];

export function defaultMetricUnit(type: PerformanceType): MetricUnit | null {
  if (type === "distance") return "meters";
  if (type === "calories") return "calories";
  if (type === "rounds") return "rounds";
  return null;
}

export function formatMetricValue(
  type: PerformanceType,
  value: number,
  unit: MetricUnit,
): string {
  if (type === "calories") return `${value} cal`;
  if (type === "rounds") return `${value} rounds`;

  const labels: Record<MetricUnit, string> = {
    calories: "cal",
    kilometers: "km",
    meters: "m",
    miles: "mi",
    rounds: "rounds",
    yards: "yd",
  };
  return `${value} ${labels[unit]}`;
}
