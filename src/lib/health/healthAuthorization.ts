import type { NativeHealthAuthorizationResult } from "../../../modules/fortomnia-health/src/FortomniaHealthModule";
import type { HealthAuthorization, HealthMetric } from "./healthTypes";

export function unavailableAppleHealthAuthorization(): HealthAuthorization {
  return {
    provider: "apple_health",
    available: false,
    requestCompleted: false,
    requestedRead: [],
    readStatus: "not_requested",
    grantedRead: [],
    grantedWrite: [],
    deniedWrite: [],
  };
}

export function mapAppleHealthAuthorization(
  requestedRead: HealthMetric[],
  result: NativeHealthAuthorizationResult,
): HealthAuthorization {
  return {
    provider: "apple_health",
    available: result.available,
    requestCompleted: result.requestCompleted,
    requestedRead: result.requestCompleted ? requestedRead : [],
    readStatus: result.requestCompleted ? "requested_unknown" : "not_requested",
    // HealthKit does not disclose per-category read authorization.
    grantedRead: [],
    grantedWrite: result.grantedWrite,
    deniedWrite: result.deniedWrite,
  };
}
