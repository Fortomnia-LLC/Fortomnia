export type ReadinessBand =
  | "recover"
  | "maintain"
  | "ready"
  | "high_readiness";

export type ReadinessInput = {
  energyLevel: number;
  mood: number;
  muscleSoreness: number;
  sleepDurationMinutes: number;
  sleepQuality: number;
  stressLevel: number;
};

export type ReadinessFactor = {
  contribution: number;
  key: keyof ReadinessInput;
  label: string;
  score: number;
  weight: number;
};

export type ReadinessResult = {
  band: ReadinessBand;
  factors: ReadinessFactor[];
  label: string;
  recommendation: string;
  score: number;
};

type FactorDefinition = {
  key: keyof ReadinessInput;
  label: string;
  score: (value: number) => number;
  weight: number;
};

const factorDefinitions: FactorDefinition[] = [
  {
    key: "sleepDurationMinutes",
    label: "Sleep duration",
    score: (minutes) => clamp((minutes / 480) * 100, 0, 100),
    weight: 0.2,
  },
  {
    key: "sleepQuality",
    label: "Sleep quality",
    score: scoreFivePointScale,
    weight: 0.15,
  },
  {
    key: "energyLevel",
    label: "Energy",
    score: scoreFivePointScale,
    weight: 0.2,
  },
  {
    key: "muscleSoreness",
    label: "Muscle soreness",
    score: scoreInverseFivePointScale,
    weight: 0.2,
  },
  {
    key: "stressLevel",
    label: "Stress",
    score: scoreInverseFivePointScale,
    weight: 0.15,
  },
  {
    key: "mood",
    label: "Mood",
    score: scoreFivePointScale,
    weight: 0.1,
  },
];

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function scoreFivePointScale(value: number): number {
  return clamp(((value - 1) / 4) * 100, 0, 100);
}

function scoreInverseFivePointScale(value: number): number {
  return 100 - scoreFivePointScale(value);
}

function getBand(score: number): Omit<ReadinessResult, "factors" | "score"> {
  if (score < 40) {
    return {
      band: "recover",
      label: "Recover",
      recommendation:
        "Prioritize recovery and consider reducing training demand today.",
    };
  }

  if (score < 60) {
    return {
      band: "maintain",
      label: "Maintain",
      recommendation:
        "Hold training targets steady and reassess after your warm-up.",
    };
  }

  if (score < 80) {
    return {
      band: "ready",
      label: "Ready",
      recommendation:
        "Your recovery signals support completing the planned session.",
    };
  }

  return {
    band: "high_readiness",
    label: "High readiness",
    recommendation:
      "Recovery signals support planned progression if performance confirms it.",
  };
}

export function calculateReadiness(
  input: ReadinessInput,
): ReadinessResult {
  const factors = factorDefinitions.map((definition) => {
    const score = Math.round(definition.score(input[definition.key]));

    return {
      contribution: Number((score * definition.weight).toFixed(2)),
      key: definition.key,
      label: definition.label,
      score,
      weight: definition.weight,
    };
  });

  const score = Math.round(
    factors.reduce(
      (total, factor) => total + factor.contribution,
      0,
    ),
  );

  return {
    ...getBand(score),
    factors,
    score,
  };
}
