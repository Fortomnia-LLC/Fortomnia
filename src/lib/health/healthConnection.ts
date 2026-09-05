export type AppleHealthAuthorizationRequestStatus =
  | "should_request"
  | "unnecessary"
  | "unknown"
  | "unavailable";

export function shouldRestoreAppleHealth(
  available: boolean,
  requestStatus: AppleHealthAuthorizationRequestStatus,
  hasStoredConnection: boolean,
): boolean {
  return available && hasStoredConnection && requestStatus === "unnecessary";
}

export type StoredHealthConnection = {
  connected: true;
  lastSyncedAt: string | null;
};

export function parseHealthConnection(value: string): StoredHealthConnection | null {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (parsed.connected !== true) return null;
    if (parsed.lastSyncedAt === null || parsed.lastSyncedAt === undefined) {
      return { connected: true, lastSyncedAt: null };
    }
    if (
      typeof parsed.lastSyncedAt === "string" &&
      Number.isFinite(Date.parse(parsed.lastSyncedAt))
    ) {
      return {
        connected: true,
        lastSyncedAt: new Date(parsed.lastSyncedAt).toISOString(),
      };
    }
  } catch {
    // Invalid local state is treated as disconnected.
  }
  return null;
}

export function createHealthConnection(
  lastSyncedAt: string | null,
): StoredHealthConnection {
  if (lastSyncedAt === null) return { connected: true, lastSyncedAt: null };
  const parsed = Date.parse(lastSyncedAt);
  if (!Number.isFinite(parsed)) throw new TypeError("A valid Apple Health sync time is required.");
  return { connected: true, lastSyncedAt: new Date(parsed).toISOString() };
}

export type StoredAppleHealthConnection = StoredHealthConnection;
export const parseAppleHealthConnection = parseHealthConnection;
export const createAppleHealthConnection = createHealthConnection;

export type HealthSyncFreshness = {
  ageMinutes: number | null;
  status: "never_synced" | "fresh" | "stale" | "clock_skew";
};

export function getHealthSyncFreshness(
  lastSyncedAt: string | null,
  now = new Date(),
  staleAfterMinutes = 360,
): HealthSyncFreshness {
  if (!lastSyncedAt) return { ageMinutes: null, status: "never_synced" };

  const syncedAtMs = Date.parse(lastSyncedAt);
  if (!Number.isFinite(syncedAtMs)) {
    return { ageMinutes: null, status: "never_synced" };
  }

  const ageMinutes = Math.floor((now.getTime() - syncedAtMs) / 60_000);
  if (ageMinutes < -5) return { ageMinutes, status: "clock_skew" };
  if (ageMinutes > staleAfterMinutes) return { ageMinutes, status: "stale" };
  return { ageMinutes: Math.max(0, ageMinutes), status: "fresh" };
}
