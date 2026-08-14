import assert from "node:assert/strict";
import test from "node:test";

import { getRepsFirstSuggestion } from "../src/lib/progression.ts";

test("adds a rep when performance has at least two RIR", () => {
  const suggestion = getRepsFirstSuggestion({
    repMax: 12,
    repMin: 8,
    reps: 10,
    repsInReserve: 2,
    weight: 100,
    weightUnit: "lb",
  });

  assert.equal(suggestion.reps, 11);
  assert.equal(suggestion.weight, 100);
});

test("adds five pounds at the top of a rep range", () => {
  const suggestion = getRepsFirstSuggestion({
    repMax: 12,
    repMin: 8,
    reps: 12,
    repsInReserve: 2,
    weight: 100,
    weightUnit: "lb",
  });

  assert.equal(suggestion.reps, 8);
  assert.equal(suggestion.weight, 105);
});

test("adds 2.5 kilograms at the top of a rep range", () => {
  const suggestion = getRepsFirstSuggestion({
    repMax: 10,
    repMin: 6,
    reps: 10,
    repsInReserve: 3,
    weight: 80,
    weightUnit: "kg",
  });

  assert.equal(suggestion.reps, 6);
  assert.equal(suggestion.weight, 82.5);
});

test("holds performance when RIR is low or missing", () => {
  for (const repsInReserve of [1, null]) {
    const suggestion = getRepsFirstSuggestion({
      repMax: 12,
      repMin: 8,
      reps: 10,
      repsInReserve,
      weight: 100,
      weightUnit: "lb",
    });

    assert.equal(suggestion.reps, 10);
    assert.equal(suggestion.weight, 100);
  }
});
