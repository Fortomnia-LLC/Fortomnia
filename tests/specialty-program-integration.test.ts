import assert from "node:assert/strict";
import test from "node:test";

import { applySpecialtyProgramIntelligence } from "../src/lib/specialtyProgramIntegration.ts";

const exercises: any[] = [
  { id: "hercules", name: "Hercules Hold", is_archived: false },
  { id: "farmer", name: "Farmer Handle Hold", is_archived: false },
  { id: "dumbbell", name: "Heavy Dumbbell Hold", is_archived: false },
  { id: "zercher", name: "Zercher Carry", is_archived: false },
  { id: "squat", name: "Back Squat", is_archived: false },
];

const program: any[] = [{
  name: "Fortomnia Full Body A",
  explanation: "Base program.",
  exercises: [{ exerciseId: "squat", exerciseName: "Back Squat", explanation: "Base", performanceType: "reps", position: 1, repMin: 5, repMax: 8, targetRir: 2, targetSets: 3 }],
}];

test("Hercules goal uses dumbbell hold when specialty implements are unavailable", () => {
  const result = applySpecialtyProgramIntelligence(program, exercises as any, {
    primaryFocus: "Prepare for Hercules Hold",
    sports: ["strongman"],
    generalEquipment: ["dumbbell"],
    specialtyImplementSlugs: [],
  });
  assert.equal(result[0].exercises[0].exerciseName, "Heavy Dumbbell Hold");
  assert.equal(result[0].exercises[0].performanceType, "time");
  assert.equal(result[0].exercises[0].targetDurationSeconds, 30);
});

test("Hercules goal prefers direct apparatus when athlete has it", () => {
  const result = applySpecialtyProgramIntelligence(program, exercises as any, {
    targetEventName: "Hercules Hold",
    sports: ["strongman"],
    generalEquipment: ["full_gym"],
    specialtyImplementSlugs: ["hercules_hold_handles"],
  });
  assert.equal(result[0].exercises[0].exerciseName, "Hercules Hold");
});

test("Conan goal falls back to Zercher carry with barbell", () => {
  const result = applySpecialtyProgramIntelligence(program, exercises as any, {
    targetEventName: "Conan's Wheel",
    sports: ["strongman"],
    generalEquipment: ["barbell"],
    specialtyImplementSlugs: [],
  });
  assert.equal(result[0].exercises[0].exerciseName, "Zercher Carry");
  assert.equal(result[0].exercises[0].performanceType, "distance");
  assert.equal(result[0].exercises[0].targetMetricValue, 50);
});
