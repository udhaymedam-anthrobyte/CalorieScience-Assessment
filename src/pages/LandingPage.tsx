import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  LayoutDashboard,
  RotateCcw,
  Smartphone,
  Utensils,
} from 'lucide-react';
import { useCalorieScience } from '../context/CalorieScienceContext';
import { HERO_NUTRITION_IMAGE } from '../data/initialScenario';
import { computeAdherenceOverview } from '../lib/adherenceEngine';
import { AvatarWithFallback } from '../components/shared/AvatarWithFallback';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';

export const LandingPage: React.FC = () => {
  const { state, resetDemoData } = useCalorieScience();
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const overview = computeAdherenceOverview(state, 'all');
  const clientVisibleActionCount = state.practitionerActions.filter(
    (a) => a.visibleToClient
  ).length;

  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            CalorieScience
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#workflow"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Workflow
            </a>
            <a
              href="#scenario"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Active Case
            </a>
            <Link
              to="/client"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Client App
            </Link>
            <Link
              to="/practitioner"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Practitioner
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/practitioner"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-4 text-xs font-medium text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
            >
              Open Practitioner Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16 space-y-16">
        {/* Hero Split */}
        <section className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-xs font-medium text-teal-800">
              Clinical Nutrition Adherence · Connected Prototype
            </p>
            <h1
              className="mt-3 font-display font-bold tracking-tight text-slate-900"
              style={{
                fontSize: 'clamp(2.25rem, 3.8vw, 3.35rem)',
                lineHeight: 1.1,
                textWrap: 'balance',
              }}
            >
              Turn daily meal check-ins into timely clinical adjustments
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
              Creating a nutrition plan is only the start. CalorieScience pairs
              a calm, mobile-first Client Companion App with an exception-driven
              Practitioner Dashboard so barriers like workday lunch swaps and
              missed afternoon snacks lead to practical plan updates—not guilt.
            </p>

            {/* Primary Dual Entry Points */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to="/client"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-medium text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                Open Client App
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/practitioner"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <LayoutDashboard className="h-4 w-4 text-teal-700" aria-hidden="true" />
                Open Practitioner Dashboard
              </Link>
              <PWAInstallButton />
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Both routes read and write the same shared persistence layer.
              Changes sync immediately across tabs or navigation.
            </p>
          </div>

          {/* Editorial Photography Frame */}
          <div className="lg:col-span-6">
            <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {heroImgFailed ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center bg-slate-100 p-8 text-center">
                  <Utensils className="h-8 w-8 text-teal-700" aria-hidden="true" />
                  <p className="mt-3 font-display text-sm font-semibold text-slate-900">
                    Structured Home-Style & Portable Clinical Nutrition
                  </p>
                </div>
              ) : (
                <img
                  src={HERO_NUTRITION_IMAGE}
                  alt="Balanced home-style lentil and paneer meal alongside portable roasted almonds and Greek yogurt"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="h-full min-h-[280px] w-full object-cover"
                />
              )}
            </div>
          </div>
        </section>

        {/* Full-Width 4-Column Live Scenario Telemetry Row */}
        <section
          id="scenario"
          aria-label="Live scenario snapshot for Ananya Rao"
          className="rounded-2xl border border-slate-200 bg-white"
        >
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <AvatarWithFallback
                src={state.client.avatarUrl}
                name={state.client.name}
                size="md"
              />
              <div>
                <p className="text-xs text-slate-500">
                  Live shared scenario · Age {state.client.age} ·{' '}
                  {state.client.occupation} · Week {state.client.currentWeek} of{' '}
                  {state.client.programmeDurationWeeks}
                </p>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  {state.client.name} — {state.client.goal}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={resetDemoData}
              className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap sm:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset 7-day scenario
            </button>
          </div>

          <div className="grid grid-cols-2 divide-y divide-slate-200 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
            <div className="p-5 sm:p-6">
              <p className="text-xs text-slate-500">7-day check-in rate</p>
              <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-slate-900">
                {overview.loggedCount}/{overview.plannedCount}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {overview.loggingGapCount} logging gaps kept separate from skips
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs text-slate-500">Workday lunch swaps</p>
              <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-amber-800">
                {overview.substitutedCount}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Driven by back-to-back 1:00 PM meetings
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs text-slate-500">Afternoon snacks skipped</p>
              <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-rose-700">
                {overview.skippedCount}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Paired with afternoon hunger & prep friction
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs text-slate-500">Practitioner updates synced</p>
              <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-teal-800">
                {clientVisibleActionCount}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {clientVisibleActionCount === 0
                  ? 'Awaiting Dr. Meera’s review & adjustment'
                  : 'Live inside Ananya’s Companion App'}
              </p>
            </div>
          </div>
        </section>

        {/* Mechanism-to-Outcome Closed Loop */}
        <section id="workflow" className="space-y-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              How the adherence feedback loop works
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Try walking through the full loop in under two minutes: log a
              today meal as Ananya, switch to Dr. Meera’s dashboard to review
              the 7-day pattern, then send a portable 4:30 PM snack adjustment
              and watch it update Ananya’s Today’s Plan immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="font-mono text-xs font-medium text-teal-700">01.</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                Low-friction client logging
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Ananya views today’s four meals and records whether each was
                followed, partial, substituted, or skipped—plus timing, hunger,
                and office barriers—without punitive compliance grades.
              </p>
              <Link
                to="/client"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                Explore /client
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="font-mono text-xs font-medium text-teal-700">02.</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                Observed patterns vs hypotheses
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Dr. Meera sees 7-day meal matrices, dinner timing drift, and
                logging gaps separated from skipped meals, paired with a
                rules-based insight distinguishing data from assumptions.
              </p>
              <Link
                to="/practitioner"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                Explore /practitioner
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="font-mono text-xs font-medium text-teal-700">03.</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                Closed-loop plan adjustments
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Practitioner actions—updating the 4:30 PM snack to a portable
                desk option or sending coaching feedback—appear directly inside
                Ananya’s Companion App with confirmation tracking.
              </p>
              <Link
                to="/practitioner"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                Test live intervention
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-display font-semibold text-slate-800">
            CalorieScience · Clinical Nutrition Adherence Prototype
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/client" className="hover:text-slate-900">
              Client Companion (/client)
            </Link>
            <Link to="/practitioner" className="hover:text-slate-900">
              Practitioner Dashboard (/practitioner)
            </Link>
            <button
              type="button"
              onClick={resetDemoData}
              className="hover:text-slate-900 cursor-pointer"
            >
              Reset Demo Data
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
