export type HealthProvider = "apple_health" | "health_connect" | "fortomnia";

export type HealthMetric =
  | "steps"
  | "active_energy"
  | "heart_rate"
  | "resting_heart_rate"
  | "heart_rate_variability"
  | "sleep"
  | "body_weight"
  | "body_fat_percentage"
  | "workout";

export type HealthPermission = "read" | "write";

export type HealthSample = {
  id: string;
  provider: HealthProvider;
  metric: HealthMetric;
  startAt: string;
  endAt?: string | null;
  value?: number | null;
  unit?: string | null;
  sourceName?: string | null;
  sourceBundleId?: string | null;
  externalId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export type HealthAuthorization = {
  provider: HealthProvider;
  available: boolean;
  grantedRead: HealthMetric[];
  grantedWrite: HealthMetric[];
};

export type DailyHealthSummary = {
  date: string;
  steps?: number | null;
  activeEnergyKcal?: number | null;
  restingHeartRateBpm?: number | null;
  heartRateVariabilityMs?: number | null;
  sleepMinutes?: number | null;
  bodyWeightKg?: number | null;
  bodyFatPercentage?: number | null;
  workoutMinutes?: number | null;
};

export type RecoverySignals = {
  date: string;
  sleepMinutes?: number | null;
  restingHeartRateBpm?: number | null;
  heartRateVariabilityMs?: number | null;
  recentWorkoutMinutes?: number | null;
  sourceDays: number;
};
