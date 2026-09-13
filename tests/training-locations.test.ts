import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { normalizeLocationEquipment, validateTrainingLocation } from "../src/lib/trainingLocations.ts";

test("normalizes location equipment without unsupported or duplicate values", () => {
  assert.deepEqual(normalizeLocationEquipment(["dumbbell", "unknown", "dumbbell", "cardio"]), ["dumbbell", "cardio"]);
});

test("requires a named location with usable equipment", () => {
  assert.equal(validateTrainingLocation({ name: " ", notes: "", equipment: ["bodyweight"] }), "Location name is required.");
  assert.equal(validateTrainingLocation({ name: "Hotel", notes: "", equipment: [] }), "Choose at least one available equipment option.");
  assert.equal(validateTrainingLocation({ name: "Hotel", notes: "Travel setup", equipment: ["bodyweight"] }), null);
});

test("migration exposes only ownership-protected location access", () => {
  const sql = readFileSync("supabase/migrations/20260913224721_add_training_locations.sql", "utf8").toLowerCase();
  assert.match(sql, /grant select, insert, update, delete on table public\.training_locations to authenticated/);
  assert.match(sql, /create unique index training_locations_one_active_idx/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /revoke all on function public\.set_active_training_location\(uuid\) from public/);
  assert.match(sql, /equipment <@ array\[/);
});
