import assert from "node:assert/strict";
import test from "node:test";

import { buildMealProgress } from "../src/lib/mealProgress.ts";

test("groups nutrition totals into numbered meals", () => {
  const progress = buildMealProgress(
    [
      {
        calories: 300,
        carbs_g: 30,
        fat_g: 10,
        meal_number: 1,
        meal_type: "snack",
        protein_g: 25,
      },
      {
        calories: 200,
        carbs_g: 20,
        fat_g: 5,
        meal_number: 1,
        meal_type: "snack",
        protein_g: 15,
      },
      {
        calories: 600,
        carbs_g: 70,
        fat_g: 20,
        meal_number: 3,
        meal_type: "snack",
        protein_g: 40,
      },
    ],
    3,
  );

  assert.deepEqual(progress, [
    {
      calories: 500,
      carbsGrams: 50,
      fatGrams: 15,
      mealNumber: 1,
      proteinGrams: 40,
    },
    {
      calories: 0,
      carbsGrams: 0,
      fatGrams: 0,
      mealNumber: 2,
      proteinGrams: 0,
    },
    {
      calories: 600,
      carbsGrams: 70,
      fatGrams: 20,
      mealNumber: 3,
      proteinGrams: 40,
    },
  ]);
});

test("maps legacy meal labels into numbered meals", () => {
  const progress = buildMealProgress(
    [
      {
        calories: 450,
        carbs_g: 40,
        fat_g: 15,
        meal_number: null,
        meal_type: "lunch",
        protein_g: 35,
      },
    ],
    3,
  );

  assert.equal(progress[1].calories, 450);
});
