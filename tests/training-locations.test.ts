import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { normalizeLocationEquipment, replacementLocationId, validateTrainingLocation, type TrainingLocation } from "../src/lib/trainingLocations.ts";

test("normalizes location equipment without unsupported or duplicate values", () => {
  assert.deepEqual(normalizeLocationEquipment(["dumbbell", "unknown", "dumbbell", "cardio"]), ["dumbbell", "cardio"]);
});

test("requires a named location with usable equipment", () => {
  assert.equal(validateTrainingLocation({ name: " ", notes: "", equipment: ["bodyweight"] }), "Location name is required.");
  assert.equal(validateTrainingLocation({ name: "Hotel", notes: "", equipment: [] }), "Choose at least one available equipment option.");
  assert.equal(validateTrainingLocation({ name: "Hotel", notes: "Travel setup", equipment: ["bodyweight"] }), null);
});

test("deleting an active location chooses another saved location", () => {
  const locations = [
    { id: "active" },
    { id: "hotel" },
    { id: "home" },
  ] as TrainingLocation[];

  assert.equal(replacementLocationId(locations, "active"), "hotel");
  assert.equal(replacementLocationId([locations[0]], "active"), null);
});

test("location screen supports explicit edit, save, and cancel actions", () => {
  const screen = readFileSync("src/screens/TrainingLocationsScreen.tsx", "utf8");
  assert.match(screen, /Edit location/);
  assert.match(screen, /Save location changes/);
  assert.match(screen, /Cancel location editing/);
  assert.match(screen, /\.update\(\{/);
  assert.match(screen, /replacementLocationId/);
});

test("migration exposes only ownership-protected location access", () => {
  const sql = readFileSync("supabase/migrations/20260913224721_add_training_locations.sql", "utf8").toLowerCase();
  assert.match(sql, /grant select, insert, update, delete on table public\.training_locations to authenticated/);
  assert.match(sql, /create unique index training_locations_one_active_idx/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /revoke all on function public\.set_active_training_location\(uuid\) from public/);
  assert.match(sql, /equipment <@ array\[/);
});
