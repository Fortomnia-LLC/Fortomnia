export type HealthErrorKind =
  | "authorization"
  | "invalid_range"
  | "protected_data"
  | "unavailable"
  | "unknown";

export type HealthErrorPresentation = {
  kind: HealthErrorKind;
  message: string;
};

const PRESENTATIONS: Record<HealthErrorKind, string> = {
  authorization:
    "Review Fortomnia's Health permissions in the Health app or iPhone Settings, then try again.",
  invalid_range: "Fortomnia could not read that Apple Health date range. Try again.",
  protected_data: "Unlock this iPhone, then try Apple Health again.",
  unavailable: "Apple Health is not available on this device.",
  unknown: "Apple Health could not complete the request. Try again.",
};

function errorSignature(error: unknown) {
  if (typeof error === "string") return error.toLowerCase();
  if (!error || typeof error !== "object") return "";

  const candidate = error as Record<string, unknown>;
  return [candidate.code, candidate.domain, candidate.message, candidate.name]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

export function getHealthErrorPresentation(error: unknown): HealthErrorPresentation {
  const signature = errorSignature(error);
  let kind: HealthErrorKind = "unknown";

  if (/protected.?data|device.?locked|interaction.?not.?allowed/.test(signature)) {
    kind = "protected_data";
  } else if (/not.?authorized|authorization|permission|sharing.?denied|access.?denied/.test(signature)) {
    kind = "authorization";
  } else if (/invalid.?date|invalid.?range|start.?date|end.?date/.test(signature)) {
    kind = "invalid_range";
  } else if (/health.?data.?unavailable|healthkit.?unavailable|not.?available|unsupported/.test(signature)) {
    kind = "unavailable";
  }

  return { kind, message: PRESENTATIONS[kind] };
}
