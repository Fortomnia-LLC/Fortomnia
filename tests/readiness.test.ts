import assert from "node:assert/strict";
import test from "node:test";

import { calculateReadiness } from "../src/lib/readiness.ts";

test("minimum recovery signals produce a zero Recover score", () => {
  const result = calculateReadiness({
    energyLevel: 1,
    mood: 1,
    muscleSoreness: 5,
    sleepDurationMinutes: 0,
    sleepQuality: 1,
    stressLevel: 5,
  });

  assert.equal(result.score, 0);
  assert.equal(result.band, "recover");
  assert.equal(result.factors.length, 6);
});

test("moderate recovery signals produce a Maintain score", () => {
  const result = calculateReadiness({
    energyLevel: 3,
    mood: 3,
    muscleSoreness: 3,
    sleepDurationMinutes: 360,
    sleepQuality: 3,
    stressLevel: 3,
  });

  assert.equal(result.score, 55);
  assert.equal(result.band, "maintain");
});

test("maximum recovery signals produce High readiness", () => {
  const result = calculateReadiness({
    energyLevel: 5,
    mood: 5,
    muscleSoreness: 1,
    sleepDurationMinutes: 480,
    sleepQuality: 5,
    stressLevel: 1,
  });

  assert.equal(result.score, 100);
  assert.equal(result.band, "high_readiness");
  assert.equal(
    result.factors.reduce((total, factor) => total + factor.weight, 0),
    1,
  );
});

test("readiness band boundaries remain stable", () => {
  const base = {
    energyLevel: 1,
    mood: 1,
    muscleSoreness: 5,
    sleepDurationMinutes: 0,
    sleepQuality: 1,
    stressLevel: 5,
  };

  assert.equal(
    calculateReadiness({ ...base, sleepDurationMinutes: 960 }).score,
    20,
  );
  assert.equal(
    calculateReadiness({
      ...base,
      energyLevel: 5,
      sleepDurationMinutes: 960,
    }).band,
    "maintain",
  );
});
