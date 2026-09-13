import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migrationsDirectory = join(process.cwd(), "supabase", "migrations");
const migrationFiles = readdirSync(migrationsDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort();
const migrations = migrationFiles.map((file) => ({
  file,
  sql: readFileSync(join(migrationsDirectory, file), "utf8").toLowerCase(),
}));
const allSql = migrations.map(({ sql }) => sql).join("\n");

type OwnershipContract = {
  column: "id" | "owner_id" | "user_id";
  operations: ("delete" | "insert" | "select" | "update")[];
};

const crud = ["select", "insert", "update", "delete"] as const;
const ownershipContracts: Record<string, OwnershipContract> = {
  profiles: { column: "id", operations: ["select", "insert", "update"] },
  exercises: { column: "owner_id", operations: [...crud] },
  workout_sessions: { column: "user_id", operations: [...crud] },
  workout_sets: { column: "user_id", operations: [...crud] },
  workout_templates: { column: "user_id", operations: [...crud] },
  workout_template_exercises: { column: "user_id", operations: [...crud] },
  workout_session_exercises: { column: "user_id", operations: [...crud] },
  nutrition_entries: { column: "user_id", operations: [...crud] },
  nutrition_goals: { column: "user_id", operations: [...crud] },
  supplement_protocols: { column: "user_id", operations: [...crud] },
  supplement_logs: { column: "user_id", operations: [...crud] },
  daily_recovery_checkins: { column: "user_id", operations: [...crud] },
  user_entitlements: { column: "user_id", operations: ["select"] },
  water_entries: { column: "user_id", operations: [...crud] },
  user_specialty_equipment: { column: "user_id", operations: [...crud] },
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function policyStatement(table: string, operation: string) {
  const match = allSql.match(
    new RegExp(
      `create\\s+policy\\s+[^;]+?on\\s+public\\.${escapeRegex(table)}` +
        `\\s+for\\s+${operation}\\s+to\\s+authenticated\\s+([\\s\\S]*?);`,
    ),
  );
  return match?.[1] ?? null;
}

test("every declared user-owned table enables RLS", () => {
  for (const table of Object.keys(ownershipContracts)) {
    assert.match(
      allSql,
      new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`),
      `${table} must enable RLS`,
    );
  }
});

test("new user-owned tables cannot bypass the ownership inventory", () => {
  const discovered = new Set<string>();
  const tablePattern = /create\s+table\s+if\s+not\s+exists\s+public\.(\w+)\s*\(([\s\S]*?)\n\);/g;
  for (const match of allSql.matchAll(tablePattern)) {
    if (/\b(user_id|owner_id)\s+uuid\b/.test(match[2])) discovered.add(match[1]);
  }

  for (const table of discovered) {
    assert.ok(
      ownershipContracts[table],
      `${table} is user-owned but has no reviewed RLS contract`,
    );
  }
});

test("ownership policies isolate every supported operation", () => {
  for (const [table, contract] of Object.entries(ownershipContracts)) {
    for (const operation of contract.operations) {
      const statement = policyStatement(table, operation);
      assert.ok(statement, `${table} needs an authenticated ${operation} policy`);
      assert.match(
        statement,
        new RegExp(`(select\\s+auth\\.uid\\(\\))\\s*\\)?\\s*=\\s*${contract.column}|${contract.column}\\s*=\\s*\\(select\\s+auth\\.uid\\(\\)\\)`),
        `${table} ${operation} must compare auth.uid() with ${contract.column}`,
      );
      if (operation === "insert") assert.match(statement, /with\s+check/);
      if (operation === "update") {
        assert.match(statement, /using\s*\(/);
        assert.match(statement, /with\s+check\s*\(/);
      }
    }
  }
});

test("ownership columns have an index, primary key, or leading unique constraint", () => {
  for (const [table, { column }] of Object.entries(ownershipContracts)) {
    const patterns = [
      `create\\s+(?:unique\\s+)?index[^;]+on\\s+public\\.${table}\\s*\\(\\s*${column}\\b`,
      `create\\s+table[^;]+public\\.${table}[\\s\\S]+?${column}\\s+uuid\\s+primary\\s+key`,
      `create\\s+table[^;]+public\\.${table}[\\s\\S]+?primary\\s+key\\s*\\(\\s*${column}\\b`,
      `create\\s+table[^;]+public\\.${table}[\\s\\S]+?unique\\s*\\(\\s*${column}\\b`,
    ];
    assert.ok(
      patterns.some((pattern) => new RegExp(pattern).test(allSql)),
      `${table}.${column} needs a leading ownership index`,
    );
  }
});

test("migrations reject unsafe RLS and destructive-schema patterns", () => {
  assert.doesNotMatch(allSql, /auth\.role\s*\(/);
  assert.doesNotMatch(
    allSql,
    /create\s+(?:or\s+replace\s+)?function\s+public\.[\s\S]{0,500}?security\s+definer/,
  );

  for (const { file, sql } of migrations) {
    const destructive = /drop\s+table|alter\s+table[\s\S]{0,200}?drop\s+column|alter\s+column[\s\S]{0,100}?type/.test(sql);
    assert.ok(
      !destructive || sql.includes("migration-safety: destructive-reviewed"),
      `${file} contains destructive DDL without an explicit safety review marker`,
    );
  }
});

test("migration names remain ordered and collision-free", () => {
  assert.equal(new Set(migrationFiles).size, migrationFiles.length);
  for (const file of migrationFiles) {
    assert.match(file, /^\d{14}_[a-z0-9_]+\.sql$/);
  }
});
