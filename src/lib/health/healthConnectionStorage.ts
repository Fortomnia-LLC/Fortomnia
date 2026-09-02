import * as SecureStore from "expo-secure-store";
import {
  createAppleHealthConnection,
  parseAppleHealthConnection,
  type StoredAppleHealthConnection,
} from "./healthConnection";
import { clearAppleHealthAnchors } from "./healthAnchorStorage";
import { clearAppleHealthSampleCache } from "./healthSampleCache";

const APPLE_HEALTH_CONNECTION_KEY = "fortomnia.apple-health.connection";

export async function loadAppleHealthConnection(): Promise<StoredAppleHealthConnection | null> {
  const stored = await SecureStore.getItemAsync(APPLE_HEALTH_CONNECTION_KEY);
  if (!stored) return null;

  const connection = parseAppleHealthConnection(stored);
  if (connection) return connection;

  await SecureStore.deleteItemAsync(APPLE_HEALTH_CONNECTION_KEY);
  return null;
}

export async function saveAppleHealthConnection(
  lastSyncedAt: string | null,
): Promise<StoredAppleHealthConnection> {
  const connection = createAppleHealthConnection(lastSyncedAt);
  await SecureStore.setItemAsync(
    APPLE_HEALTH_CONNECTION_KEY,
    JSON.stringify(connection),
  );
  return connection;
}

export async function clearAppleHealthConnection(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(APPLE_HEALTH_CONNECTION_KEY),
    clearAppleHealthAnchors(),
    clearAppleHealthSampleCache(),
  ]);
}

