export type AppleHealthAuthorizationRequestStatus =
  | "should_request"
  | "unnecessary"
  | "unknown"
  | "unavailable";

export function shouldRestoreAppleHealth(
  available: boolean,
  requestStatus: AppleHealthAuthorizationRequestStatus,
): boolean {
  return available && requestStatus === "unnecessary";
}

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
