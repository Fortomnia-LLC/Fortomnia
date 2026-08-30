import assert from "node:assert/strict";
import test from "node:test";

import {
  describePerformanceIntent,
  SPECIALTY_EVENT_SEEDS,
  shouldProgressHoldLoad,
} from "../src/lib/specialtyTraining.ts";

test("grip and strongman seeds use generalized performance primitives", () => {
  const hercules = SPECIALTY_EVENT_SEEDS.find((event) => event.slug === "strongman_hercules_hold");
  const conans = SPECIALTY_EVENT_SEEDS.find((event) => event.slug === "strongman_conans_wheel");
  const medley = SPECIALTY_EVENT_SEEDS.find((event) => event.slug === "grip_ten_challenge_medley");

  assert.deepEqual(hercules?.primitives, ["weight", "time"]);
  assert.deepEqual(conans?.primitives, ["weight", "distance", "time"]);
  assert.deepEqual(medley?.primitives, ["time", "completion"]);
});

test("hold-for-time intent describes duration-based performance", () => {
  assert.match(describePerformanceIntent("hold_for_time"), /duration range/);
});

test("hold progression increases load after exceeding target duration", () => {
  assert.equal(shouldProgressHoldLoad(20, 25, 35), "reduce");
  assert.equal(shouldProgressHoldLoad(30, 25, 35), "hold");
  assert.equal(shouldProgressHoldLoad(40, 25, 35), "increase");
});

test("strongman seeds preserve contest time caps and attempt limits", () => {
  const deadlift = SPECIALTY_EVENT_SEEDS.find((event) => event.slug === "strongman_max_deadlift");
  const sandbags = SPECIALTY_EVENT_SEEDS.find((event) => event.slug === "strongman_sandbag_series");

  assert.equal(deadlift?.timeCapSeconds, 60);
  assert.equal(deadlift?.maxAttempts, 3);
  assert.equal(sandbags?.timeCapSeconds, 75);
});
