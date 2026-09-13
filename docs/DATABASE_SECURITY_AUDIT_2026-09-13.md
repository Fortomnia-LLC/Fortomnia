# Database security audit — 2026-09-13

## Verified

- The live Supabase project reports row-level security enabled on every current user-owned table.
- User-owned tables expose ownership-scoped policies for their supported operations. Server-managed entitlements remain read-only to the owning user.
- Ownership columns are covered by a primary key, leading unique constraint, or leading index.
- Existing policies use `(select auth.uid())` and update policies include both `using` and `with check`.
- The migration ledger contains no deprecated `auth.role()` authorization, unreviewed destructive DDL, or `security definer` function in the exposed `public` schema.

The automated migration contract lives in `tests/database-security.test.ts`. Any new user-owned table must be added to its reviewed ownership inventory.

## Advisor follow-up

Supabase's security advisor reported that leaked-password protection is disabled. Enabling it is an account-level Auth setting and remains a separate operational action. Reference: [Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

The performance advisor reported unused indexes. No indexes were removed: Fortomnia is newly launched, and low observed usage is not sufficient evidence that foreign-key, lookup, and ownership indexes are unnecessary.

## Remaining integration gate

Before marking cross-user isolation complete, run authenticated two-user CRUD tests against an isolated Supabase database branch. Production data must not be used as test fixtures.
