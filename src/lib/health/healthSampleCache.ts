import AsyncStorage from "@react-native-async-storage/async-storage";
import type { HealthSample } from "./healthTypes";
import { normalizeAppleHealthSampleCache } from "./healthSampleReconciliation";

const APPLE_HEALTH_SAMPLE_CACHE_KEY = "fortomnia.apple-health.samples.v1";
export async function loadAppleHealthSampleCache(): Promise<HealthSample[]> {
  const stored = await AsyncStorage.getItem(APPLE_HEALTH_SAMPLE_CACHE_KEY);
  if (!stored) return [];
  try {
    return normalizeAppleHealthSampleCache(JSON.parse(stored));
  } catch {
    await AsyncStorage.removeItem(APPLE_HEALTH_SAMPLE_CACHE_KEY);
    return [];
  }
}

export async function saveAppleHealthSampleCache(samples: HealthSample[]): Promise<void> {
  await AsyncStorage.setItem(
    APPLE_HEALTH_SAMPLE_CACHE_KEY,
    JSON.stringify(normalizeAppleHealthSampleCache(samples)),
  );
}

export async function clearAppleHealthSampleCache(): Promise<void> {
  await AsyncStorage.removeItem(APPLE_HEALTH_SAMPLE_CACHE_KEY);
}

