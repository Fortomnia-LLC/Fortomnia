export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function getCalorieTargetForDate(
  defaultTarget: number,
  weekdayTargets: number[],
  dateKey: string,
) {
  if (weekdayTargets.length !== 7) {
    return defaultTarget;
  }

  const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return weekdayTargets[weekday] ?? defaultTarget;
}

export function validateWeekdayCalorieTargets(targets: number[]) {
  return (
    targets.length === 7 &&
    targets.every(
      (target) =>
        Number.isInteger(target) && target >= 500 && target <= 10000,
    )
  );
}
