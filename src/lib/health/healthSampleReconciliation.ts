import { deduplicateHealthSamples } from "./healthNormalization.ts";
import type { HealthMetric, HealthSample } from "./healthTypes.ts";

const HEALTH_METRICS = new Set<HealthMetric>([
  "steps", "active_energy", "heart_rate", "resting_heart_rate",
  "heart_rate_variability", "sleep", "body_weight",
  "body_fat_percentage", "workout",
]);

function isValidAppleHealthSample(value: unknown): value is HealthSample {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const sample = value as Partial<HealthSample>;
  return (
    typeof sample.id === "string" && sample.id.length > 0 &&
    sample.provider === "apple_health" &&
    typeof sample.metric === "string" && HEALTH_METRICS.has(sample.metric as HealthMetric) &&
    typeof sample.startAt === "string" && Number.isFinite(Date.parse(sample.startAt)) &&
    (sample.endAt == null ||
      (typeof sample.endAt === "string" && Number.isFinite(Date.parse(sample.endAt))))
  );
}

export function normalizeAppleHealthSampleCache(value: unknown): HealthSample[] {
  if (!Array.isArray(value)) return [];
  return deduplicateHealthSamples(value.filter(isValidAppleHealthSample));
}

export function reconcileAppleHealthSamples(
  stored: HealthSample[], additions: HealthSample[], deletedIds: string[], retainFrom: string,
): HealthSample[] {
  const deleted = new Set(deletedIds.filter((id) => typeof id === "string" && id.length > 0));
  const replaced = new Set(
    additions.flatMap((sample) => [sample.id, sample.externalId ?? ""]).filter(Boolean),
  );
  const retained = stored.filter(
    (sample) => !deleted.has(sample.id) && !deleted.has(sample.externalId ?? "") &&
      !replaced.has(sample.id) && !replaced.has(sample.externalId ?? "") &&
      (sample.endAt ?? sample.startAt) >= retainFrom,
  );
  return normalizeAppleHealthSampleCache([...retained, ...additions])
    .filter((sample) => (sample.endAt ?? sample.startAt) >= retainFrom)
    .sort((a, b) => a.startAt.localeCompare(b.startAt) || a.id.localeCompare(b.id));
}

