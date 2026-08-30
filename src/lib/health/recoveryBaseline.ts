import type {
  DailyHealthSummary,
  RecoveryAssessment,
  RecoveryAssessmentBand,
  RecoveryBaselineMetric,
  RecoverySignalComparison,
  RecoverySignalStatus,
} from "./healthTypes";

const MINIMUM_BASELINE_DAYS = 7;
const MAXIMUM_BASELINE_DAYS = 28;

type MetricDefinition = {
  key: RecoveryBaselineMetric;
  label: string;
  unit: RecoverySignalComparison["unit"];
  cautionDelta: number;
  concernDelta: number;
  positiveDelta: number;
  lowerIsBetter: boolean;
};

const metrics: MetricDefinition[] = [
  {
    key: "sleepMinutes",
    label: "Sleep",
    unit: "min",
    cautionDelta: -10,
    concernDelta: -20,
    positiveDelta: 8,
    lowerIsBetter: false,
  },
  {
    key: "restingHeartRateBpm",
    label: "Resting heart rate",
    unit: "bpm",
    cautionDelta: 5,
    concernDelta: 10,
    positiveDelta: -5,
    lowerIsBetter: true,
  },
  {
    key: "heartRateVariabilityMs",
    label: "HRV",
    unit: "ms",
    cautionDelta: -10,
    concernDelta: -20,
    positiveDelta: 10,
    lowerIsBetter: false,
  },
];

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function statusForDelta(
  definition: MetricDefinition,
  deltaPercentage: number,
): RecoverySignalStatus {
  if (definition.lowerIsBetter) {
    if (deltaPercentage >= definition.concernDelta) return "concern";
    if (deltaPercentage >= definition.cautionDelta) return "caution";
    if (deltaPercentage <= definition.positiveDelta) return "positive";
    return "within_range";
  }

  if (deltaPercentage <= definition.concernDelta) return "concern";
  if (deltaPercentage <= definition.cautionDelta) return "caution";
  if (deltaPercentage >= definition.positiveDelta) return "positive";
  return "within_range";
}

function comparisonSummary(
  label: string,
  deltaPercentage: number | null,
  status: RecoverySignalStatus,
): string {
  if (status === "insufficient_data") {
    return `Keep wearing your device to establish a ${label.toLowerCase()} baseline.`;
  }

  const magnitude = Math.abs(Math.round(deltaPercentage ?? 0));
  const direction = (deltaPercentage ?? 0) >= 0 ? "above" : "below";
  if (status === "within_range") return `${label} is close to your normal range.`;
  return `${label} is ${magnitude}% ${direction} your baseline.`;
}

function compareMetric(
  definition: MetricDefinition,
  today: DailyHealthSummary,
  history: DailyHealthSummary[],
): RecoverySignalComparison {
  const values = history
    .map((day) => day[definition.key])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const current = today[definition.key];

  if (
    values.length < MINIMUM_BASELINE_DAYS ||
    typeof current !== "number" ||
    !Number.isFinite(current)
  ) {
    return {
      baseline: values.length ? round(average(values)) : null,
      current: typeof current === "number" ? current : null,
      deltaPercentage: null,
      label: definition.label,
      metric: definition.key,
      observationDays: values.length,
      status: "insufficient_data",
      summary: comparisonSummary(definition.label, null, "insufficient_data"),
      unit: definition.unit,
    };
  }

  const baseline = average(values);
  if (baseline <= 0) {
    return {
      baseline: round(baseline),
      current: round(current),
      deltaPercentage: null,
      label: definition.label,
      metric: definition.key,
      observationDays: values.length,
      status: "insufficient_data",
      summary: comparisonSummary(definition.label, null, "insufficient_data"),
      unit: definition.unit,
    };
  }
  const deltaPercentage = round(((current - baseline) / baseline) * 100);
  const status = statusForDelta(definition, deltaPercentage);

  return {
    baseline: round(baseline),
    current: round(current),
    deltaPercentage,
    label: definition.label,
    metric: definition.key,
    observationDays: values.length,
    status,
    summary: comparisonSummary(definition.label, deltaPercentage, status),
    unit: definition.unit,
  };
}

function assessmentCopy(
  band: RecoveryAssessmentBand,
  comparisons: RecoverySignalComparison[],
): Pick<RecoveryAssessment, "headline" | "explanation" | "recommendation"> {
  const notable = comparisons.filter(
    (comparison) => comparison.status === "concern" || comparison.status === "caution",
  );
  const explanation = notable.length
    ? notable.map((comparison) => comparison.summary).join(" ")
    : "Your available recovery signals are close to or better than your personal baseline.";

  if (band === "building_baseline") {
    return {
      headline: "Building your baseline",
      explanation: "Fortomnia needs at least seven recorded days for each signal before comparing today with your normal range.",
      recommendation: "Train from your planned session and use your warm-up plus how you feel to guide adjustments today.",
    };
  }
  if (band === "recover") {
    return {
      headline: "Recovery signals are strained",
      explanation,
      recommendation: "Consider recovery work or a meaningful reduction in load, volume, and conditioning intensity today.",
    };
  }
  if (band === "adjust") {
    return {
      headline: "Consider adjusting today",
      explanation,
      recommendation: "Keep the session flexible: extend your warm-up and hold progression unless performance confirms readiness.",
    };
  }
  return {
    headline: "Signals support your plan",
    explanation,
    recommendation: "Proceed with the planned session, while still using warm-up performance and symptoms as the final check.",
  };
}

export function assessRecoveryBaseline(
  today: DailyHealthSummary,
  previousDays: DailyHealthSummary[],
): RecoveryAssessment {
  const history = previousDays
    .filter((day) => day.date < today.date)
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, MAXIMUM_BASELINE_DAYS);
  const comparisons = metrics.map((definition) =>
    compareMetric(definition, today, history),
  );
  const usable = comparisons.filter(
    (comparison) => comparison.status !== "insufficient_data",
  );

  let band: RecoveryAssessmentBand = "ready";
  if (usable.length < 2) {
    band = "building_baseline";
  } else {
    const concerns = usable.filter((comparison) => comparison.status === "concern").length;
    const cautions = usable.filter((comparison) => comparison.status === "caution").length;
    if (concerns >= 2 || (concerns === 1 && cautions >= 1)) band = "recover";
    else if (concerns === 1 || cautions >= 2) band = "adjust";
  }

  return {
    baselineDays: Math.max(0, ...comparisons.map((comparison) => comparison.observationDays)),
    band,
    comparisons,
    ...assessmentCopy(band, comparisons),
  };
}

export const RECOVERY_BASELINE_WINDOW_DAYS = MAXIMUM_BASELINE_DAYS;
