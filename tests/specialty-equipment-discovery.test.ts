import assert from "node:assert/strict";
import test from "node:test";

import {
  getRelevantSpecialtyEquipment,
  inferRelevantSpecialtySports,
} from "../src/lib/specialtyEquipmentDiscovery.ts";

test("ordinary bodybuilding profile does not surface specialty equipment", () => {
  assert.deepEqual(getRelevantSpecialtyEquipment(["bodybuilding"], "Build muscle"), []);
});

test("strongman profile surfaces strongman equipment", () => {
  const options = getRelevantSpecialtyEquipment(["Strongman"], "Get stronger");
  assert.ok(options.some((option) => option.slug === "strongman_log"));
  assert.ok(options.some((option) => option.slug === "farmer_handles"));
  assert.ok(!options.some((option) => option.slug === "pinch_block"));
});

test("grip goal surfaces grip implements without requiring a named sport", () => {
  const options = getRelevantSpecialtyEquipment([], "Improve grip strength");
  assert.ok(options.some((option) => option.slug === "pinch_block"));
  assert.ok(options.some((option) => option.slug === "thumb_blaster_2in"));
});

test("Hercules event can surface both strongman and grip contexts", () => {
  const sports = inferRelevantSpecialtySports([], "", "Nightmare Hercules Hold grip contest");
  assert.ok(sports.includes("strongman"));
  assert.ok(sports.includes("grip_sport"));
});
