import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260913150000_add_workout_set_tombstones.sql",
  "utf8",
);

test("workout set tombstones preserve deletions across stale clients", () => {
  assert.match(migration, /add column if not exists deleted_at timestamptz/);
  assert.match(
    migration,
    /where deleted_at is null/,
    "active set numbering must ignore tombstoned rows",
  );
  assert.doesNotMatch(
    migration,
    /delete from public\.workout_sets/i,
    "the migration must not discard deletion history",
  );
  assert.match(
    migration,
    /create trigger workout_sets_soft_delete_compatibility/,
    "older app deletes must be converted into tombstones",
  );
  assert.match(
    migration,
    /create policy "Users can view their own active workout sets"[\s\S]*deleted_at is null/,
    "legacy reads must hide tombstones at the server boundary",
  );
  assert.match(
    migration,
    /create trigger workout_sets_cascade_tombstone/,
    "deleting a parent must tombstone its drop-set children",
  );
  assert.match(
    migration,
    /workout_sets_exercise_id_fkey[\s\S]*on delete cascade/,
    "deleting an unused custom exercise must clean up its tombstones",
  );
  assert.match(
    migration,
    /if pg_trigger_depth\(\) > 1 then\s+return old/,
    "workout and account deletion cascades must remain physical",
  );
});

test("workout set tombstones retain a reconciliation timestamp", () => {
  assert.match(
    migration,
    /add column if not exists updated_at timestamptz not null default now\(\)/,
  );
  assert.match(
    migration,
    /workout_sets_user_deleted_updated_idx/,
    "reconciliation lookups need an indexed user/deletion/update path",
  );
});
