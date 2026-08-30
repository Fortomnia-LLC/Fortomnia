import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeFoodBarcode,
  parseOpenFoodFactsProduct,
} from "../src/lib/foodBarcode.ts";

test("normalizes supported food barcodes", () => {
  assert.equal(normalizeFoodBarcode("0 12345-67890 5"), "012345678905");
  assert.throws(() => normalizeFoodBarcode("123"), /8 to 14 digits/);
});

test("uses nutrition values supplied for one serving", () => {
  const food = parseOpenFoodFactsProduct("012345678905", {
    product: {
      nutriments: {
        carbohydrates_serving: 22.25,
        "energy-kcal_serving": 210.4,
        fat_serving: 8,
        fiber_serving: 3.25,
        proteins_serving: 12.5,
      },
      product_name: "Test Bar",
      serving_size: "1 bar (50 g)",
    },
    status: 1,
  });

  assert.deepEqual(food, {
    barcode: "012345678905",
    calories: 210,
    carbsGrams: 22.3,
    fatGrams: 8,
    fiberGrams: 3.3,
    name: "Test Bar",
    proteinGrams: 12.5,
    serving: "1 bar (50 g)",
  });
});

test("scales per-100g nutrition to the serving quantity", () => {
  const food = parseOpenFoodFactsProduct("12345678", {
    product: {
      nutriments: {
        carbohydrates_100g: 40,
        "energy-kcal_100g": 300,
        fat_100g: 10,
        fiber_100g: 6,
        proteins_100g: 20,
      },
      product_name: "Test Food",
      serving_quantity: 30,
    },
    status: 1,
  });

  assert.equal(food?.calories, 90);
  assert.equal(food?.proteinGrams, 6);
  assert.equal(food?.serving, "30 g");
});

test("returns no result for missing products", () => {
  assert.equal(
    parseOpenFoodFactsProduct("12345678", { status: 0 }),
    null,
  );
});
