# Fortomnia App Store Metadata Draft

**Prepared: August 9, 2026**

This draft reflects Fortomnia's current release scope. It intentionally excludes future Apple Health, AI coaching, lab tracking, recovery scoring, barcode scanning, payments, advertising, and wearable features.

## Product Page Metadata

### App name

`Fortomnia`

### Subtitle

`Strength in Everything.`

### Primary category

`Health & Fitness`

### Secondary category

Leave unset initially, or consider `Lifestyle` only if the final App Store positioning meaningfully extends beyond health and fitness.

### Promotional text

`Bring workouts, nutrition, supplements, and performance history together in one private system built to support consistent progress.`

### Keywords

`workout,fitness,strength,weightlifting,nutrition,supplements,training,exercise,macros,gym,sets,reps`

Do not add `Fortomnia` to the keyword field because the app name is already indexed. Do not use competitor names.

### Description

```text
Strength in Everything.

Fortomnia brings your training, nutrition, supplements, and performance history into one focused system. Build routines, record the work, and keep the information that shapes your progress connected to your account.

TRAIN WITH STRUCTURE

Create workout sessions, log sets and repetitions, track weight and reps in reserve, and review previous performance when planning the next effort.

BUILD REUSABLE WORKOUTS

Create workout templates with exercises, target sets, repetition ranges, and target RIR. Reorder exercises and use your templates to keep training consistent.

EXPLORE YOUR EXERCISE LIBRARY

Search exercises by name, alias, muscle group, movement pattern, or equipment. Create and manage private custom exercises when your training calls for something more specific.

TRACK NUTRITION

Record daily nutrition entries and monitor calories, protein, carbohydrates, and fat against your goals.

ORGANIZE SUPPLEMENTS

Maintain private supplement protocols, schedules, doses, and adherence records in one place.

REVIEW YOUR PROGRESS

See workout history, exercise performance, daily summaries, and weekly analytics without scattering your records across separate apps.

PRIVATE ACCOUNT-BASED TRACKING

Your records are associated with your authenticated account and synchronized through Fortomnia's secure backend. You can permanently delete your account and associated data from the Profile screen.

Fortomnia is a recordkeeping and informational tool. It does not provide medical advice, diagnosis, treatment, or emergency services. Consult qualified professionals before making decisions that may affect your health.
```

### URLs to configure

- Marketing URL: `https://fortomnia.com`
- Support URL: `https://fortomnia.com/support`
- Privacy Policy URL: `https://fortomnia.com/privacy`
- Account deletion information: `https://fortomnia.com/account-deletion`
- Terms: `https://fortomnia.com/terms`

These URLs are reserved targets, not publication claims. Verify that every page is live before entering it in App Store Connect.

## Version Information

### Version

`1.0.0`

### Copyright

`2026 [[LEGAL_OWNER_NAME]]`

Replace the placeholder with the person or legal entity that owns the application rights.

### Initial-release notes

```text
Welcome to Fortomnia.

Version 1.0 brings workout and set logging, reusable workout templates, exercise history, a searchable exercise library, nutrition tracking, supplement protocols, weekly analytics, profile preferences, cloud synchronization, and secure account deletion.
```

App Store Connect may not display a What's New field for the first public release. Retain this copy for TestFlight notes and later use.

## Screenshot Plan

Apple permits one to ten screenshots. Capture actual app screens using an accepted iPhone screenshot size; do not add transparency.

| Order | Screen | Suggested headline | What to show |
| --- | --- | --- | --- |
| 1 | Dashboard | Strength in Everything | Fortomnia branding and the connected daily overview |
| 2 | Training | Train with Structure | Workout templates and recent sessions |
| 3 | Set logging | Record Every Set | Exercise selection, previous performance, reps, weight, and RIR |
| 4 | Exercise library | Build Your Library | Search, filters, exercise details, and custom exercise support |
| 5 | Nutrition | Fuel the Work | Daily calories and macronutrient progress |
| 6 | Supplements | Keep Protocols Organized | Schedule, dose, and adherence states without medical claims |
| 7 | History or analytics | See the Work Add Up | Exercise history or weekly analytics using realistic demo data |

Screenshot rules:

- Use realistic but fictional demonstration data.
- Do not expose a real email address, medical record, or private notes.
- Keep all headlines accurate to functionality visible in the build.
- Avoid claims such as "optimal," "clinically proven," "safe," or guaranteed outcomes.
- Verify that every screenshot matches the submitted build.

## App Review Information

### Contact information

- First name: `[[REVIEW_CONTACT_FIRST_NAME]]`
- Last name: `[[REVIEW_CONTACT_LAST_NAME]]`
- Phone: `[[REVIEW_CONTACT_PHONE]]`
- Email: `[[REVIEW_CONTACT_EMAIL]]`

### Demo account

- Username: `[[REVIEW_ACCOUNT_EMAIL]]`
- Password: `[[REVIEW_ACCOUNT_PASSWORD]]`

Create a dedicated review account containing fictional sample workouts, nutrition entries, supplement protocols, and history. Keep it active for the entire review. Do not reuse a personal account.

### Review notes

```text
Fortomnia is an account-based fitness recordkeeping app. A network connection is required to authenticate and synchronize user records.

Use the review credentials supplied above. The demo account contains fictional sample data so the Dashboard, Training, Nutrition, Supplements, exercise history, and analytics screens can be reviewed immediately.

Key navigation:
- Dashboard: daily overview and weekly analytics.
- Training: workout sessions, templates, and exercise library.
- Nutrition: daily nutrition entries and goals.
- Supplements: user-created protocols and adherence logs.
- Profile: display preferences, sign out, and permanent account deletion.

To test account deletion, open Profile and select Delete account. The app displays a destructive confirmation before invoking the authenticated deletion function. Deletion permanently removes the account and associated user records. Please use the supplied account for deletion testing only if needed; notify us through App Review messages if a replacement review account is required.

Fortomnia does not provide medical advice, prescriptions, diagnoses, or treatment. Supplement information is entered by the user for private recordkeeping. The app does not sell or facilitate the purchase of supplements, peptides, hormones, medications, or controlled substances.

No special hardware, location, camera, health-data permission, subscription, or in-app purchase is required for this version.
```

## App Privacy Worksheet

This is a working worksheet, not a substitute for inspecting the final binary and every integrated SDK. Apple requires disclosure of data collected by the developer and third-party partners.

### Expected disclosures for the current build

| Apple data category | Fortomnia examples | Linked to user? | Tracking? | Purpose |
| --- | --- | --- | --- | --- |
| Contact Info — Name | Optional display name | Yes | No | App Functionality |
| Contact Info — Email Address | Account registration and authentication | Yes | No | App Functionality |
| Health & Fitness — Fitness | Workouts, exercises, sets, reps, weight, RIR, training history | Yes | No | App Functionality |
| Health & Fitness — Health | Nutrition goals and entries; supplement protocols and adherence | Yes | No | App Functionality |
| User Content — Other User Content | Workout, nutrition, supplement, template, and custom-exercise notes | Yes | No | App Functionality |
| Identifiers — User ID | Supabase account identifier associated with stored records | Yes | No | App Functionality |

### Expected answers

- Data used to track the user across apps or websites: **No**.
- Third-party advertising: **No**.
- Developer advertising or marketing: **No for the current build**.
- Analytics: **No intentional analytics collection in the current build**.
- Product personalization: **No separate use beyond delivering the user-requested app functionality**.
- Data sale: **No**.

### Items requiring final verification

- Review Supabase's current SDK and service behavior for retained diagnostics, IP addresses, authentication logs, and request metadata.
- Review Expo and all packaged third-party SDK privacy manifests in the final production binary.
- Confirm whether crash or diagnostic information is retained anywhere before answering the Diagnostics section.
- Re-run this worksheet whenever analytics, crash reporting, Apple Health, payments, AI features, advertising, or another SDK is added.

## Age Rating and Content Review

Complete Apple's current age-rating questionnaire based on the final submitted build rather than selecting a rating in advance. Pay particular attention to health or wellness content and references to supplements or other user-recorded substances. Fortomnia should consistently present these features as private recordkeeping, not medical treatment, prescribing, purchasing, or instructional drug-use content.

## Final Submission Checklist

- [ ] Fortomnia name is cleared for the intended filing and release scope.
- [ ] Bundle identifier and application identifiers reflect the final naming decision.
- [x] The monitored support address is included across public policies.
- [ ] `[[LEGAL_OWNER_NAME]]` and all App Review placeholders are replaced.
- [ ] Marketing, support, privacy, deletion, and terms URLs are live.
- [ ] A dedicated review account is active and populated with fictional data.
- [ ] App privacy answers are verified against the final binary and SDKs.
- [ ] Screenshots are captured from the submitted build at accepted dimensions.
- [ ] Account creation, sign-in, refresh, and deletion are retested in production.
- [ ] No future or unavailable functionality is described in metadata or screenshots.
- [ ] Export compliance, content rights, age rating, pricing, and availability are completed in App Store Connect.
- [ ] Appropriate legal review is complete.
