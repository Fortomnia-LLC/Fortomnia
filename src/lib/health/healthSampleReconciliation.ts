import { deduplicateHealthSamples } from "./healthNormalization.ts";
import type { HealthMetric, HealthProvider, HealthSample } from "./healthTypes.ts";

const HEALTH_METRICS = new Set<HealthMetric>([
  "steps", "active_energy", "heart_rate", "resting_heart_rate",
  "heart_rate_variability", "sleep", "body_weight",
  "body_fat_percentage", "workout",
]);

function isValidHealthSample(
  value: unknown,
  provider: HealthProvider,
): value is HealthSample {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const sample = value as Partial<HealthSample>;
  return (
    typeof sample.id === "string" && sample.id.length > 0 &&
    sample.provider === provider &&
    typeof sample.metric === "string" && HEALTH_METRICS.has(sample.metric as HealthMetric) &&
    typeof sample.startAt === "string" && Number.isFinite(Date.parse(sample.startAt)) &&
    (sample.endAt == null ||
      (typeof sample.endAt === "string" && Number.isFinite(Date.parse(sample.endAt))))
  );
}

export function normalizeHealthSampleCache(
  value: unknown,
  provider: HealthProvider,
): HealthSample[] {
  if (!Array.isArray(value)) return [];
  return deduplicateHealthSamples(
    value.filter((sample) => isValidHealthSample(sample, provider)),
  );
}

export function normalizeAppleHealthSampleCache(value: unknown): HealthSample[] {
  return normalizeHealthSampleCache(value, "apple_health");
}

export function reconcileHealthSamples(
  provider: HealthProvider,
  stored: HealthSample[], additions: HealthSample[], deletedIds: string[], retainFrom: string,
): HealthSample[] {
  const deleted = new Set(deletedIds.filter((id) => typeof id === "string" && id.length > 0));
  const normalizedStored = normalizeHealthSampleCache(stored, provider);
  const normalizedAdditions = normalizeHealthSampleCache(additions, provider);
  const replaced = new Set(
    normalizedAdditions
      .flatMap((sample) => [sample.id, sample.externalId ?? ""])
      .filter(Boolean),
  );
  const retained = normalizedStored.filter(
    (sample) => !deleted.has(sample.id) && !deleted.has(sample.externalId ?? "") &&
      !replaced.has(sample.id) && !replaced.has(sample.externalId ?? "") &&
      (sample.endAt ?? sample.startAt) >= retainFrom,
  );
  return normalizeHealthSampleCache([...retained, ...normalizedAdditions], provider)
    .filter((sample) => (sample.endAt ?? sample.startAt) >= retainFrom)
    .sort((a, b) => a.startAt.localeCompare(b.startAt) || a.id.localeCompare(b.id));
}

export function reconcileAppleHealthSamples(
  stored: HealthSample[], additions: HealthSample[], deletedIds: string[], retainFrom: string,
): HealthSample[] {
  return reconcileHealthSamples(
    "apple_health",
    stored,
    additions,
    deletedIds,
    retainFrom,
  );
}
