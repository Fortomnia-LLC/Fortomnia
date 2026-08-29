import FortomniaHealth from "../../../modules/fortomnia-health";
import type { NativeHealthMetric } from "../../../modules/fortomnia-health/src/FortomniaHealth.types";
import type { FortomniaHealthProvider, HealthQuery } from "./healthProvider";
import type { DailyHealthSummary, HealthAuthorization, HealthMetric, HealthSample } from "./healthTypes";
import { summarizeHealthDay } from "./healthNormalization";

const nativeMetrics = (metrics: HealthMetric[]) => metrics as NativeHealthMetric[];

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
    const startAt = new Date(`${date}T00:00:00`).toISOString();
    const endAt = new Date(`${date}T23:59:59.999`).toISOString();
    const samples = await this.readSamples({ metrics: ["steps", "active_energy", "resting_heart_rate", "heart_rate_variability", "sleep", "body_weight", "body_fat_percentage", "workout"], startAt, endAt });
    return summarizeHealthDay(date, samples);
  },
  async writeSamples() {
    throw new Error("Apple Health writes are not enabled yet.");
  },
};
