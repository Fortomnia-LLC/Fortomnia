# Database migration and RLS policy

Fortomnia treats every table in an exposed schema as reachable through the Data API. A table that stores user data must therefore have an explicit, tested ownership contract before it is merged.

## User-owned table requirements

- Enable row-level security in the migration that creates the table.
- Grant only the operations the mobile client needs.
- Target policies with `to authenticated`; never use `auth.role()`.
- Compare the ownership column with `(select auth.uid())` in every policy.
- Give update policies both `using` and `with check` predicates so ownership cannot be reassigned.
- Index the ownership column as the first index column, or make it the leading primary/unique key column.
- Add the table and allowed operations to `tests/database-security.test.ts`.
- Use composite foreign keys such as `(parent_id, user_id)` when a child must share its parent's owner.

Read-only server-managed data, such as entitlements, receives only a user-scoped select policy. Shared catalog data must use a separately reviewed read policy and must not expose write access to authenticated clients.

## Backward-compatible migration sequence

1. Add new nullable columns, tables, indexes, policies, or constraints without removing the old contract.
2. Deploy app code that can read both old and new shapes and writes the new shape when available.
3. Backfill existing rows in bounded batches and verify counts and ownership.
4. Add validation or `not valid` constraints first, then validate them separately where supported.
5. Enforce non-null or stricter constraints only after every supported mobile version tolerates them.
6. Remove obsolete fields only after the compatibility window and add `-- migration-safety: destructive-reviewed` with the rollback or forward-fix plan.

Never rewrite an applied migration. Correct production schema with a new additive migration. Every schema-bearing pull request must run the migration contract tests and document its compatibility and recovery plan.
