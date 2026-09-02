import FortomniaHealth from "../../../modules/fortomnia-health";
import type {
  NativeHealthAnchors,
  NativeHealthMetric,
} from "../../../modules/fortomnia-health/src/FortomniaHealth.types";
import {
  DEFAULT_HEALTH_READ_METRICS,
  type FortomniaHealthProvider,
  type HealthQuery,
} from "./healthProvider";
import type { DailyHealthSummary, HealthAuthorization, HealthMetric, HealthSample } from "./healthTypes";
import {
  getHealthQueryRange,
  summarizeHealthDay,
  summarizeHealthRange,
} from "./healthNormalization";
import { mapAppleHealthAuthorization, unavailableAppleHealthAuthorization } from "./healthAuthorization";
import {
  loadAppleHealthAnchors,
  saveAppleHealthAnchors,
} from "./healthAnchorStorage";
import { mergeAppleHealthAnchors } from "./healthAnchors";
import {
  loadAppleHealthSampleCache,
  saveAppleHealthSampleCache,
} from "./healthSampleCache";
import { reconcileAppleHealthSamples } from "./healthSampleReconciliation";

const nativeMetrics = (metrics: HealthMetric[]) => metrics as NativeHealthMetric[];

export type AppleHealthChanges = {
  samples: HealthSample[];
  deletedIds: string[];
  anchors: Partial<Record<HealthMetric, string>>;
};

export type AppleHealthSyncResult = AppleHealthChanges & {
  cachedSamples: HealthSample[];
};

type AppleHealthSyncDependencies = {
  loadAnchors: typeof loadAppleHealthAnchors;
  loadSamples: typeof loadAppleHealthSampleCache;
  readChanges: typeof readAnchoredAppleHealthSamples;
  saveAnchors: typeof saveAppleHealthAnchors;
  saveSamples: typeof saveAppleHealthSampleCache;
};

export async function readAnchoredAppleHealthSamples(
  query: HealthQuery,
  anchors: Partial<Record<HealthMetric, string>>,
): Promise<AppleHealthChanges> {
  const result = await FortomniaHealth.readAnchoredSamples(
    nativeMetrics(query.metrics),
    query.startAt,
    query.endAt,
    anchors as NativeHealthAnchors,
  );
  return {
    samples: result.samples.map((sample) => ({
      ...sample,
      provider: "apple_health" as const,
    })),
    deletedIds: result.deletedIds,
    anchors: result.anchors,
  };
}

export async function syncAnchoredAppleHealthSamples(
  query: HealthQuery,
  dependencies: AppleHealthSyncDependencies = {
    loadAnchors: loadAppleHealthAnchors,
    loadSamples: loadAppleHealthSampleCache,
    readChanges: readAnchoredAppleHealthSamples,
    saveAnchors: saveAppleHealthAnchors,
    saveSamples: saveAppleHealthSampleCache,
  },
): Promise<AppleHealthSyncResult> {
  const [storedAnchors, storedSamples] = await Promise.all([
    dependencies.loadAnchors(),
    dependencies.loadSamples(),
  ]);
  const changes = await dependencies.readChanges(query, storedAnchors);
  const cachedSamples = reconcileAppleHealthSamples(
    storedSamples,
    changes.samples,
    changes.deletedIds,
    query.startAt,
  );

  // Persist samples before advancing anchors. If cache storage fails, the same
  // HealthKit changes are replayed safely on the next synchronization.
  await dependencies.saveSamples(cachedSamples);
  await dependencies.saveAnchors(
    mergeAppleHealthAnchors(storedAnchors, changes.anchors),
  );
  return { ...changes, cachedSamples };
}

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
    if (!FortomniaHealth.isAvailable()) return unavailableAppleHealthAuthorization();
    return {
      ...unavailableAppleHealthAuthorization(),
      available: true,
    };
  },
  async requestAuthorization(read, write = []) {
    const available = FortomniaHealth.isAvailable();
    if (!available) return unavailableAppleHealthAuthorization();
    const result = await FortomniaHealth.requestAuthorization(nativeMetrics(read), nativeMetrics(write));
    return mapAppleHealthAuthorization(read, result);
  },
  async readSamples(query: HealthQuery): Promise<HealthSample[]> {
    const samples = await FortomniaHealth.readSamples(nativeMetrics(query.metrics), query.startAt, query.endAt);
    return samples.map((sample) => ({ ...sample, provider: "apple_health" as const }));
  },
  async readDailySummary(date: string): Promise<DailyHealthSummary> {
    const { startAt, endAt } = getHealthQueryRange(date, date);
    const samples = await this.readSamples({ metrics: ["steps", "active_energy", "resting_heart_rate", "heart_rate_variability", "sleep", "body_weight", "body_fat_percentage", "workout"], startAt, endAt });
    return summarizeHealthDay(date, samples);
  },
  async readDailySummaries(startDate: string, endDate: string): Promise<DailyHealthSummary[]> {
    const { startAt, endAt } = getHealthQueryRange(startDate, endDate);
    const samples = await this.readSamples({
      metrics: ["steps", "active_energy", "resting_heart_rate", "heart_rate_variability", "sleep", "body_weight", "body_fat_percentage", "workout"],
      startAt,
      endAt,
    });
    return summarizeHealthRange(startDate, endDate, samples);
  },
  async writeSamples() {
    throw new Error("Apple Health writes are not enabled yet.");
  },
};

