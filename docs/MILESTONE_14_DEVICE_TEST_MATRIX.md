# Milestone 14 Device Test Matrix

Use the exact commit and build identifiers intended for release. Record Pass, Fail, or Blocked for every row; do not treat the frozen Milestone 13 submission as coverage for Milestone 14.

## Build record

| Item | iPhone | Android |
| --- | --- | --- |
| Commit SHA | `e95f205b0558695bf74b96e6c4edada5d6608864` | `e95f205b0558695bf74b96e6c4edada5d6608864` |
| EAS build ID | `44513947-bcab-48ef-95f8-20a3efb54ff3` | `d0b06ea0-31f7-4dbd-9a8b-156bb4a843a8` |
| App version/build number | 1.0.0 / 2 | Preview build |
| Device and OS version | iPhone 17 Pro / iOS 26.6 | Pending tester reports |
| Tester | grc0830 | Three external testers |
| Test date | 2026-08-22 | In progress |

## Installation and startup

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Clean install succeeds | Pass |  |  |
| App icon and splash render correctly | Pass |  |  |
| Cold launch succeeds | Pass |  |  |
| Returning from background restores the session | Pass |  |  |
| Airplane-mode launch shows a recoverable state | Pass |  |  |
| Reconnecting restores data without restarting | Pass |  |  |

## Account lifecycle

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Create a fresh account | Pass |  |  |
| Confirm email and return to Fortomnia | Pass |  |  |
| Sign in and sign out | Pass |  |  |
| Request and complete password reset | Pass |  |  |
| Reinstall and restore an existing session | Pass |  |  |
| Delete the test account and verify sign-out | Pass |  |  |

## Training intelligence

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Generate or open a workout template | Pass |  |  |
| Exercise cards show today’s targets | Pass |  |  |
| “Log recommended set” prefills correctly | Pass |  |  |
| Strength target feedback is correct | Pass |  |  |
| Time target feedback is correct |  |  | Not separately confirmed |
| Distance target feedback is correct |  |  | Not separately confirmed |
| Calorie target feedback is correct |  |  | Not separately confirmed |
| Round target feedback is correct |  |  | Not separately confirmed |
| Warm-ups and drop sets are not evaluated | Pass |  |  |
| Low-readiness targets hold conservatively |  |  | Not separately confirmed |
| Completing a workout shows the recap | Pass |  |  |
| Recap totals and next direction are correct | Pass |  |  |

## Measurements and forms

| Test | iPhone | Android | Notes |
| --- | --- | --- | --- |
| Imperial profile preference saves | Pass |  |  |
| Nutrition accepts pounds and feet/inches | Pass |  |  |
| Metric profile and nutrition values save | Pass |  |  |
| Switching systems converts existing values | Pass |  |  |
| Keyboard does not hide active fields or buttons |  |  | Not separately confirmed |
| Forms remain usable with large accessibility text |  |  | Not separately confirmed |

## Release decision

Release only when every critical row passes on both platforms, the exact commit passes GitHub Actions, and no unresolved crash, data-loss, authentication, or account-deletion defect remains.

- iPhone approval: Core critical flows passed; remaining metric/accessibility rows pending
- Android approval: Pending three external tester reports
- Final approved commit: ____________________
- Release decision/date: ____________________
