import FortomniaHealth from "../../../modules/fortomnia-health";
import type { NativeHealthMetric } from "../../../modules/fortomnia-health/src/FortomniaHealth.types";
import { DEFAULT_HEALTH_READ_METRICS, type FortomniaHealthProvider, type HealthQuery } from "./healthProvider";
import type { DailyHealthSummary, HealthAuthorization, HealthMetric, HealthSample } from "./healthTypes";
import { getHealthQueryRange, summarizeHealthDay, summarizeHealthRange } from "./healthNormalization";
import { saveHealthConnectSampleCache } from "./healthConnectStorage";

const nativeMetrics = (metrics: HealthMetric[]) => metrics as NativeHealthMetric[];
export const HEALTH_CONNECT_RECOVERY_METRICS = DEFAULT_HEALTH_READ_METRICS;

function unavailableAuthorization(): HealthAuthorization {
  return { provider: "health_connect", available: false, requestCompleted: false, requestedRead: [], readStatus: "not_requested", grantedRead: [], grantedWrite: [], deniedWrite: [] };
}

export async function getHealthConnectAuthorizationRequestStatus() {
  if (!FortomniaHealth.isAvailable()) return "unavailable" as const;
  return FortomniaHealth.getAuthorizationRequestStatus(nativeMetrics(DEFAULT_HEALTH_READ_METRICS), []);
}

export async function syncHealthConnectSamples(query: HealthQuery): Promise<HealthSample[]> {
  const samples = await healthConnectProvider.readSamples(query);
  await saveHealthConnectSampleCache(samples);
  return samples;
}

export const healthConnectProvider: FortomniaHealthProvider = {
  provider: "health_connect",
  async isAvailable() { return FortomniaHealth.isAvailable(); },
  async getAuthorization() { return unavailableAuthorization(); },
  async requestAuthorization(read, write = []) {
    if (!FortomniaHealth.isAvailable()) return unavailableAuthorization();
    const result = await FortomniaHealth.requestAuthorization(nativeMetrics(read), nativeMetrics(write));
    return {
      provider: "health_connect",
      available: result.available,
      requestCompleted: result.requestCompleted,
      requestedRead: result.requestCompleted ? read : [],
      readStatus: result.requestCompleted ? "requested_unknown" : "not_requested",
      grantedRead: result.grantedRead ?? [],
      grantedWrite: result.grantedWrite,
      deniedWrite: result.deniedWrite,
    };
  },
  async readSamples(query) {
    const samples = await FortomniaHealth.readSamples(nativeMetrics(query.metrics), query.startAt, query.endAt);
    return samples.map((sample) => ({ ...sample, provider: "health_connect" as const }));
  },
  async readDailySummary(date: string): Promise<DailyHealthSummary> {
    const { startAt, endAt } = getHealthQueryRange(date, date);
    return summarizeHealthDay(date, await this.readSamples({ metrics: HEALTH_CONNECT_RECOVERY_METRICS, startAt, endAt }));
  },
  async readDailySummaries(startDate: string, endDate: string) {
    const { startAt, endAt } = getHealthQueryRange(startDate, endDate);
    return summarizeHealthRange(startDate, endDate, await this.readSamples({ metrics: HEALTH_CONNECT_RECOVERY_METRICS, startAt, endAt }));
  },
  async writeSamples() { throw new Error("Health Connect writes are not enabled yet."); },
};
