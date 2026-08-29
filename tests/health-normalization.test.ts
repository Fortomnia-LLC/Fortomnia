import { deduplicateHealthSamples, summarizeHealthDay } from "../src/lib/health/healthNormalization";
import type { HealthSample } from "../src/lib/health/healthTypes";

const samples: HealthSample[] = [
  { id: "1", provider: "apple_health", metric: "steps", startAt: "2026-08-29T08:00:00-05:00", value: 1200, unit: "count", externalId: "steps-1" },
  { id: "duplicate", provider: "apple_health", metric: "steps", startAt: "2026-08-29T08:00:00-05:00", value: 1200, unit: "count", externalId: "steps-1" },
  { id: "2", provider: "apple_health", metric: "steps", startAt: "2026-08-29T12:00:00-05:00", value: 800, unit: "count", externalId: "steps-2" },
  { id: "3", provider: "apple_health", metric: "resting_heart_rate", startAt: "2026-08-29T07:00:00-05:00", value: 58, unit: "bpm" },
  { id: "4", provider: "apple_health", metric: "heart_rate_variability", startAt: "2026-08-29T07:05:00-05:00", value: 52, unit: "ms" },
  { id: "5", provider: "apple_health", metric: "sleep", startAt: "2026-08-29T00:00:00-05:00", value: 455, unit: "min" },
];

describe("health normalization", () => {
  it("deduplicates provider samples using external IDs", () => {
    expect(deduplicateHealthSamples(samples)).toHaveLength(5);
  });

  it("creates a normalized daily summary", () => {
    expect(summarizeHealthDay("2026-08-29", samples)).toMatchObject({
      steps: 2000,
      restingHeartRateBpm: 58,
      heartRateVariabilityMs: 52,
      sleepMinutes: 455,
    });
  });
});
