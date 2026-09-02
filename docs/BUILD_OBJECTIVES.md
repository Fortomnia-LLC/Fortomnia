# Fortomnia Build Objectives

This is the authoritative product objective ledger. Before starting an objective, compare the proposed work with the existing implementation and extend the named foundation rather than creating a parallel system.

Status legend: **Complete foundation** = usable groundwork exists but may still need production hardening; **In progress** = partially implemented; **Required** = accepted objective not yet implemented; **Conditional** = desired only if a measured validation gate is met; **Later** = intentionally outside the current milestone.

## Milestone 15 — Health, Apple Watch, and AI coaching

### Completed increments — 2026-09-01

- Enabled the existing GitHub quality workflow for all `milestone/**` branches. Every push now runs unit tests, TypeScript validation, and Expo Doctor.
- Added tested Apple Health sync freshness states: fresh, stale, never synced, and device clock skew.
- Added a Recovery-screen stale-sync warning and an explicit Apple Health disconnect control that clears Fortomnia's local health state.
- Hardened health normalization against negative, non-finite, and malformed native values while preserving legitimate zero readings.
- Added strict, terminating validation for inclusive health-summary date ranges.
- Improved Recovery sleep display precision and accessibility labels for Health actions.
- Verified the completed increment through successful GitHub Quality Check runs #154, #155, and #157.
- Reconciled the three Milestone 14 readiness commits and preserved their Android, device-test, and release-gate evidence.
- Corrected Apple Health authorization reporting so read access is never falsely claimed and partial write permissions remain explicit.
- Replaced raw HealthKit failure text with tested, actionable error states that do not expose unexpected native details in the UI or console logs.

### Objective ledger

| Objective | Status on `milestone/15-health-wearables` | Existing foundation | Remaining acceptance target |
|---|---|---|---|
| Apple Health authorization and reads | Complete foundation | Local Expo module `modules/fortomnia-health`; health provider, normalization, connection storage, and recovery UI | Harden error states, partial permissions, persistence, time zones, duplicate samples, and production privacy disclosures |
| Health signals | Complete foundation | Sleep, heart rate, resting heart rate, HRV, steps, active energy, workouts, weight, and body-fat types are represented | Validate units and source precedence; add incremental/background ingestion and explicit freshness indicators |
| Recovery/readiness analysis | Complete foundation | 7–28 day personal baselines and deterministic, explainable training guidance | Extend the existing algorithm with confidence, missing-data behavior, weekly trend review, and safe plan adjustments; do not introduce a second readiness engine |
| Fortomnia Apple Watch app | In progress | HealthKit data produced by Apple Watch can be read on iPhone through Apple Health; versioned workout-transfer and idempotent offline-action contracts are being established | Add a real SwiftUI watchOS app/companion with planned-session start, current exercise, set logging, load/reps/RPE or RIR, timers, heart rate, next exercise, completion, offline queueing, and phone reconciliation |
| Watch motion rep counting | Conditional | The planned watchOS companion can collect Core Motion accelerometer and gyroscope signals during an explicitly started set | Prototype only for exercises with meaningful wrist motion and require exercise selection, wrist-side handling, manual correction, and real-athlete validation. Ship per exercise only if at least 95% of validation sets are counted exactly or within one rep, false reps outside active sets are prevented, and ordinary logging remains the fallback; otherwise do not release it |
| iPhone and Lock Screen widgets | Required | Recovery, workout, and reminder data already exist in the iPhone app | Add WidgetKit Home Screen and Lock Screen widgets for recovery freshness, next workout/current session, and safe quick actions; use App Groups for minimal shared snapshots, deep-link into Fortomnia, handle stale/empty states, refresh within system limits, and redact sensitive health details while the device is locked |
| Workout recording and HealthKit write-back | In progress | Native module declares workout/body write types, but the current product flow is read-oriented | Implement workout-session lifecycle, permission UX, write-back, duplicate prevention, and—where architecture permits—Watch/iPhone workout mirroring |
| Reliable health sync | Required | Current on-demand provider flow and normalized daily summaries | Add anchored/incremental queries, background delivery, stable sample IDs, idempotent storage, source priority, retry, conflict resolution, and observable last-sync state |
| Android health | Later | Cross-provider types already include `health_connect` | Implement Health Connect only after the iOS contract and sync model are stable |
| AI coach profile/onboarding | In progress | Existing questionnaire/profile migrations and deterministic training intelligence | Extend the existing profile; do not create a second onboarding or coach-profile store |
| AI coaching runtime | Required | Premium AI design and `user_entitlements` architecture are documented in [PREMIUM_AI_COACH.md](./PREMIUM_AI_COACH.md) | Add protected server-side model execution, structured training/recovery context, consent, rate limits, cost controls, auditability, data deletion, and graceful deterministic fallback |
| AI coaching behaviors | Required | Deterministic progression and recovery guidance already provide safe inputs | Add weekly review, readiness-aware recommendations, exercise substitutions, explanations and confidence, explicit user confirmation before plan changes, and conversational history boundaries |
| AI safety | Required | Recovery screen includes wellness/medical framing | AI must not diagnose, treat injury, or prescribe/change peptide, TRT, AAS, or other medication dosing; escalate red-flag health signals and retain non-AI fallback |
| Exercise library | In progress | Expanded `exercises` schema and seeds include aliases, muscles, movement patterns, instructions, unilateral movements, athletic/functional work, conditioning, grip, and strongman | Audit coverage and quality; add structured media/technique metadata, movement constraints, equipment compatibility, substitutions, and versioned editorial review rather than creating a replacement exercise table |
| General equipment preferences | In progress | `profiles.available_equipment` contains broad categories | Normalize equipment into catalog entities while preserving compatibility with existing profiles |
| Specialty equipment | Complete foundation | `specialty_implements`, events, mappings, transfer scores, and RLS-protected `user_specialty_equipment` | Bridge this model to the general catalog and substitution engine; do not create another user-equipment table |
| Gym profiles and session equipment | Required | User-level broad and specialty availability exist | Let users save gyms/locations, equipment inventory and notes, choose the active gym, and generate/filter sessions from equipment actually available there |
| Equipment-aware programming | Required | Exercise/implement mappings and broad equipment values exist | Deterministically rank exact matches and safe substitutions first; use AI to explain or refine, not to bypass compatibility constraints |
| GymRadar-informed expansion | Required with source constraint | Existing Fortomnia catalog and specialty taxonomy are the destination | Use GymRadar to study category coverage and identify omissions. Do not scrape/copy its listings, reviews, photos, or proprietary data without an API, partnership, or explicit reuse license; preserve provenance for every imported asset |
| Privacy and user control | Required | Health data remains local/provider-driven in the current foundation | Update privacy disclosures before release; provide granular permissions, disconnect/delete controls, AI-use consent, retention rules, and an account-data deletion path |
| Milestone integration | Complete foundation | The three Milestone 14 readiness commits are reconciled into this branch with both milestones preserved | Keep shared contracts synchronized and rerun migrations/tests before the milestone merge |

### Duplicate-prevention rules

1. Extend `modules/fortomnia-health`; do not add a second HealthKit wrapper unless a documented capability gap requires replacement.
2. Extend the current recovery baselines and `recoveryTrainingGuidance`; maintain one readiness contract.
3. Extend the existing AI questionnaire/profile and `user_entitlements`; do not create parallel onboarding, entitlement, or billing state.
4. Extend `exercises` plus current exercise/implement/event mappings; do not create a replacement exercise library.
5. Normalize or bridge `profiles.available_equipment` and `user_specialty_equipment`; do not add another disconnected equipment-preference table.
6. Treat Apple Health ingestion, the Fortomnia Apple Watch app, and WidgetKit extensions as separate deliverables with shared contracts rather than duplicate storage or business logic.
7. Keep deterministic safety, progression, equipment compatibility, and recovery logic authoritative. AI may explain and personalize within those constraints.
8. Every schema change must include migration, RLS review, backfill/compatibility plan, and tests.

### Milestone 15 delivery order

1. **Complete:** Reconcile the Milestone 14 branch delta and freeze shared data contracts.
2. Harden HealthKit ingestion, persistence, privacy, and recovery tests.
3. Build the Fortomnia Apple Watch app and offline/idempotent synchronization.
4. Add privacy-safe iPhone and Lock Screen widgets using shared app data and deep links.
5. Unify equipment catalog concepts and add gym profiles without replacing current tables.
6. Expand and quality-audit exercise/equipment mappings using licensed or original data.
7. Add deterministic substitution ranking.
8. Ship the protected premium AI runtime on top of existing deterministic systems.
9. Run end-to-end release tests: permissions denied/partial, offline Watch, duplicate samples, time-zone changes, background sync, widget stale/locked states, RLS, entitlement loss/restore, unsafe AI prompts, and deterministic fallback.

## Training intelligence backlog

- AI onboarding interview covering goals, experience, schedule, injuries/limitations, equipment, preferred movements, weak points, and nutrition context.
- Large exercise catalog with equipment, movement pattern, primary/secondary muscles, aliases, unilateral flag, instructions, media, substitutions, and constraints.
- Workout duration targets and time-aware generation.
- Warm-up versus working-set labels and guidance.
- Drop sets, supersets, circuits, and grouped-set logging.
- Clear next-set/next-exercise state and active rest timers.
- Skip, substitute, reorder, and edit a workout during a live session without corrupting history.
- Program/progression changes driven by performance, recovery, adherence, and user confirmation.
- Investigate anabolic/catabolic tracking only as an evidence and safety discovery task; do not present speculative scores as medical fact.

## Nutrition and supplements backlog

- Nutrition goals, daily logging, trend views, and coaching context.
- Meal/food library with user-created items and reliable nutrition provenance.
- Supplement schedule, adherence, reminders, interaction warnings, and user-controlled coaching context.
- Keep supplement education separate from medication prescribing or dosing.

## Forms and assessments backlog

- Reusable form/assessment engine.
- Progress check-ins, readiness surveys, injury/limitation intake, and program feedback.
- Versioned questions and answers so historical interpretation remains stable.

## Notifications backlog

- Workout, rest-timer, check-in, nutrition, and supplement reminders.
- Granular preferences, quiet hours, time-zone correctness, deep links, and deduplication.
- Health or AI notifications must avoid alarming medical claims.

## Gym and collaboration backlog

- Gym discovery and facility profiles.
- Facility-verified equipment inventories with freshness/provenance.
- Member-submitted corrections with moderation.
- Gym-specific programming and substitutions.
- Facility partnerships must not override user privacy or safe exercise constraints.

## Quality gates

- Tests cover domain logic, migrations, RLS, permission states, synchronization, and critical UI flows.
- Accessibility labels, dynamic type, contrast, and reduced-motion behavior are required for phone and Watch.
- Analytics must exclude sensitive health content and respect consent.
- Every recommendation should state the inputs used, tolerate missing data, and fall back safely.
- No release may represent wellness guidance as diagnosis or treatment.

