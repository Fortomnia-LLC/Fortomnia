# Fortomnia Organic Growth Campaign

**Status:** Active groundwork  
**Primary constraint:** Use no-cost channels first. Do not begin paid acquisition until organic messages and landing-page conversion are measurable.  
**Primary funnel:** Reach → qualified website visit → app-store click → app download → activated user → store visit → purchase

## Goal

Expand Fortomnia's reach, increase qualified visits to [fortomnia.com](https://www.fortomnia.com/), grow iOS and Android downloads, and create a measurable path to future store purchases.

## Positioning

**Campaign promise:** Stop tracking fitness in pieces. Fortomnia connects training, nutrition, supplements, and recovery so athletes can see what is driving progress and know what to do next.

**Brand line:** Strength in Everything.

### Initial audience

1. Serious recreational lifters using multiple disconnected tools.
2. Strongman, grip, functional-strength, and unconventional-equipment athletes underserved by generic workout logs.
3. Coaches and independent gyms seeking a unified view of training, recovery, nutrition, and adherence.
4. Privacy-conscious athletes who want useful performance context without advertising or cross-app tracking.

## Operating principles

1. Lead with useful education and product proof.
2. Use one clear call to action per asset.
3. Repurpose one core idea across video, carousel, article, and community answers.
4. Tag every campaign link.
5. Measure visits and conversions before paying for distribution.
6. Never make medical, diagnostic, or supplement-treatment claims.
7. Keep commerce optional and separate from health guidance.
8. Use original or licensed media and disclose affiliate or compensated relationships.

## Phase 0 — Measurement and conversion

### Website requirements

- [ ] Put direct App Store and Google Play buttons above the fold.
- [ ] Repeat download buttons after product proof and in the final CTA.
- [ ] Create a focused `/download` page with the promise, three differentiators, screenshots, privacy reassurance, and both platform links.
- [ ] Ensure every download control is a crawlable link.
- [ ] Confirm one canonical domain: `https://www.fortomnia.com/`.
- [ ] Request recrawling after stale “in development” and “future store” results are removed or redirected.
- [ ] Give store products distinct, stable URLs when the storefront is ready.

### Analytics contract

| Event | Trigger | Required properties |
|---|---|---|
| `website_view` | Landing page viewed | `page_path`, UTM properties, referrer |
| `download_cta_clicked` | General download CTA clicked | `placement`, `page_path`, UTM properties |
| `app_store_clicked` | Apple App Store link clicked | `placement`, `page_path`, UTM properties |
| `play_store_clicked` | Google Play link clicked | `placement`, `page_path`, UTM properties |
| `store_clicked` | Store navigation or CTA clicked | `placement`, `page_path`, UTM properties |
| `product_viewed` | Product detail viewed | `product_id`, `source` |
| `checkout_started` | Checkout begins | `product_ids`, `source` |
| `purchase_completed` | Confirmed purchase | `order_id`, `revenue`, `source` |

Never put health, nutrition, workout, supplement, contact, or other sensitive content into marketing analytics.

### UTM convention

Use lowercase values:

```text
utm_source=<platform-or-partner>
utm_medium=organic_social|community|earned_media|partner|email
utm_campaign=whole_athlete
utm_content=<short-asset-name>
```

Example:

```text
https://www.fortomnia.com/download?utm_source=instagram&utm_medium=organic_social&utm_campaign=whole_athlete&utm_content=stop_tracking_in_pieces_reel
```

## Organic channel strategy

### Content pillars

| Pillar | Examples | CTA |
|---|---|---|
| Train | Progressive overload, templates, strongman/grip logging, exercise history | See how training works |
| Fuel | Macro context, reusable foods, training-day nutrition | Explore nutrition |
| Protocol | Supplement organization, schedules, adherence | See protocols |
| Recover | Sleep, soreness, stress, energy, readiness | Understand recovery |
| Whole athlete | Why disconnected trackers miss context | Download Fortomnia |

### Weekly cadence

- **3 short videos:** Instagram Reels, Facebook Reels, TikTok, and YouTube Shorts.
- **2 carousel/image posts:** Education and product demonstrations.
- **1 founder post:** Origin, product decision, lesson, or weekly improvement.
- **1 search-focused article:** Answer one specific athlete question.
- **10 substantive community contributions:** Helpful answers without unsolicited link dropping.
- **1 weekly review:** Optimize for qualified clicks and conversion, not vanity engagement.

The strongest Fortomnia business post may be manually reshared from personal Facebook and Instagram profiles; Meta Business Suite does not automate personal-profile distribution.

## Thirty-day calendar

### Week 1 — Make acquisition measurable

- [ ] Implement the analytics contract and verify ingestion.
- [ ] Add or verify direct store CTAs and the `/download` path.
- [ ] Build campaign URLs using the UTM convention.
- [ ] Capture a seven-day baseline.
- [ ] Publish **Stop tracking fitness in pieces**.
- [ ] Publish the founder story explaining the four-pillar system.

### Week 2 — Demonstrate the product

- [ ] Publish a workout-template/logging demonstration.
- [ ] Publish a whole-athlete carousel.
- [ ] Publish nutrition/protocol and recovery demonstrations.
- [ ] Publish the first search article.
- [ ] Collect five real user questions for future content.

### Week 3 — Borrow trusted distribution

- [ ] Identify 25 relevant micro-creators, coaches, gyms, strongman competitors, and grip athletes.
- [ ] Send personalized outreach offering access and requesting candid feedback.
- [ ] Propose three lightweight collaborations.
- [ ] Prepare a press kit: product summary, founder story, screenshots, logo, privacy position, and download links.
- [ ] Pitch relevant newsletters, podcasts, local-business media, and strength-sport publications.

### Week 4 — Optimize

- [ ] Rank content by qualified visits and download/store clicks.
- [ ] Repurpose winning topics.
- [ ] Improve landing-page messaging or CTA placement from observed behavior.
- [ ] Collect testimonials only with explicit permission.
- [ ] Measure store interest before expanding commerce promotion.
- [ ] Build the next 30-day calendar from results.

## Initial creative briefs

### Stop tracking fitness in pieces

**Hook:** A workout log cannot explain everything that happened in a workout.  
**Proof:** Show training, nutrition, supplements, and recovery in one connected flow.  
**CTA:** See the whole system.

### Stop rebuilding workouts from memory

**Hook:** If the plan changes every time notes are opened, progression becomes guesswork.  
**Proof:** Show templates, completed sets, and prior performance.  
**CTA:** Download Fortomnia.

### What changed between a great session and a bad one?

**Hook:** Load and reps tell only part of the story.  
**Proof:** Connect recent training with sleep, soreness, stress, and energy.  
**CTA:** Explore recovery.

### Built for the movements generic logs miss

**Hook:** Training should not disappear because the implement is unconventional.  
**Proof:** Demonstrate strongman, grip, carries, or specialty equipment.  
**CTA:** Explore strength tracking.

## Search-content backlog

1. How to track progressive overload.
2. Workout logging for serious lifters.
3. Strongman workout logging and specialty implements.
4. How sleep and soreness affect strength training.
5. Training readiness without guesswork.
6. Supplement schedule and adherence tracking.
7. Workout planning across multiple gyms and equipment setups.
8. Connecting nutrition targets with completed training.
9. Privacy-first fitness tracking.
10. Reusing past meals and nutrition facts.

Each page needs an original answer, relevant product demonstration, internal links, and one download CTA.

## Partnerships and earned media

Prioritize audience fit and trust over follower count.

Outreach should:

1. Reference a specific piece of the recipient's work.
2. Explain the genuine Fortomnia overlap.
3. Offer access, a tailored demo, or another immediate value.
4. Request candid feedback or a lightweight collaboration.
5. Never require positive coverage.
6. Obtain permission before reusing quotes or media.

The press kit should contain short and long descriptions, founder story, screenshots, logos, store links, support contact, privacy summary, and story angles covering whole-athlete tracking, underserved strength disciplines, and privacy-first performance context.

## Funnel review

| Stage | Metric | Initial decision rule |
|---|---|---|
| Reach | Qualified impressions/video views | Continue topics reaching the intended audience |
| Interest | Website visits by source/content | Expand assets generating qualified clicks |
| Intent | Download CTA click-through | Target at least 10% on focused landing pages |
| Acquisition | Store-page visits and installs | Compare source and platform when available |
| Activation | First meaningful in-app action | Define and instrument before optimizing downloads |
| Commerce | Store visits, checkout starts, purchases | Promote only after product attribution is reliable |

Use Week 1 as the baseline. The first 30-day directional target is to double qualified website visits while maintaining or improving download conversion.

## Paid-media gate

Do not begin paid acquisition until:

- Website and store clicks are measured.
- Two organic messages consistently produce qualified visits.
- The download page has a stable conversion baseline.
- App-store listings support conversion.
- In-app activation is measured.
- A capped test budget and stop-loss rule are approved.

## Groundwork status

- [x] Campaign goal and no-cost-first constraint documented.
- [x] Positioning and initial audiences defined.
- [x] Organic cadence defined.
- [x] UTM convention defined.
- [x] Analytics contract defined.
- [x] Thirty-day calendar drafted.
- [x] Creative briefs drafted.
- [x] Search backlog drafted.
- [ ] Website source identified.
- [ ] Analytics project ingesting events.
- [ ] Direct store links verified.
- [ ] Search Console recrawl confirmed.
- [ ] Social account inventory confirmed.
- [ ] Storefront readiness confirmed.

## Governance

This file is the authoritative organic-growth campaign ledger. Update it when assumptions, channels, creative themes, or conversion definitions change, and record completed work with dates and evidence. Do not create parallel campaign plans.
