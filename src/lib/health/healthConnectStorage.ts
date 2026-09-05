import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  createHealthConnection,
  parseHealthConnection,
  type StoredHealthConnection,
} from "./healthConnection";
import type { HealthSample } from "./healthTypes";
import { normalizeAppleHealthSampleCache } from "./healthSampleReconciliation";

const CONNECTION_KEY = "fortomnia.health-connect.connection";
const SAMPLE_CACHE_KEY = "fortomnia.health-connect.samples.v1";

export async function loadHealthConnectConnection(): Promise<StoredHealthConnection | null> {
  const stored = await SecureStore.getItemAsync(CONNECTION_KEY);
  if (!stored) return null;
  const connection = parseHealthConnection(stored);
  if (connection) return connection;
  await SecureStore.deleteItemAsync(CONNECTION_KEY);
  return null;
}

export async function saveHealthConnectConnection(lastSyncedAt: string | null) {
  const connection = createHealthConnection(lastSyncedAt);
  await SecureStore.setItemAsync(CONNECTION_KEY, JSON.stringify(connection));
  return connection;
}

export async function loadHealthConnectSampleCache(): Promise<HealthSample[]> {
  const stored = await AsyncStorage.getItem(SAMPLE_CACHE_KEY);
  if (!stored) return [];
  try {
    return normalizeAppleHealthSampleCache(JSON.parse(stored));
  } catch {
    await AsyncStorage.removeItem(SAMPLE_CACHE_KEY);
    return [];
  }
}

export async function saveHealthConnectSampleCache(samples: HealthSample[]): Promise<void> {
  await AsyncStorage.setItem(SAMPLE_CACHE_KEY, JSON.stringify(normalizeAppleHealthSampleCache(samples)));
}

export async function clearHealthConnectConnection(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(CONNECTION_KEY),
    AsyncStorage.removeItem(SAMPLE_CACHE_KEY),
  ]);
}
