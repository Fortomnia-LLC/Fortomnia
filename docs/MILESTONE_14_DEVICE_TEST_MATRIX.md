# Milestone 14 Device Test Matrix

This matrix separates historical evidence from the final PR-head release gate. Historical results remain useful regression evidence, but only results recorded against the final candidate builds count toward moving PR #3 out of draft.

## Candidate identity

| Item | iPhone | Android |
| --- | --- | --- |
| Application-code baseline | `c405c65e9aee5e24995827c8c4be2e81a52cd984` | `c405c65e9aee5e24995827c8c4be2e81a52cd984` |
| Final PR head used for build | Pending documentation commit | Pending documentation commit |
| EAS build ID | Pending | Pending |
| App version/build number | Pending | Pending |
| Device and OS | Pending | Pending three external tester reports |
| Tester and date | Pending | Pending |

Do not approve the PR until both build records above identify builds from the same final PR head and every critical scenario below is Pass.

## Historical evidence retained

| Platform | Commit | Build | Evidence | Status for final gate |
| --- | --- | --- | --- | --- |
| iOS | `1d8d8420b138723ab3b9237d7fe23d2d38288dcd` | `33667a87-7564-432c-ba98-5093214beaf4` | Startup/session, account lifecycle, coached workout, time/distance feedback, recap, measurements, offline/reconnect, forms and accessibility on iPhone 17 Pro / iOS 26.6 | Regression context only |
| iOS production | `c2496e420c9831d9a95f7cfe1005281a0b144aac` | `0c62911d-1000-4861-8c9f-1927e3ecdcb7` | Milestone 13 production candidate and submission `e0d939b2-6452-4354-86d5-8293c3eff140` | Frozen Milestone 13 evidence only |
| Android | `e95f205b0558695bf74b96e6c4edada5d6608864` | `d0b06ea0-31f7-4dbd-9a8b-156bb4a843a8` | Distributed to three external testers; no results recorded | Not evidence for final gate |

## Minimum final-head retest scenarios

Each scenario should be completed as one continuous flow where practical. Record Pass, Fail, or Blocked and add device, OS, tester, date, and defect links in Notes.

| Scenario | iPhone | Android | Notes |
| --- | --- | --- | --- |
| 1. Install, cold launch, background/resume, sign in, sign out, and session restore | Pending | Pending | Critical startup/session smoke |
| 2. Fresh account, email confirmation, password reset, reconnect after airplane mode, and account deletion | Pending | Pending | Critical auth/data-loss smoke |
| 3. Save Athletic Profile specialties and available equipment; generate an equipment-aware program; verify unavailable implements are excluded or substituted; create and reopen its templates | Pending | Pending | New `c405c65` specialty pipeline |
| 4. Complete a coached workout using strength, time, distance, calorie, and round targets; verify recommended-set prefill, met/exceeded/missed feedback, warm-up/drop-set exclusion, recap totals, and next direction | Pending | Pending | Covers all native metric rows in one workout |
| 5. Record low readiness and verify conservative holds for reps, time, distance, calories, and rounds | Pending | Pending | Previously automated only; native confirmation required |
| 6. Save Imperial and Metric profile/nutrition values, switch systems, and confirm values and template targets remain correct | Pending | Pending | Measurement/data regression |
| 7. Exercise large text, keyboard reachability, primary control labels, back navigation, small-screen/edge-to-edge layout, icon, splash, and dark theme | Pending | Pending | Android system navigation is Android-only; use an available smaller device on each platform where practical |

## Release decision

PR #3 may leave draft only when:

- GitHub quality checks pass on the final PR head.
- Both candidate build records identify that same head.
- Scenarios 1–7 are Pass on both platforms, except explicitly platform-specific checks.
- No unresolved crash, data-loss, authentication, account-deletion, or incorrect-program-generation defect remains.
- Failures are fixed and the affected scenario plus adjacent smoke coverage are rerun on replacement builds.

- iPhone approval: Pending
- Android approval: Pending three external tester reports against the final-head build
- Final approved commit: Pending
- Release decision/date: Pending
