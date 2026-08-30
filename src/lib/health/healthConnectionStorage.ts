import * as SecureStore from "expo-secure-store";

const APPLE_HEALTH_CONNECTION_KEY = "fortomnia.apple-health.connection";

export type StoredAppleHealthConnection = {
  connected: true;
  lastSyncedAt: string;
};

export async function loadAppleHealthConnection(): Promise<StoredAppleHealthConnection | null> {
  const stored = await SecureStore.getItemAsync(APPLE_HEALTH_CONNECTION_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<StoredAppleHealthConnection>;
    if (
      parsed.connected === true &&
      typeof parsed.lastSyncedAt === "string" &&
      Number.isFinite(Date.parse(parsed.lastSyncedAt))
    ) {
      return {
        connected: true,
        lastSyncedAt: parsed.lastSyncedAt,
      };
    }
  } catch {
    // Invalid local state should never block a fresh HealthKit connection.
  }

  await SecureStore.deleteItemAsync(APPLE_HEALTH_CONNECTION_KEY);
  return null;
}

export async function saveAppleHealthConnection(
  lastSyncedAt: string,
): Promise<StoredAppleHealthConnection> {
  const connection: StoredAppleHealthConnection = {
    connected: true,
    lastSyncedAt,
  };
  await SecureStore.setItemAsync(
    APPLE_HEALTH_CONNECTION_KEY,
    JSON.stringify(connection),
  );
  return connection;
}

export async function clearAppleHealthConnection(): Promise<void> {
  await SecureStore.deleteItemAsync(APPLE_HEALTH_CONNECTION_KEY);
}
