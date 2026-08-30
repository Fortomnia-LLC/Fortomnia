import type { DailyHealthSummary } from "./healthTypes";

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildRecoveryPreview(today = new Date()): DailyHealthSummary[] {
  const summaries: DailyHealthSummary[] = [];
  for (let offset = 21; offset >= 1; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    summaries.push({
      date: dateKey(date),
      sleepMinutes: 455 + ((offset % 5) - 2) * 9,
      restingHeartRateBpm: 57 + ((offset % 4) - 1.5),
      heartRateVariabilityMs: 54 + ((offset % 6) - 2.5) * 2,
      steps: 6200 + (offset % 7) * 650,
      activeEnergyKcal: 430 + (offset % 5) * 55,
      workoutMinutes: offset % 3 === 0 ? 0 : 55 + (offset % 4) * 8,
    });
  }

  summaries.push({
    date: dateKey(today),
    sleepMinutes: 365,
    restingHeartRateBpm: 63,
    heartRateVariabilityMs: 43,
    steps: 2840,
    activeEnergyKcal: 230,
    workoutMinutes: 0,
  });
  return summaries;
}
