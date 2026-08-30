import type {
  DailyHealthSummary,
  HealthAuthorization,
  HealthMetric,
  HealthProvider,
  HealthSample,
} from "./healthTypes";

export type HealthQuery = {
  metrics: HealthMetric[];
  startAt: string;
  endAt: string;
};

export interface FortomniaHealthProvider {
  readonly provider: HealthProvider;
  isAvailable(): Promise<boolean>;
  getAuthorization(): Promise<HealthAuthorization>;
  requestAuthorization(read: HealthMetric[], write?: HealthMetric[]): Promise<HealthAuthorization>;
  readSamples(query: HealthQuery): Promise<HealthSample[]>;
  readDailySummary(date: string): Promise<DailyHealthSummary>;
  readDailySummaries(startDate: string, endDate: string): Promise<DailyHealthSummary[]>;
  writeSamples(samples: HealthSample[]): Promise<void>;
}

export const DEFAULT_HEALTH_READ_METRICS: HealthMetric[] = [
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

export const DEFAULT_HEALTH_WRITE_METRICS: HealthMetric[] = [
  "body_weight",
  "body_fat_percentage",
  "workout",
];
