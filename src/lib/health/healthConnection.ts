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
