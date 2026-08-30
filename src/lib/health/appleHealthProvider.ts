import FortomniaHealth from "../../../modules/fortomnia-health";
import type { NativeHealthMetric } from "../../../modules/fortomnia-health/src/FortomniaHealth.types";
import {
  DEFAULT_HEALTH_READ_METRICS,
  type FortomniaHealthProvider,
  type HealthQuery,
} from "./healthProvider";
import type { DailyHealthSummary, HealthAuthorization, HealthMetric, HealthSample } from "./healthTypes";
import { summarizeHealthDay, summarizeHealthRange } from "./healthNormalization";

function dayBoundary(date: string, endOfDay = false): string {
  return new Date(`${date}T${endOfDay ? "23:59:59.999" : "00:00:00"}`).toISOString();
}

const nativeMetrics = (metrics: HealthMetric[]) => metrics as NativeHealthMetric[];

export async function getAppleHealthAuthorizationRequestStatus() {
  if (!FortomniaHealth.isAvailable()) return "unavailable" as const;
  return FortomniaHealth.getAuthorizationRequestStatus(
    nativeMetrics(DEFAULT_HEALTH_READ_METRICS),
    [],
  );
}

export const appleHealthProvider: FortomniaHealthProvider = {
  provider: "apple_health",
  async isAvailable() { return FortomniaHealth.isAvailable(); },
  async getAuthorization(): Promise<HealthAuthorization> {
    return { provider: "apple_health", available: FortomniaHealth.isAvailable(), grantedRead: [], grantedWrite: [] };
  },
  async requestAuthorization(read, write = []) {
    const available = FortomniaHealth.isAvailable();
    if (!available) return { provider: "apple_health", available: false, grantedRead: [], grantedWrite: [] };
    const granted = await FortomniaHealth.requestAuthorization(nativeMetrics(read), nativeMetrics(write));
    return { provider: "apple_health", available: true, grantedRead: granted ? read : [], grantedWrite: granted ? write : [] };
  },
  async readSamples(query: HealthQuery): Promise<HealthSample[]> {
    const samples = await FortomniaHealth.readSamples(nativeMetrics(query.metrics), query.startAt, query.endAt);
    return samples.map((sample) => ({ ...sample, provider: "apple_health" as const }));
  },
  async readDailySummary(date: string): Promise<DailyHealthSummary> {
    const startAt = dayBoundary(date);
    const endAt = dayBoundary(date, true);
    const samples = await this.readSamples({ metrics: ["steps", "active_energy", "resting_heart_rate", "heart_rate_variability", "sleep", "body_weight", "body_fat_percentage", "workout"], startAt, endAt });
    return summarizeHealthDay(date, samples);
  },
  async readDailySummaries(startDate: string, endDate: string): Promise<DailyHealthSummary[]> {
    const samples = await this.readSamples({
      metrics: ["steps", "active_energy", "resting_heart_rate", "heart_rate_variability", "sleep", "body_weight", "body_fat_percentage", "workout"],
      startAt: dayBoundary(startDate),
      endAt: dayBoundary(endDate, true),
    });
    return summarizeHealthRange(startDate, endDate, samples);
  },
  async writeSamples() {
    throw new Error("Apple Health writes are not enabled yet.");
  },
};
