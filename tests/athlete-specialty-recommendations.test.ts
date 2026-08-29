import assert from "node:assert/strict";
import test from "node:test";

import {
  CONANS_WHEEL_OPTIONS,
  HERCULES_HOLD_OPTIONS,
  recommendExerciseForAthlete,
} from "../src/lib/athleteSpecialtyRecommendations.ts";

test("Hercules apparatus produces direct event practice", () => {
  const result = recommendExerciseForAthlete(HERCULES_HOLD_OPTIONS, {
    generalEquipment: ["dumbbell"],
    specialtyImplementSlugs: ["hercules_hold_handles"],
  });

  assert.equal(result?.exerciseName, "Hercules Hold");
  assert.equal(result?.specificity, 100);
});

test("farmer handles replace unavailable Hercules apparatus", () => {
  const result = recommendExerciseForAthlete(HERCULES_HOLD_OPTIONS, {
    generalEquipment: ["dumbbell"],
    specialtyImplementSlugs: ["farmer_handles"],
  });

  assert.equal(result?.exerciseName, "Farmer Handle Hold");
});

test("dumbbells provide a commercial-gym Hercules fallback", () => {
  const result = recommendExerciseForAthlete(HERCULES_HOLD_OPTIONS, {
    generalEquipment: ["dumbbell"],
    specialtyImplementSlugs: [],
  });

  assert.equal(result?.exerciseName, "Heavy Dumbbell Hold");
});

test("full gym satisfies general equipment but does not invent specialty implements", () => {
  const result = recommendExerciseForAthlete(HERCULES_HOLD_OPTIONS, {
    generalEquipment: ["full_gym"],
    specialtyImplementSlugs: [],
  });

  assert.equal(result?.exerciseName, "Heavy Dumbbell Hold");
});

test("Conan's Wheel falls back to Zercher carry with a barbell", () => {
  const result = recommendExerciseForAthlete(CONANS_WHEEL_OPTIONS, {
    generalEquipment: ["barbell"],
    specialtyImplementSlugs: [],
  });

  assert.equal(result?.exerciseName, "Zercher Carry");
  assert.equal(result?.specificity, 70);
});
