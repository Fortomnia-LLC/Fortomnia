import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultMetricUnit,
  formatMetricValue,
} from "../src/lib/performanceMetrics.ts";

test("chooses safe default units for new metrics", () => {
  assert.equal(defaultMetricUnit("distance"), "meters");
  assert.equal(defaultMetricUnit("calories"), "calories");
  assert.equal(defaultMetricUnit("rounds"), "rounds");
  assert.equal(defaultMetricUnit("reps"), null);
});

test("formats distance, calorie, and round performance", () => {
  assert.equal(formatMetricValue("distance", 500, "meters"), "500 m");
  assert.equal(formatMetricValue("distance", 3.1, "miles"), "3.1 mi");
  assert.equal(formatMetricValue("calories", 20, "calories"), "20 cal");
  assert.equal(formatMetricValue("rounds", 5, "rounds"), "5 rounds");
});
