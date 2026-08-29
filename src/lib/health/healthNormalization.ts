import type { DailyHealthSummary, HealthSample } from "./healthTypes";

function sampleKey(sample: HealthSample): string {
  if (sample.externalId) return `${sample.provider}:${sample.externalId}`;
  return [sample.provider, sample.metric, sample.startAt, sample.endAt ?? "", sample.value ?? "", sample.unit ?? "", sample.sourceBundleId ?? sample.sourceName ?? ""].join(":");
}

export function deduplicateHealthSamples(samples: HealthSample[]): HealthSample[] {
  const seen = new Set<string>();
  return samples.filter((sample) => {
    const key = sampleKey(sample);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sumMetric(samples: HealthSample[], metric: HealthSample["metric"]): number | null {
  const values = samples.filter((sample) => sample.metric === metric && typeof sample.value === "number").map((sample) => sample.value as number);
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

function latestMetric(samples: HealthSample[], metric: HealthSample["metric"]): number | null {
  const matching = samples.filter((sample) => sample.metric === metric && typeof sample.value === "number").sort((a, b) => b.startAt.localeCompare(a.startAt));
  return matching[0]?.value ?? null;
}

export function summarizeHealthDay(date: string, input: HealthSample[]): DailyHealthSummary {
  const samples = deduplicateHealthSamples(input).filter((sample) => sample.startAt.startsWith(date));
  return {
    date,
    steps: sumMetric(samples, "steps"),
    activeEnergyKcal: sumMetric(samples, "active_energy"),
    restingHeartRateBpm: latestMetric(samples, "resting_heart_rate"),
    heartRateVariabilityMs: latestMetric(samples, "heart_rate_variability"),
    sleepMinutes: sumMetric(samples, "sleep"),
    bodyWeightKg: latestMetric(samples, "body_weight"),
    bodyFatPercentage: latestMetric(samples, "body_fat_percentage"),
    workoutMinutes: sumMetric(samples, "workout"),
  };
}
