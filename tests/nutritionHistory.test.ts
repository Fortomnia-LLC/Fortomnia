import assert from "node:assert/strict";
import test from "node:test";

import { buildRememberedFoods } from "../src/lib/nutritionHistory.ts";

test("keeps the most recent facts for the same food and serving", () => {
  const foods = buildRememberedFoods([
    {
      calories: 220,
      carbs_g: "10",
      fat_g: "4",
      fiber_g: "2",
      food_name: "Greek Yogurt",
      protein_g: "25",
      serving_description: "1 cup",
    },
    {
      calories: 180,
      carbs_g: "8",
      fat_g: "2",
      fiber_g: "1",
      food_name: " greek   yogurt ",
      protein_g: "20",
      serving_description: " 1  cup ",
    },
  ]);

  assert.equal(foods.length, 1);
  assert.deepEqual(foods[0], {
    calories: 220,
    carbs_g: 10,
    fat_g: 4,
    fiber_g: 2,
    food_name: "Greek Yogurt",
    protein_g: 25,
    serving_description: "1 cup",
  });
});

test("remembers different serving sizes separately", () => {
  const foods = buildRememberedFoods([
    {
      calories: 220,
      carbs_g: 10,
      fat_g: 4,
      fiber_g: 2,
      food_name: "Greek Yogurt",
      protein_g: 25,
      serving_description: "1 cup",
    },
    {
      calories: 110,
      carbs_g: 5,
      fat_g: 2,
      fiber_g: 1,
      food_name: "Greek Yogurt",
      protein_g: 12.5,
      serving_description: "1/2 cup",
    },
  ]);

  assert.equal(foods.length, 2);
});

test("respects the requested limit", () => {
  const foods = buildRememberedFoods(
    Array.from({ length: 5 }, (_, index) => ({
      calories: index,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      food_name: `Food ${index}`,
      protein_g: 0,
      serving_description: null,
    })),
    3,
  );

  assert.equal(foods.length, 3);
});
