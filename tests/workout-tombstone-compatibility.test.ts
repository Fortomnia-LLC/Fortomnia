import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260916232000_harden_workout_tombstone_compatibility.sql",
  "utf8",
);

test("legacy reads cannot see workout tombstones", () => {
  assert.match(
    migration,
    /create policy "Users can view their own active workout sets"[\s\S]*user_id = \(select auth\.uid\(\)\)[\s\S]*deleted_at is null/,
  );
});

test("the conflict-safe RPC retains controlled tombstone visibility", () => {
  assert.match(
    migration,
    /alter function public\.apply_workout_set_mutation\([\s\S]*\) security definer/,
  );
  assert.match(
    readFileSync(
      "supabase/migrations/20260913160831_add_workout_conflict_tombstones.sql",
      "utf8",
    ),
    /authenticated_user_id uuid := \(select auth\.uid\(\)\)[\s\S]*where id = p_entity_id and user_id = authenticated_user_id/,
  );
});

test("parent and legacy deletes retain the intended lifecycle", () => {
  assert.match(migration, /create trigger workout_sets_cascade_tombstone/);
  assert.match(migration, /where parent_set_id = new\.id[\s\S]*deleted_at is null/);
  assert.match(migration, /create trigger workout_sets_soft_delete_compatibility/);
  assert.match(migration, /if pg_trigger_depth\(\) > 1 then\s+return old/);
  assert.match(
    migration,
    /workout_sets_exercise_id_fkey[\s\S]*references public\.exercises \(id\)[\s\S]*on delete cascade/,
  );
});

test("trigger helpers are invoker-safe and not public APIs", () => {
  assert.match(migration, /cascade_workout_set_tombstone\(\)[\s\S]*security invoker/);
  assert.match(migration, /soft_delete_workout_set\(\)[\s\S]*security invoker/);
  assert.match(
    migration,
    /revoke all on function public\.cascade_workout_set_tombstone\(\) from public/,
  );
  assert.match(
    migration,
    /revoke all on function public\.soft_delete_workout_set\(\) from public/,
  );
});
