import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  availableTemplateExercises,
  nextTemplateExercisePosition,
} from "../src/lib/templateExercises.ts";

const exercises = [
  { id: "squat", name: "Squat" },
  { id: "bench", name: "Bench press" },
  { id: "row", name: "Row" },
];

test("new template choices exclude exercises already in the template", () => {
  assert.deepEqual(
    availableTemplateExercises(exercises, ["squat", "row"]),
    [{ id: "bench", name: "Bench press" }],
  );
});

test("editing keeps the current exercise available but excludes other duplicates", () => {
  assert.deepEqual(
    availableTemplateExercises(exercises, ["squat", "row"], "row"),
    [
      { id: "bench", name: "Bench press" },
      { id: "row", name: "Row" },
    ],
  );
});

test("new exercises append after the highest valid position", () => {
  assert.equal(nextTemplateExercisePosition([]), 1);
  assert.equal(nextTemplateExercisePosition([1, 4, 2]), 5);
  assert.equal(nextTemplateExercisePosition([null, -1, 0]), 1);
});

test("template editor exposes add, save, and cancel controls", () => {
  const templateScreen = readFileSync(
    "src/screens/WorkoutTemplateScreen.tsx",
    "utf8",
  );
  const addScreen = readFileSync(
    "src/screens/AddTemplateExerciseScreen.tsx",
    "utf8",
  );

  assert.match(templateScreen, /accessibilityLabel="Add exercise to template"/);
  assert.match(addScreen, /Add exercise to template/);
  assert.match(addScreen, /Cancel exercise changes/);
  assert.match(addScreen, /existingExerciseIds\.includes\(exerciseId\)/);
});
