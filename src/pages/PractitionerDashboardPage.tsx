import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Flag,
  Menu,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useCalorieScience } from '../context/CalorieScienceContext';
import { SECONDARY_ROSTER_CLIENTS } from '../data/initialScenario';
import {
  computeAdherenceOverview,
  type DayFilterScope,
} from '../lib/adherenceEngine';
import type { RosterClientSummary } from '../types/adherence';
import { AdherenceOverviewStrip } from '../components/practitioner/AdherenceOverviewStrip';
import { WeeklyPatternSection } from '../components/practitioner/WeeklyPatternSection';
import { InsightAndFeedbackPanel } from '../components/practitioner/InsightAndFeedbackPanel';
import { PractitionerActionsPanel } from '../components/practitioner/PractitionerActionsPanel';
import { AvatarWithFallback } from '../components/shared/AvatarWithFallback';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';

type TriageFilter = 'all' | 'needs_review' | 'followup_flagged';

export const PractitionerDashboardPage: React.FC = () => {
  const {
    state,
    isHydrating,
    isSaving,
    simulateError,
    setSimulateError,
    updateReviewStatus,
    resetDemoData,
  } = useCalorieScience();

  const [selectedClientId, setSelectedClientId] = useState<string>(
    state.client.id
  );
  const [triageFilter, setTriageFilter] = useState<TriageFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dayScope, setDayScope] = useState<DayFilterScope>('all');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [actionTab, setActionTab] = useState<
    'adjust_plan' | 'client_message' | 'internal_note' | 'followup'
  >('adjust_plan');
  const [presetNonce, setPresetNonce] = useState(0);

  const overviewAll = computeAdherenceOverview(state, 'all');
  const overviewScoped = computeAdherenceOverview(state, dayScope);

  const roster: RosterClientSummary[] = useMemo(() => {
    const ananyaUnreviewed = state.feedback.filter(
      (f) => f.status === 'unreviewed'
    ).length;
    const ananyaTriage: RosterClientSummary['triageState'] =
      state.flaggedForFollowUp
        ? 'followup_flagged'
        : state.reviewStatus === 'reviewed'
        ? 'on_track'
        : 'needs_review';

    const ananyaEntry: RosterClientSummary = {
      id: state.client.id,
      name: state.client.name,
      age: state.client.age,
      goalShort: 'Metabolic health & sustainable habits',
      programmeWeek: `Week ${state.client.currentWeek} of ${state.client.programmeDurationWeeks}`,
      triageState: ananyaTriage,
      loggingRate7d: overviewAll.loggingCompletenessPct,
      followedRateOfLogged: overviewAll.loggedAlignmentPct,
      primarySignal:
        state.reviewStatus === 'reviewed'
          ? 'Reviewed · monitoring snack update'
          : 'Workday lunch swaps & skipped 4:30 PM snacks',
      unreviewedFeedbackCount: ananyaUnreviewed,
      isInteractivePrimary: true,
    };

    return [ananyaEntry, ...SECONDARY_ROSTER_CLIENTS];
  }, [state, overviewAll]);

  const filteredRoster = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return roster.filter((c) => {
      if (triageFilter !== 'all' && c.triageState !== triageFilter) {
        return false;
      }
      if (q && !c.name.toLowerCase().includes(q) && !c.primarySignal.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [roster, triageFilter, searchQuery]);

  const activeSecondaryClient =
    selectedClientId !== state.client.id
      ? SECONDARY_ROSTER_CLIENTS.find((c) => c.id === selectedClientId)
      : null;

  const handleQuickAdjustSnack = () => {
    setActionTab('adjust_plan');
    setPresetNonce((n) => n + 1);
    const el = document.getElementById('practitioner-actions-section');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scopeLabel =
    dayScope === 'all'
      ? 'Last 7 days'
      : dayScope === 'workdays'
      ? '5 workdays'
      : '2 weekend days';

  const reviewStatusLabel =
    state.reviewStatus === 'reviewed'
      ? 'Reviewed'
      : state.reviewStatus === 'plan_review_initiated'
      ? 'Plan review initiated'
      : 'Needs review';

  const SidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
        <Link
          to="/"
          className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap"
        >
          CalorieScience
        </Link>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Close caseload sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Caseload Triage Header (demonstrates scaling to 50–100 clients) */}
      <div className="border-b border-slate-200 p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold text-slate-900">
            Client triage queue
          </p>
          <span className="font-mono text-[11px] tabular-nums text-slate-500">
            {roster.filter((c) => c.triageState !== 'on_track').length} need
            attention
          </span>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter caseload..."
            className="min-h-[36px] pl-8 text-xs"
            aria-label="Filter clients"
          />
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'needs_review', label: 'Review' },
              { value: 'followup_flagged', label: 'Flagged' },
            ] as const
          ).map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTriageFilter(f.value)}
              className={cn(
                'rounded-md py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap',
                triageFilter === f.value
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Roster list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredRoster.length === 0 ? (
          <div className="p-4 text-xs text-slate-500">
            No clients match this filter.{' '}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTriageFilter('all');
              }}
              className="font-medium text-teal-700 underline cursor-pointer"
            >
              Clear filter
            </button>
          </div>
        ) : (
          filteredRoster.map((client) => {
            const active = selectedClientId === client.id;
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => {
                  setSelectedClientId(client.id);
                  setMobileSidebarOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-3.5 text-left transition-colors cursor-pointer',
                  active
                    ? 'bg-teal-50/70'
                    : 'bg-white hover:bg-slate-50'
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      'truncate text-sm font-semibold',
                      active ? 'text-teal-900' : 'text-slate-900'
                    )}
                  >
                    {client.name}
                  </p>
                  <span
                    className={cn(
                      'shrink-0 text-[11px] font-medium',
                      client.triageState === 'followup_flagged'
                        ? 'text-amber-800'
                        : client.triageState === 'needs_review'
                        ? 'text-rose-700'
                        : 'text-emerald-700'
                    )}
                  >
                    {client.triageState === 'followup_flagged'
                      ? 'Follow-up'
                      : client.triageState === 'needs_review'
                      ? 'Needs review'
                      : 'On track'}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                  {client.primarySignal}
                </p>
                <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-500">
                  Logged {client.loggingRate7d}% · Aligned{' '}
                  {client.followedRateOfLogged}%
                </p>
              </button>
            );
          })
        )}
      </div>

      {/* Sidebar footer: Practitioner profile & Demo controls */}
      <div className="border-t border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <AvatarWithFallback
            src={state.client.practitionerAvatarUrl}
            name={state.client.practitionerName}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-900">
              {state.client.practitionerName}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {state.client.practitionerCredentials}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setSimulateError(!simulateError)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium cursor-pointer transition-colors',
              simulateError
                ? 'border-rose-300 bg-rose-50 text-rose-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            {simulateError ? 'Error mode: ON' : 'Test error state'}
          </button>
          <button
            type="button"
            onClick={resetDemoData}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Reset demo
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-slate-900 lg:grid lg:grid-cols-[272px_1fr]">
      {/* Desktop Left Sidebar */}
      <aside className="hidden border-r border-slate-200 lg:sticky lg:top-0 lg:block lg:h-dvh">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-[280px] max-w-[85vw] border-r border-slate-200 bg-white shadow-xl">
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main SaaS Viewport */}
      <div className="flex min-w-0 flex-col">
        {/* Top Bar Contract: Breadcrumb on left — 1–2 crisp single-line actions on right */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label="Open client list"
            >
              <Menu className="h-4 w-4" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 text-sm"
            >
              <span className="hidden text-slate-500 sm:inline">Clients</span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <span className="truncate font-display font-semibold text-slate-900">
                {activeSecondaryClient
                  ? activeSecondaryClient.name
                  : state.client.name}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/client"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeftRight
                className="h-3.5 w-3.5 text-teal-700"
                aria-hidden="true"
              />
              Open Client App
            </Link>
            {!activeSecondaryClient && (
              <Button
                type="button"
                size="sm"
                variant={state.reviewStatus === 'reviewed' ? 'secondary' : 'default'}
                disabled={isSaving}
                onClick={() =>
                  void updateReviewStatus(
                    state.reviewStatus === 'reviewed'
                      ? 'needs_review'
                      : 'reviewed'
                  )
                }
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {state.reviewStatus === 'reviewed'
                  ? 'Reviewed'
                  : 'Mark Reviewed'}
              </Button>
            )}
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="mx-auto w-full max-w-[1180px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8">
          {isHydrating ? (
            <div className="space-y-6">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-72 w-full rounded-xl" />
            </div>
          ) : activeSecondaryClient ? (
            /* Caseload Preview State for secondary clients demonstrating 50–100 client scalability */
            <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500">
                    Caseload triage preview · {activeSecondaryClient.programmeWeek}
                  </p>
                  <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
                    {activeSecondaryClient.name}, {activeSecondaryClient.age}
                  </h1>
                </div>
                <span className="text-xs font-medium text-teal-700">
                  {activeSecondaryClient.triageState === 'followup_flagged'
                    ? 'Flagged for follow-up'
                    : activeSecondaryClient.triageState === 'needs_review'
                    ? 'Needs weekly review'
                    : 'On track'}
                </span>
              </div>
              <p className="text-sm text-slate-700">
                <strong>Goal:</strong> {activeSecondaryClient.goalShort}
              </p>
              <p className="text-sm text-slate-600">
                <strong>Primary 7-day signal:</strong>{' '}
                {activeSecondaryClient.primarySignal}
              </p>
              <div className="grid max-w-md grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                <div>
                  <p className="text-xs text-slate-500">7-day logging rate</p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900">
                    {activeSecondaryClient.loggingRate7d}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Logged meal alignment</p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-teal-800">
                    {activeSecondaryClient.followedRateOfLogged}%
                  </p>
                </div>
              </div>
              <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                Summary roster record included to demonstrate exception-based
                triage across a 50–100 client practice. Full interactive 7-day
                logs and live Client Companion sync are active for Ananya Rao.
              </p>
              <div>
                <Button
                  type="button"
                  onClick={() => setSelectedClientId(state.client.id)}
                >
                  Return to Ananya Rao’s active workflow
                </Button>
              </div>
            </section>
          ) : (
            <>
              {/* Client Header Summary */}
              <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <AvatarWithFallback
                    src={state.client.avatarUrl}
                    name={state.client.name}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                      <span>Age {state.client.age}</span>
                      <span aria-hidden="true">·</span>
                      <span>{state.client.occupation}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Week {state.client.currentWeek} of{' '}
                        {state.client.programmeDurationWeeks}
                      </span>
                    </div>
                    <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight text-slate-900">
                      {state.client.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                      Goal: {state.client.goal}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-1 text-xs sm:items-end">
                  <span
                    className={cn(
                      'font-semibold',
                      state.reviewStatus === 'reviewed'
                        ? 'text-emerald-700'
                        : state.reviewStatus === 'plan_review_initiated'
                        ? 'text-teal-700'
                        : 'text-amber-800'
                    )}
                  >
                    Status: {reviewStatusLabel}
                  </span>
                  {state.flaggedForFollowUp && (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-800">
                      <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                      Follow-up due {state.followUpDueDate ?? 'scheduled'}
                    </span>
                  )}
                  <span className="font-mono text-[11px] tabular-nums text-slate-500">
                    Synced{' '}
                    {new Date(state.lastUpdatedAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </section>

              {/* Part B.1 — Client Adherence Overview */}
              <AdherenceOverviewStrip
                metrics={overviewScoped}
                scopeLabel={scopeLabel}
              />

              {/* Part B.2 — Weekly Adherence Pattern Matrix & Charts */}
              <WeeklyPatternSection
                state={state}
                scope={dayScope}
                onScopeChange={setDayScope}
              />

              {/* Part B.3 & B.4 — Practitioner Insight & Client Feedback */}
              <InsightAndFeedbackPanel
                scope={dayScope}
                onQuickAdjustSnack={handleQuickAdjustSnack}
              />

              {/* Part C — Practitioner Action Workflow */}
              <PractitionerActionsPanel
                activeTab={actionTab}
                onTabChange={setActionTab}
                presetNonce={presetNonce}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};
