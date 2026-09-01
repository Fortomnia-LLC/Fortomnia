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

function usableValue(sample: HealthSample): sample is HealthSample & { value: number } {
  return (
    typeof sample.value === "number" &&
    Number.isFinite(sample.value) &&
    sample.value >= 0
  );
}

function valuesForMetric(
  samples: HealthSample[],
  metric: HealthSample["metric"],
): number[] {
  return samples
    .filter((sample) => sample.metric === metric)
    .filter(usableValue)
    .map((sample) => sample.value);
}

function sumMetric(samples: HealthSample[], metric: HealthSample["metric"]): number | null {
  const values = valuesForMetric(samples, metric);
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

function latestMetric(samples: HealthSample[], metric: HealthSample["metric"]): number | null {
  const matching = samples
    .filter((sample) => sample.metric === metric && usableValue(sample))
    .sort((a, b) => b.startAt.localeCompare(a.startAt));
  return matching[0]?.value ?? null;
}

function averageMetric(samples: HealthSample[], metric: HealthSample["metric"]): number | null {
  const values = valuesForMetric(samples, metric);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

export function summarizeHealthDay(date: string, input: HealthSample[]): DailyHealthSummary {
  const samples = deduplicateHealthSamples(input).filter((sample) => sampleDateKey(sample) === date);
  return {
    date,
    steps: sumMetric(samples, "steps"),
    activeEnergyKcal: sumMetric(samples, "active_energy"),
    restingHeartRateBpm: latestMetric(samples, "resting_heart_rate"),
    heartRateVariabilityMs: averageMetric(samples, "heart_rate_variability"),
    sleepMinutes: sumMetric(samples, "sleep"),
    bodyWeightKg: latestMetric(samples, "body_weight"),
    bodyFatPercentage: latestMetric(samples, "body_fat_percentage"),
    workoutMinutes: sumMetric(samples, "workout"),
  };
}

function localDateKey(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sampleDateKey(sample: HealthSample): string {
  // Overnight sleep belongs to the day the athlete wakes up. Other signals
  // remain attached to the day on which the sample began.
  if (sample.metric === "sleep" && sample.endAt) return localDateKey(sample.endAt);
  return localDateKey(sample.startAt);
}

function addDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return localDateKey(date.toISOString());
}

export function summarizeHealthRange(
  startDate: string,
  endDate: string,
  input: HealthSample[],
): DailyHealthSummary[] {
  const summaries: DailyHealthSummary[] = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    summaries.push(summarizeHealthDay(date, input));
  }
  return summaries;
}
