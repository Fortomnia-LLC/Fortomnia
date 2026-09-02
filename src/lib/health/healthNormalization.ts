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

function localDateKey(value: string, offsetMinutes?: number | null): string {
  const date = new Date(value);
  if (
    typeof offsetMinutes === "number" &&
    Number.isFinite(offsetMinutes) &&
    offsetMinutes >= -14 * 60 &&
    offsetMinutes <= 14 * 60
  ) {
    const recordedLocalTime = new Date(date.getTime() + offsetMinutes * 60_000);
    const year = recordedLocalTime.getUTCFullYear();
    const month = String(recordedLocalTime.getUTCMonth() + 1).padStart(2, "0");
    const day = String(recordedLocalTime.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sampleDateKey(sample: HealthSample): string {
  // Overnight sleep belongs to the day the athlete wakes up. Other signals
  // remain attached to the day on which the sample began. Native-recorded
  // offsets keep that assignment stable after travel or daylight-saving changes.
  if (sample.metric === "sleep" && sample.endAt) {
    return localDateKey(sample.endAt, sample.endTimeZoneOffsetMinutes);
  }
  return localDateKey(sample.startAt, sample.startTimeZoneOffsetMinutes);
}

function addDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return localDateKey(date.toISOString());
}

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && localDateKey(parsed.toISOString()) === value;
}

export function getHealthQueryRange(startDate: string, endDate: string) {
  if (!isValidDateKey(startDate) || !isValidDateKey(endDate) || startDate > endDate) {
    throw new RangeError("Health query dates must be an ordered, valid YYYY-MM-DD range.");
  }

  // The widest civil time-zone offsets are UTC-12 through UTC+14. Padding
  // both edges prevents travel from excluding samples before per-sample
  // calendar-day assignment runs.
  const start = new Date(`${startDate}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 2);
  end.setUTCMilliseconds(-1);
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

export function summarizeHealthRange(
  startDate: string,
  endDate: string,
  input: HealthSample[],
): DailyHealthSummary[] {
  if (!isValidDateKey(startDate) || !isValidDateKey(endDate)) {
    throw new RangeError("Health summary dates must use valid YYYY-MM-DD calendar dates.");
  }
  if (startDate > endDate) {
    throw new RangeError("Health summary start date must not be after the end date.");
  }

  const summaries: DailyHealthSummary[] = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    summaries.push(summarizeHealthDay(date, input));
  }
  return summaries;
}
