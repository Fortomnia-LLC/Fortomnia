import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCoachPlanPreview,
  parseCommaSeparated,
  type CoachQuestionnaire,
} from "../src/lib/coachQuestionnaire.ts";

const baseQuestionnaire: CoachQuestionnaire = {
  cardioFocus: "",
  mobilityFocus: "",
  nutritionFocus: "",
  preferredCardio: [],
  primaryFocus: "Grip strength",
  priorityMetricCurrent: 135,
  priorityMetricName: "Grip dynamometer",
  priorityMetricTarget: 175,
  priorityMetricUnit: "lb",
  sessionMinutes: 75,
  sports: ["Powerlifting"],
  targetEventDate: "2026-12-15",
  targetEventName: "Winter strength test",
  trainingLocationDetails: "Commercial gym and home grippers",
  trainingLocations: ["commercial_gym", "home_gym"],
  weeklyTrainingDays: 4,
};

test("normalizes comma-separated questionnaire values", () => {
  assert.deepEqual(
    parseCommaSeparated(" Running, cycling, running, Rowing "),
    ["Running", "cycling", "Rowing"],
  );
});

test("limits questionnaire lists", () => {
  const values = Array.from({ length: 20 }, (_, index) => `Item ${index + 1}`);
  assert.equal(parseCommaSeparated(values.join(","), 5).length, 5);
});

test("plan preview preserves a custom measurable performance goal", () => {
  const preview = buildCoachPlanPreview(baseQuestionnaire);

  assert.match(preview.training, /Grip strength/);
  assert.match(preview.training, /Grip dynamometer/);
  assert.match(preview.training, /175 lb/);
  assert.match(preview.training, /Winter strength test/);
  assert.match(preview.training, /2026-12-15/);
  assert.match(preview.training, /4 training days per week/);
});

test("plan preview covers nutrition cardio and mobility", () => {
  const preview = buildCoachPlanPreview({
    ...baseQuestionnaire,
    cardioFocus: "Improve aerobic base without hurting recovery",
    mobilityFocus: "Improve ankle dorsiflexion for squats",
    nutritionFocus: "Support strength while maintaining bodyweight",
  });

  assert.match(preview.nutrition, /maintaining bodyweight/);
  assert.match(preview.cardio, /aerobic base/);
  assert.match(preview.mobility, /ankle dorsiflexion/);
});
