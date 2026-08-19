import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_PROGRESSION_RULES,
  getRepsFirstSuggestion,
} from "../src/lib/progression.ts";

test("adds a rep when performance meets the default RIR rule", () => {
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

test("uses the default weight increase at the top of a rep range", () => {
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
  assert.match(suggestion.explanation, /5 lb/);
});

test("applies an athlete's custom RIR threshold and weight increments", () => {
  const rules = {
    minimumRepsInReserve: 3,
    weightIncrease: { kg: 1.25, lb: 2.5 },
  };

  const hold = getRepsFirstSuggestion(
    {
      repMax: 10,
      repMin: 6,
      reps: 10,
      repsInReserve: 2,
      weight: 80,
      weightUnit: "kg",
    },
    rules,
  );
  const progress = getRepsFirstSuggestion(
    {
      repMax: 10,
      repMin: 6,
      reps: 10,
      repsInReserve: 3,
      weight: 80,
      weightUnit: "kg",
    },
    rules,
  );

  assert.equal(hold.weight, 80);
  assert.equal(progress.weight, 81.25);
  assert.match(progress.explanation, /3 reps in reserve/);
  assert.match(progress.explanation, /1.25 kg/);
});

test("rejects invalid athlete progression rules", () => {
  assert.throws(
    () =>
      getRepsFirstSuggestion(
        {
          reps: 8,
          repsInReserve: 2,
          weight: 100,
          weightUnit: "lb",
        },
        {
          ...DEFAULT_PROGRESSION_RULES,
          minimumRepsInReserve: -1,
        },
      ),
    /minimumRepsInReserve/,
  );
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
