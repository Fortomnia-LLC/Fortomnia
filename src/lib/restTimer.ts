export const DEFAULT_REST_DURATION_SECONDS = 90;
export const MIN_REST_DURATION_SECONDS = 15;
export const MAX_REST_DURATION_SECONDS = 600;
export const REST_DURATION_STEP_SECONDS = 15;

export function adjustRestDuration(
  currentSeconds: number,
  changeSeconds: number,
) {
  const nextSeconds = Number.isFinite(currentSeconds)
    ? currentSeconds + changeSeconds
    : DEFAULT_REST_DURATION_SECONDS;
  const steppedSeconds =
    Math.round(nextSeconds / REST_DURATION_STEP_SECONDS) *
    REST_DURATION_STEP_SECONDS;

  return Math.min(
    MAX_REST_DURATION_SECONDS,
    Math.max(MIN_REST_DURATION_SECONDS, steppedSeconds),
  );
}

export function formatRestDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getRestSecondsRemaining(
  endsAtMilliseconds: number,
  nowMilliseconds = Date.now(),
) {
  return Math.max(
    0,
    Math.ceil((endsAtMilliseconds - nowMilliseconds) / 1000),
  );
}
