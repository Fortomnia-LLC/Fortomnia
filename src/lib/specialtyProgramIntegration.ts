import type { Exercise } from "../hooks/useExercises";
import type { EquipmentOption } from "./equipment.ts";
import type { GeneratedTemplate, ProgramExercise } from "./programGenerator.ts";
import {
  CONANS_WHEEL_OPTIONS,
  HERCULES_HOLD_OPTIONS,
  recommendExerciseForAthlete,
  type EventExerciseOption,
} from "./athleteSpecialtyRecommendations.ts";

export type SpecialtyProgramContext = {
  primaryFocus?: string | null;
  sports?: string[] | null;
  targetEventName?: string | null;
  generalEquipment: EquipmentOption[];
  specialtyImplementSlugs: string[];
};

type SpecialtyProgramRule = {
  matches: (haystack: string) => boolean;
  options: EventExerciseOption[];
  label: string;
  performanceType: ProgramExercise["performanceType"];
  targetDurationSeconds?: number | null;
  targetMetricUnit?: ProgramExercise["targetMetricUnit"];
  targetMetricValue?: number | null;
  repMin?: number;
  repMax?: number;
};

const RULES: SpecialtyProgramRule[] = [
  {
    matches: (value) => /hercules/.test(value),
    options: HERCULES_HOLD_OPTIONS,
    label: "Hercules Hold preparation",
    performanceType: "time",
    targetDurationSeconds: 30,
    repMin: 0,
    repMax: 0,
  },
  {
    matches: (value) => /conan/.test(value),
    options: CONANS_WHEEL_OPTIONS,
    label: "Conan's Wheel preparation",
    performanceType: "distance",
    targetMetricUnit: "yards",
    targetMetricValue: 50,
    repMin: 0,
    repMax: 0,
  },
];

function contextText(context: SpecialtyProgramContext): string {
  return [context.primaryFocus ?? "", context.targetEventName ?? "", ...(context.sports ?? [])]
    .join(" ")
    .toLowerCase();
}

export function applySpecialtyProgramIntelligence(
  program: GeneratedTemplate[],
  exercises: Exercise[],
  context: SpecialtyProgramContext,
): GeneratedTemplate[] {
  const haystack = contextText(context);
  const rule = RULES.find((item) => item.matches(haystack));
  if (!rule || program.length === 0) return program;

  const recommendation = recommendExerciseForAthlete(rule.options, {
    generalEquipment: context.generalEquipment,
    specialtyImplementSlugs: context.specialtyImplementSlugs,
  });
  if (!recommendation) return program;

  const exercise = exercises.find((item) => item.name.toLowerCase() === recommendation.exerciseName.toLowerCase());
  if (!exercise || exercise.is_archived) return program;

  const first = program[0];
  const remaining = first.exercises.filter((item) => item.exerciseId !== exercise.id);
  const target: ProgramExercise = {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    explanation: `${rule.label}: ${recommendation.reason}${recommendation.notes ? ` ${recommendation.notes}` : ""}`,
    performanceType: rule.performanceType,
    position: 1,
    repMax: rule.repMax ?? 0,
    repMin: rule.repMin ?? 0,
    targetDurationSeconds: rule.targetDurationSeconds ?? null,
    targetMetricUnit: rule.targetMetricUnit ?? null,
    targetMetricValue: rule.targetMetricValue ?? null,
    targetRir: 2,
    targetSets: 3,
  };

  return [
    {
      ...first,
      explanation: `${first.explanation} Fortomnia added ${exercise.name} because it is the best available match for your specialty goal and equipment.`,
      exercises: [target, ...remaining].map((item, index) => ({ ...item, position: index + 1 })),
    },
    ...program.slice(1),
  ];
}
