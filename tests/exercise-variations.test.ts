import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  defaultExerciseVariation,
  formatExerciseVariation,
  type ExerciseVariation,
} from "../src/lib/exerciseVariations.ts";

const variation = (overrides: Partial<ExerciseVariation> = {}): ExerciseVariation => ({
  aliases: [], attachment: "v-bar", execution_style: "standard",
  exercise_id: "lat-pulldown", grip: "neutral", id: "neutral-v-bar",
  is_default: false, laterality: "bilateral", name: "Narrow Neutral V-Bar",
  sort_order: 20, stance: "seated", ...overrides,
});

test("formats a variation without replacing the canonical exercise", () => {
  assert.equal(
    formatExerciseVariation("Lat Pulldown", variation()),
    "Lat Pulldown — Narrow Neutral V-Bar",
  );
  assert.equal(formatExerciseVariation("Lat Pulldown", null), "Lat Pulldown");
});

test("selects the explicit default and falls back to the first option", () => {
  const first = variation({ id: "first" });
  const preferred = variation({ id: "default", is_default: true });
  assert.equal(defaultExerciseVariation([first, preferred])?.id, "default");
  assert.equal(defaultExerciseVariation([first])?.id, "first");
  assert.equal(defaultExerciseVariation([]), null);
});

test("migration keeps variants normalized and bound to their parent exercise", () => {
  const sql = readFileSync(
    "supabase/migrations/20260915183000_add_exercise_variations.sql",
    "utf8",
  );
  assert.match(sql, /create table public\.exercise_variants/i);
  assert.match(sql, /foreign key \(exercise_variant_id, exercise_id\)/i);
  assert.match(sql, /where lower\(exercises\.name\) = 'lat pulldown'/i);
  assert.match(sql, /exercise_variant_id = \(p_set->>'exercise_variant_id'\)::uuid/i);
  assert.match(sql, /enable row level security/i);
});

test("bench press specialty bars extend the canonical exercise instead of duplicating it", () => {
  const sql = readFileSync(
    "supabase/migrations/20260917183000_seed_bench_press_variations.sql",
    "utf8",
  );

  assert.match(sql, /insert into public\.exercise_variants/i);
  assert.match(sql, /where lower\(exercises\.name\) = 'barbell bench press'/i);
  assert.match(sql, /'Bull Bar'/);
  assert.match(sql, /'Hurricane Bar'/);
  assert.match(sql, /'Buffalo Bar'/);
  assert.match(sql, /'Swiss \/ Football Bar'/);
  assert.match(sql, /'Bamboo \/ Earthquake Bar'/);
  assert.doesNotMatch(sql, /insert into public\.exercises/i);
});

test("seated cable row attachments extend the canonical exercise instead of duplicating it", () => {
  const sql = readFileSync(
    "supabase/migrations/20260917190000_seed_cable_row_variations.sql",
    "utf8",
  );

  assert.match(sql, /insert into public\.exercise_variants/i);
  assert.match(sql, /where lower\(exercises\.name\) = 'seated cable row'/i);
  assert.match(sql, /'Neutral V-Bar'/);
  assert.match(sql, /'Medium Neutral MAG-Style Grip'/);
  assert.match(sql, /'Wide Overhand Bar'/);
  assert.match(sql, /'Independent D-Handles'/);
  assert.match(sql, /'Single-Arm D-Handle'/);
  assert.doesNotMatch(sql, /insert into public\.exercises/i);
});

test("cable accessory attachments stay normalized under their canonical exercises", () => {
  const sql = readFileSync(
    "supabase/migrations/20260917200000_seed_cable_accessory_variations.sql",
    "utf8",
  );

  assert.match(sql, /insert into public\.exercise_variants/i);
  assert.match(sql, /'Triceps Pushdown', 'V-Bar'/);
  assert.match(sql, /'Triceps Pushdown', 'Single D-Handle'/);
  assert.match(sql, /'Overhead Cable Triceps Extension', 'Rope'/);
  assert.match(sql, /'Face Pull', 'Dual D-Handles'/);
  assert.match(sql, /'Cable Curl', 'Rope Hammer Grip'/);
  assert.doesNotMatch(sql, /insert into public\.exercises/i);
});

test("specialty bars extend canonical press and lower-body exercises", () => {
  const sql = readFileSync(
    "supabase/migrations/20260917203000_seed_specialty_bar_variations.sql",
    "utf8",
  );

  assert.match(sql, /insert into public\.exercise_variants/i);
  assert.match(sql, /'Overhead Press', 'Swiss \/ Football Bar'/);
  assert.match(sql, /'Overhead Press', 'Log'/);
  assert.match(sql, /'Back Squat', 'Safety Squat Bar'/);
  assert.match(sql, /'Back Squat', 'Buffalo Bar'/);
  assert.match(sql, /'Good Morning', 'Cambered Bar'/);
  assert.match(sql, /'Barbell Hip Thrust', 'Safety Squat Bar'/);
  assert.doesNotMatch(sql, /insert into public\.exercises/i);
});

test("row hinge and carry variations stay under canonical exercises", () => {
  const sql = readFileSync(
    "supabase/migrations/20260917210000_seed_row_hinge_carry_variations.sql",
    "utf8",
  );

  assert.match(sql, /'Barbell Row', 'Cambered Bar'/);
  assert.match(sql, /'Seal Row', 'Swiss \/ Football Bar'/);
  assert.match(sql, /'Deadlift', 'Deadlift Bar'/);
  assert.match(sql, /'Romanian Deadlift', 'Axle Bar'/);
  assert.match(sql, /'Farmer Carry', 'Farmer Handles'/);
  assert.match(sql, /'Farmer Carry', 'Suitcase Single-Arm'/);
  assert.doesNotMatch(sql, /insert into public\.exercises/i);
});

test("unilateral variants expand existing machine and dumbbell movements", () => {
  const sql = readFileSync(
    "supabase/migrations/20260917213000_seed_unilateral_variations.sql",
    "utf8",
  );

  assert.match(sql, /'Leg Press', 'Single-Leg'/);
  assert.match(sql, /'Leg Extension', 'Single-Leg'/);
  assert.match(sql, /'Lying Leg Curl', 'Single-Leg'/);
  assert.match(sql, /'Seated Leg Curl', 'Single-Leg'/);
  assert.match(sql, /'Standing Calf Raise', 'Single-Leg'/);
  assert.match(sql, /'Dumbbell Shoulder Press', 'Single-Arm Standing'/);
  assert.match(sql, /'Dumbbell Lateral Raise', 'Single-Arm Lean-Away'/);
  assert.doesNotMatch(sql, /insert into public\.exercises/i);
});

test("back machine and cable variations expand grips and unilateral options", () => {
  const sql = readFileSync(
    "supabase/migrations/20260917220000_seed_back_machine_cable_variations.sql",
    "utf8",
  );

  assert.match(sql, /'T-Bar Row', 'Wide Overhand Handle'/);
  assert.match(sql, /'Machine Row', 'Single-Arm Neutral'/);
  assert.match(sql, /'Straight-Arm Pulldown', 'Rope'/);
  assert.match(sql, /'Straight-Arm Pulldown', 'Single D-Handle'/);
  assert.match(sql, /'Cable Pullover', 'Single D-Handle'/);
  assert.doesNotMatch(sql, /insert into public\.exercises/i);
});

test("Olympic lifting seed covers competition lifts and common derivatives", () => {
  const sql = readFileSync(
    "supabase/migrations/20260917223000_seed_olympic_lifts.sql",
    "utf8",
  );

  assert.match(sql, /'Snatch'/);
  assert.match(sql, /'Power Snatch'/);
  assert.match(sql, /'Hang Power Snatch'/);
  assert.match(sql, /'Snatch Pull'/);
  assert.match(sql, /'Clean'/);
  assert.match(sql, /'Power Clean'/);
  assert.match(sql, /'Hang Power Clean'/);
  assert.match(sql, /'Clean Pull'/);
  assert.match(sql, /'Clean and Jerk'/);
  assert.match(sql, /'Power Jerk'/);
  assert.match(sql, /'Squat Jerk'/);
  assert.match(sql, /'Dumbbell Snatch'/);
  assert.match(sql, /'Kettlebell Clean and Jerk'/);
  assert.match(sql, /'olympic_lift'/);
});

test("grip seed covers crush pinch support wrist and finger strength", () => {
  const sql = readFileSync(
    "supabase/migrations/20260917230000_seed_grip_strength_exercises.sql",
    "utf8",
  );

  assert.match(sql, /'Hand Gripper Close'/);
  assert.match(sql, /'Plate Pinch Hold'/);
  assert.match(sql, /'Rolling Handle Lift'/);
  assert.match(sql, /'Axle Bar Static Hold'/);
  assert.match(sql, /'Dead Hang'/);
  assert.match(sql, /'Single-Arm Dead Hang'/);
  assert.match(sql, /'Wrist Roller'/);
  assert.match(sql, /'Finger Curl'/);
  assert.match(sql, /'Finger Extension Band'/);
  assert.match(sql, /'Rice Bucket Grip Drill'/);
  assert.match(sql, /'Rope Climb'/);
});

test("strongman seed covers carries loads presses pulls and classic events", () => {
  const sql = readFileSync(
    "supabase/migrations/20260917233000_seed_strongman_exercises.sql",
    "utf8",
  );

  assert.match(sql, /'Atlas Stone Load'/);
  assert.match(sql, /'Yoke Carry'/);
  assert.match(sql, /'Husafell Carry'/);
  assert.match(sql, /'Sandbag Load'/);
  assert.match(sql, /'Tire Flip'/);
  assert.match(sql, /'Arm-Over-Arm Pull'/);
  assert.match(sql, /'Log Clean and Press'/);
  assert.match(sql, /'Circus Dumbbell Press'/);
  assert.match(sql, /'Car Deadlift'/);
  assert.match(sql, /'Power Stairs'/);
  assert.match(sql, /'Fingal Fingers'/);
  assert.match(sql, /'Strongman Medley'/);
});

test("variation loading never exposes results from a previous exercise", () => {
  const hook = readFileSync("src/hooks/useExerciseVariations.ts", "utf8");

  assert.match(hook, /loadedExerciseId === exerciseId/);
  assert.match(hook, /hasLoadedVariations \? loadedVariations : \[\]/);
});

test("set editing preserves its requested variation until loading completes", () => {
  const screen = readFileSync("src/screens/AddSetScreen.tsx", "utf8");

  assert.match(screen, /if \(!hasLoadedVariations\) return;/);
  assert.match(screen, /disabled=\{isSaving \|\| !hasLoadedVariations\}/);
});
