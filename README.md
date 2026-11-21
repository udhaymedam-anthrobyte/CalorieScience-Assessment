# CalorieScience — Client Adherence & Practitioner Intelligence

A single responsive web application connecting two clinical nutrition workflows through a shared persistence layer:

- **`/`** — Demo landing page summarizing the adherence feedback loop and live state for fictional client **Ananya Rao**, with direct launch links to both interfaces.
- **`/client`** — Mobile-first, PWA-ready **Client Companion App** designed for low-friction meal check-ins, non-punitive progress reflection, and barrier reporting.
- **`/practitioner`** — Desktop-first **Practitioner Adherence Dashboard** enabling clinicians to triage a caseload, inspect 7-day meal & timing patterns without reading every entry, review structured insights, and send live plan adjustments back to the client.

---

## Quick Start

```bash
npm install
npm run dev      # Starts dev server on http://localhost:3000
npm run lint     # TypeScript type-check (tsc --noEmit)
npm run build    # Production build into dist/
```

Deployment to Vercel is supported directly via `vercel.json` SPA rewrites so `/`, `/client`, and `/practitioner` resolve cleanly on direct navigation or page refresh.

---

## Architecture & Technology Choices

| Layer | Choice | Rationale |
| --- | --- | --- |
| **Framework & Routing** | React 19, TypeScript, Vite, React Router (`/`, `/client`, `/practitioner`) + `vercel.json` | Keeps one unified codebase and shared reactive store across both user roles with zero backend overhead, fast local builds, and clean Vercel SPA routing. *(Note: The workspace template is Vite + React 19; retaining Vite with React Router + `vite-plugin-pwa` preserves exact `/`, `/client`, and `/practitioner` routes, native PWA service-worker caching, and instant builds without fragile framework migration.)* |
| **Design System & UI** | Tailwind CSS v4, shadcn/ui component primitives (`class-variance-authority`, `clsx`, `tailwind-merge`), Lucide icons, Sonner toasts | Clean, high-contrast healthcare SaaS visual hierarchy (`Plus Jakarta Sans` + `DM Sans` + `IBM Plex Mono` tabular numerals) with accessible touch targets (`>= 44px`) on mobile. |
| **Data Visualization** | Recharts + Interactive 7×4 Matrix | Stacked bar breakdown by meal slot and a Dinner Timing Drift chart against the 8:00 PM target, paired with a clickable 7-day matrix for rapid cell drill-down. |
| **Shared Persistence** | React Context + `localStorage` + `storage` event cross-tab sync | Mutations in `/client` immediately update `/practitioner` (and vice versa), including live synchronization if both routes are opened side-by-side in two browser tabs. |
| **PWA Readiness** | `vite-plugin-pwa` + Web App Manifest + PNG icons (`192px`, `512px`, maskable, iOS `180px`) + `PWAInstallButton` + `OfflineIndicator` | Makes `/client` installable to a smartphone home screen and resilient to brief offline gaps. |

---

## Data Model

The data model (`src/types/adherence.ts`) enforces a strict separation between **prescribed nutrition plan**, **actual client behaviour**, **missing data**, and **practitioner interventions**:

1. **`PlannedMealSlot` (`mealPlan`)**: The practitioner's prescribed daily structure (`8:00 AM Breakfast`, `1:00 PM Lunch`, `4:30 PM Afternoon Snack`, `8:00 PM Dinner`), plus an optional `activeAdjustment` when the practitioner pushes a live update.
2. **`MealLogEntry` (`logs`)**: Actual client check-in for a specific `(date, mealSlotId)` pair. Holds `status` (`followed | partial | substituted | skipped`), `actualTime` / `actualMinutes`, `substitutionText`, `barrierTags[]`, `hungerLevel`, `prepDifficulty`, and optional `comment`.
   - **Absence of a `MealLogEntry` for a past slot = `missing` (Logging Gap)** — never stored as `skipped`.
3. **`ClientFeedbackMessage` (`feedback`)**: Direct client-initiated notes with topic, related meal slot, and practitioner review status (`unreviewed | acknowledged | addressed`).
4. **`PractitionerActionItem` (`practitionerActions`)**: Unified clinical audit log covering `plan_adjustment`, `client_feedback`, `internal_note`, `followup_flag`, and `review_status`. Items with `visibleToClient: true` surface immediately in `/client` and support client acknowledgment (`acknowledgedByClient`).

---

## Adherence Calculation & Clinical Logic

Implemented in `src/lib/adherenceEngine.ts` as pure, deterministic functions:

1. **Logging Completeness vs. Plan Alignment (Two Distinct Metrics)**
   - **Logging Completeness** = `loggedCount / plannedCount` (for Ananya's initial 7 days: `26 / 28 = 93%`, with `2` explicit logging gaps).
   - **Logged Meal Alignment** excludes unlogged slots from the denominator so missing data is never misreported as skipped meals:
     $$\text{Weighted Alignment} = \frac{1.0 \times \text{Followed} + 0.6 \times \text{Partial} + 0.35 \times \text{Substituted} + 0.0 \times \text{Skipped}}{\text{Logged Meals}}$$
   - Exact-follow percentage (`Followed / Logged`) is displayed beside weighted alignment so clinicians always see raw counts alongside summary percentages.
2. **Observed Facts vs. Working Hypotheses**
   - The rules-based insight engine outputs two strictly separated lists:
     - **Observed from 7-day logs (factual data)**: Quantified statements directly derived from log counts (e.g., breakfast followed 6/7 days; lunch substituted 4/5 workdays; afternoon snack skipped 4/5 workdays with 1 unlogged day; hunger reported on 4/4 skipped-snack afternoons; dinner delayed 70–135 minutes on workdays).
     - **Working hypotheses & discussion prompts (to verify with client)**: Framed explicitly as non-clinical assumptions to confirm with Ananya (e.g., workday meeting schedule and prep effort may explain afternoon skips rather than low motivation).

---

## Product Thinking Decisions (Part D)

- **What should the client see first?** Today's date, any active update from her nutritionist (with one-tap confirmation), a gentle check-in progress strip, and her 4 planned meals in chronological order. Each card is a full-width tap target opening a <5-second bottom sheet.
- **What should the practitioner see first?** Triage queue status, Ananya's 7-day adherence overview (separating missing logs from non-adherence), the interactive 7×4 matrix, and the Observed vs. Hypotheses insight summary—allowing full situational awareness in ~15 seconds without opening individual logs unless drilling in.
- **What is hidden behind secondary interactions?** Detailed meal comments, exact substitution text, prep difficulty, and barrier tags sit behind single-cell clicks in the 7×4 matrix, keeping the primary dashboard scannable.
- **How is non-adherence separated from missing data?** Skipped meals require an explicit client report (`status: 'skipped'`, rose styling + minus icon). Unlogged past slots (`missing`, dashed neutral border + dashed circle icon) are counted in `Logging Gaps` and omitted from timing averages and alignment denominators.
- **How does the client UI encourage honesty rather than guilt?** No red "compliance score" or streak-shaming. Progress celebrates *check-in honesty* ("26 of 28 meals checked in — honest swaps help Dr. Meera tailor your plan") and explicitly frames skipped snacks as signals to simplify the plan.
- **How does this scale to 50–100 clients?** The practitioner sidebar implements an exception-based **Client Triage Queue** (`Needs Review`, `Follow-up Flagged`, `On Track`) with live search and primary-signal summaries so practitioners spend time on clients exhibiting recurring barriers or unreviewed feedback instead of auditing compliant clients manually.

---

## What Is Mocked & Production Roadmap

| Mocked in Prototype | Production Implementation |
| --- | --- |
| `localStorage` persistence + `storage` event cross-tab sync | PostgreSQL / Firestore backing store with authenticated REST/GraphQL endpoints and real-time subscriptions (WebSockets/SSE) |
| Seeded 7-day scenario for Ananya Rao + 4 summary roster clients | Multi-tenant clinic workspace with role-based access control (HIPAA/GDPR compliant audit trails, practitioner-client assignment) |
| Rules-based insight synthesizer | Hybrid deterministic pattern detector (guaranteed factual counts) paired with an audited LLM summary layer restricted to observed fields |
| Simulated sync error toggle ("Test error state") | Real optimistic updates with offline IndexedDB mutation queue and background sync retry |

---

## Known Limitations

- Secondary roster clients (`Rohan Menon`, `Priya Kulkarni`, `Vikram Desai`, `Kavita Sharma`) show caseload triage summaries rather than full interactive 7-day logs to keep focus on Ananya Rao's end-to-end workflow.
- Nutritional macros (`~28g protein`) are plan-level clinical guidance strings rather than a live food-database calculator (intentionally excluded per assignment constraints).
- Persistence is browser-local; opening the deployed link on two different physical devices will not share state without a hosted database.

---

## AI Tools Used

- Built with AI-assisted coding and design tooling for rapid TypeScript architecture, clinical UI iteration, Recharts integration, and editorial imagery generation.
- Every adherence formula, edge case (missing logs vs. skipped meals, workday vs. weekend date alignment, cross-tab synchronization, and live client-practitioner intervention sync), and accessibility check was explicitly designed and verified.

---

## Product Walkthrough Guide (3–5 Minutes)

Use this step-by-step flow for a live walkthrough or recorded demo:

1. **Landing Overview (`/`, ~30s)**: Point out Ananya Rao’s live 7-day summary (`26/28 logged`, `2 logging gaps`, `4 workday lunch swaps`, `4 skipped afternoon snacks`) and explain that both routes share one reactive state store.
2. **Client Companion Experience (`/client`, ~90s)**:
   - On **Today’s Plan**, show today’s date, the 8-day horizontal scroller, and how Breakfast is already logged while Lunch, Snack, and Dinner are open.
   - Tap **1:00 PM Lunch** to open the bottom sheet, select **Substituted**, pick a quick option (e.g. `Office cafeteria meal`), tag `Work meetings / schedule`, and save in under 5 seconds.
   - Open **Progress** to highlight how honest check-ins are encouraged without a punitive red compliance grade, and tap **Feedback** to show Ananya’s office afternoon snack barrier.
3. **Practitioner Adherence Dashboard (`/practitioner`, ~90s)**:
   - Show the **Client Triage Queue** on the left (demonstrating exception-based scaling to 50–100 clients).
   - Walk through the **Adherence Overview** separating *Logging Completeness* (`26/28`) from *Skipped Meals* (`4`) and *Logging Gaps* (`2`).
   - Show the **7-Day Matrix + Live Today column** (confirming the Today lunch just logged in `/client` is already visible!), toggle `Workdays` vs `Weekend`, click a skipped snack cell to inspect details, and scan the **Outcome Breakdown** & **Dinner Timing Drift** charts.
   - Review the **Adherence Intelligence Summary**, emphasizing the explicit separation between **Observed 7-day data** and **Working hypotheses**.
4. **Closed-Loop Intervention (`/practitioner` → `/client`, ~60s)**:
   - Under **Practitioner Actions**, use the **Portable 4:30 PM snack** preset and click **Send adjustment to Client App** (and optionally flag for follow-up or add a private clinical note).
   - Switch to **Open Client App** (`/client`): show the live update banner at the top of Today’s Plan and the updated 4:30 PM Snack card. Tap **Got it, I’ll try this**, then return to `/practitioner` to confirm Ananya’s acknowledgment appears in the Intervention Log.

---

## Technical Reflection

1. **Most difficult decision**: Designing how adherence is calculated and displayed across two audiences with opposite psychological needs. Clients abandon apps that grade them with harsh compliance scores, while practitioners need quantitative precision. Separating *Check-in Consistency* (celebrated for clients) from *Logged Meal Alignment* and *Logging Gaps* (surfaced clearly for practitioners) resolved that tension cleanly.
2. **What was deliberately left out**: Full authentication, food/calorie lookup databases, free-form real-time chat threads, and meal-plan builders. Those would dilute the core adherence feedback loop without helping evaluate whether the client-practitioner relationship improves.
3. **What I would change before production**: Move state to a server-authoritative database with proper RBAC, add push notification reminders tailored to client meal windows, add optimistic offline queuing in IndexedDB, and write unit/Playwright tests covering the adherence engine and clinical action loop.
4. **What I would build next**: Automated post-adjustment tracking (e.g., comparing 7 days *before* vs. 7 days *after* switching Ananya's 4:30 PM snack to a portable desk option) so practitioners can measure whether their intervention actually worked.
5. **Where AI accelerated development**: Scaffolding cohesive shadcn-style UI primitives, generating realistic domain copy and editorial assets, wiring Recharts responsive charts, and maintaining consistent Tailwind layout ergonomics across mobile and desktop.
6. **Which parts were personally validated and debugged**: Date-window math ensuring any calendar day reliably produces 5 workdays + 2 weekend days matching Ananya's scenario; ensuring missing logs never skew dinner timing charts or skipped counts; and verifying live bidirectional updates between `/client` and `/practitioner` plus error-recovery handling.
