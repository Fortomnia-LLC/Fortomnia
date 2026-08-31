import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRecoveryToTemplate,
  getRecoveryTrainingAdjustment,
} from "../src/lib/health/recoveryTrainingGuidance.ts";
import type { RecoveryAssessment } from "../src/lib/health/healthTypes.ts";
import type { GeneratedTemplate } from "../src/lib/programGenerator.ts";

function assessment(band: RecoveryAssessment["band"]): RecoveryAssessment {
  return {
    band,
    baselineDays: band === "building_baseline" ? 4 : 14,
    comparisons: [],
    headline: "Test",
    explanation: "Test explanation",
    recommendation: "Test recommendation",
  };
}

const template: GeneratedTemplate = {
  name: "Test Day",
  explanation: "Base session.",
  exercises: [
    {
      exerciseId: "bench",
      exerciseName: "Bench Press",
      explanation: "Primary press.",
      performanceType: "reps",
      position: 1,
      repMin: 5,
      repMax: 8,
      targetRir: 2,
      targetSets: 4,
      targetDurationSeconds: null,
      targetMetricUnit: null,
      targetMetricValue: null,
    },
    {
      exerciseId: "hold",
      exerciseName: "Hercules Hold",
      explanation: "Grip endurance.",
      performanceType: "time",
      position: 2,
      repMin: 0,
      repMax: 0,
      targetRir: 2,
      targetSets: 3,
      targetDurationSeconds: 40,
      targetMetricUnit: null,
      targetMetricValue: null,
    },
    {
      exerciseId: "carry",
      exerciseName: "Zercher Carry",
      explanation: "Carry strength.",
      performanceType: "distance",
      position: 3,
      repMin: 0,
      repMax: 0,
      targetRir: 2,
      targetSets: 3,
      targetDurationSeconds: null,
      targetMetricUnit: "yards",
      targetMetricValue: 60,
    },
  ],
};

test("ready recovery preserves the planned workout", () => {
  const result = applyRecoveryToTemplate(template, assessment("ready"));
  assert.deepEqual(result, template);
  assert.equal(getRecoveryTrainingAdjustment(assessment("ready")).shouldProgress, true);
});

test("building baseline does not alter the workout", () => {
  const result = applyRecoveryToTemplate(template, assessment("building_baseline"));
  assert.deepEqual(result, template);
  assert.equal(getRecoveryTrainingAdjustment(assessment("building_baseline")).action, "no_adjustment");
});

test("adjust band trims one set and increases RIR for rep work", () => {
  const result = applyRecoveryToTemplate(template, assessment("adjust"));
  assert.equal(result.exercises[0].targetSets, 3);
  assert.equal(result.exercises[0].targetRir, 3);
  assert.equal(result.exercises[1].targetDurationSeconds, 36);
  assert.equal(result.exercises[2].targetMetricValue, 54);
});

test("recover band meaningfully reduces volume and specialty targets", () => {
  const result = applyRecoveryToTemplate(template, assessment("recover"));
  assert.equal(result.exercises[0].targetSets, 2);
  assert.equal(result.exercises[0].targetRir, 4);
  assert.equal(result.exercises[1].targetSets, 1);
  assert.equal(result.exercises[1].targetDurationSeconds, 30);
  assert.equal(result.exercises[2].targetSets, 1);
  assert.equal(result.exercises[2].targetMetricValue, 45);
});

test("recovery adjustment never reduces an exercise below one set", () => {
  const oneSetTemplate: GeneratedTemplate = {
    ...template,
    exercises: [{ ...template.exercises[0], targetSets: 1 }],
  };
  const result = applyRecoveryToTemplate(oneSetTemplate, assessment("recover"));
  assert.equal(result.exercises[0].targetSets, 1);
});
