import type { HealthMetric } from "./healthTypes";

export type AppleHealthAnchors = Partial<Record<HealthMetric, string>>;

const healthMetrics: HealthMetric[] = [
  "steps",
  "active_energy",
  "heart_rate",
  "resting_heart_rate",
  "heart_rate_variability",
  "sleep",
  "body_weight",
  "body_fat_percentage",
  "workout",
];

export function normalizeAppleHealthAnchors(value: unknown): AppleHealthAnchors {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const anchors: AppleHealthAnchors = {};
  for (const metric of healthMetrics) {
    const anchor = input[metric];
    if (typeof anchor === "string" && anchor.length > 0 && anchor.length <= 65_536) {
      anchors[metric] = anchor;
    }
  }
  return anchors;
}

export function mergeAppleHealthAnchors(
  current: AppleHealthAnchors,
  incoming: AppleHealthAnchors,
): AppleHealthAnchors {
  return normalizeAppleHealthAnchors({ ...current, ...incoming });
}
