import assert from "node:assert/strict";
import test from "node:test";

import {
  getCalorieTargetForDate,
  validateWeekdayCalorieTargets,
} from "../src/lib/calorieTargets.ts";

test("selects the calorie target for the viewed weekday", () => {
  const targets = [2100, 2200, 2300, 2400, 2500, 2600, 2700];

  assert.equal(
    getCalorieTargetForDate(2000, targets, "2026-08-23"),
    2100,
  );
  assert.equal(
    getCalorieTargetForDate(2000, targets, "2026-08-24"),
    2200,
  );
  assert.equal(
    getCalorieTargetForDate(2000, targets, "2026-08-29"),
    2700,
  );
});

test("falls back to the daily target without a complete weekly plan", () => {
  assert.equal(getCalorieTargetForDate(2000, [], "2026-08-23"), 2000);
});

test("validates all seven weekday calorie targets", () => {
  assert.equal(
    validateWeekdayCalorieTargets(
      [2000, 2100, 2200, 2300, 2400, 2500, 2600],
    ),
    true,
  );
  assert.equal(validateWeekdayCalorieTargets([2000]), false);
  assert.equal(
    validateWeekdayCalorieTargets(
      [2000, 2100, 2200, 2300, 2400, 2500, 10001],
    ),
    false,
  );
});
