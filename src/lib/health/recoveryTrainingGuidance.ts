import type { GeneratedTemplate, ProgramExercise } from "../programGenerator";
import type { RecoveryAssessment } from "./healthTypes";

export type RecoveryTrainingAction = "keep_plan" | "reduce_load" | "recovery_focus" | "no_adjustment";

export type RecoveryTrainingAdjustment = {
  action: RecoveryTrainingAction;
  headline: string;
  explanation: string;
  setReduction: number;
  rirIncrease: number;
  targetScale: number;
  shouldProgress: boolean;
};

export function getRecoveryTrainingAdjustment(
  assessment: RecoveryAssessment,
): RecoveryTrainingAdjustment {
  if (assessment.band === "building_baseline") {
    return {
      action: "no_adjustment",
      headline: "Keep the plan flexible",
      explanation: "Fortomnia is still learning your normal recovery range, so wearable data will not change today's prescription yet.",
      setReduction: 0,
      rirIncrease: 0,
      targetScale: 1,
      shouldProgress: false,
    };
  }

  if (assessment.band === "recover") {
    return {
      action: "recovery_focus",
      headline: "Use a recovery-focused version",
      explanation: "Multiple recovery signals are strained. Fortomnia can reduce volume and effort while preserving the session's movement patterns.",
      setReduction: 2,
      rirIncrease: 2,
      targetScale: 0.75,
      shouldProgress: false,
    };
  }

  if (assessment.band === "adjust") {
    return {
      action: "reduce_load",
      headline: "Consider a lighter training day",
      explanation: "One or more recovery signals are outside your normal range. Fortomnia can trim volume and keep more reps in reserve without replacing the workout.",
      setReduction: 1,
      rirIncrease: 1,
      targetScale: 0.9,
      shouldProgress: false,
    };
  }

  return {
    action: "keep_plan",
    headline: "Train as planned",
    explanation: "Your available recovery signals support the planned session. Normal progression remains available if warm-up performance agrees.",
    setReduction: 0,
    rirIncrease: 0,
    targetScale: 1,
    shouldProgress: true,
  };
}

function adjustedExercise(
  exercise: ProgramExercise,
  adjustment: RecoveryTrainingAdjustment,
): ProgramExercise {
  if (adjustment.action === "keep_plan" || adjustment.action === "no_adjustment") {
    return exercise;
  }

  const isRepBased = !exercise.performanceType || exercise.performanceType === "reps";
  const targetSets = Math.max(1, exercise.targetSets - adjustment.setReduction);

  return {
    ...exercise,
    explanation: `${exercise.explanation} Recovery adjustment: ${adjustment.headline}.`,
    targetSets,
    targetRir: isRepBased ? Math.min(5, exercise.targetRir + adjustment.rirIncrease) : exercise.targetRir,
    targetDurationSeconds:
      exercise.performanceType === "time" && exercise.targetDurationSeconds != null
        ? Math.max(5, Math.round(exercise.targetDurationSeconds * adjustment.targetScale))
        : exercise.targetDurationSeconds,
    targetMetricValue:
      exercise.performanceType === "distance" && exercise.targetMetricValue != null
        ? Math.max(1, Math.round(exercise.targetMetricValue * adjustment.targetScale))
        : exercise.targetMetricValue,
  };
}

export function applyRecoveryToTemplate(
  template: GeneratedTemplate,
  assessment: RecoveryAssessment,
): GeneratedTemplate {
  const adjustment = getRecoveryTrainingAdjustment(assessment);
  if (adjustment.action === "keep_plan" || adjustment.action === "no_adjustment") return template;

  return {
    ...template,
    explanation: `${template.explanation} ${adjustment.explanation}`,
    exercises: template.exercises.map((exercise) => adjustedExercise(exercise, adjustment)),
  };
}
