import type { DailyHealthSummary } from "./healthTypes";

export type HealthConnectDailyAggregate = Pick<
  DailyHealthSummary,
  "date" | "steps" | "activeEnergyKcal" | "sleepMinutes" | "workoutMinutes"
>;

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalHealthDayRange(date: string) {
  return {
    startAt: new Date(`${date}T00:00:00`).toISOString(),
    endAt: new Date(`${addDays(date, 1)}T00:00:00`).toISOString(),
  };
}

export function applyHealthConnectAggregates(
  summaries: DailyHealthSummary[],
  aggregates: HealthConnectDailyAggregate[],
): DailyHealthSummary[] {
  const aggregateByDate = new Map(
    aggregates.map((aggregate) => [aggregate.date, aggregate]),
  );
  return summaries.map((summary) => {
    const aggregate = aggregateByDate.get(summary.date);
    if (!aggregate) return summary;
    return {
      ...summary,
      steps: aggregate.steps ?? null,
      activeEnergyKcal: aggregate.activeEnergyKcal ?? null,
      sleepMinutes: aggregate.sleepMinutes ?? null,
      workoutMinutes: aggregate.workoutMinutes ?? null,
    };
  });
}
