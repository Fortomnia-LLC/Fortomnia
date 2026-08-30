import assert from "node:assert/strict";
import test from "node:test";

import { getPerMealTargets } from "../src/lib/mealTargets.ts";

test("distributes daily calorie and macro goals across meals", () => {
  assert.deepEqual(
    getPerMealTargets(
      {
        calorie_target: 2400,
        carbs_target_g: 300,
        fat_target_g: 80,
        fiber_target_g: 30,
        protein_target_g: 180,
      },
      4,
    ),
    {
      calories: 600,
      carbsGrams: 75,
      fatGrams: 20,
      fiberGrams: 7.5,
      proteinGrams: 45,
    },
  );
});

test("rejects meal counts outside supported limits", () => {
  const goals = {
    calorie_target: 2000,
    carbs_target_g: 200,
    fat_target_g: 70,
    fiber_target_g: 25,
    protein_target_g: 150,
  };

  assert.throws(() => getPerMealTargets(goals, 0), /Meals per day/);
  assert.throws(() => getPerMealTargets(goals, 9), /Meals per day/);
});
