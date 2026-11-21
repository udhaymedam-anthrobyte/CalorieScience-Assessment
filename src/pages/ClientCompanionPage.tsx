import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  CalendarCheck2,
  ClipboardList,
  MessageSquareText,
} from 'lucide-react';
import { useCalorieScience } from '../context/CalorieScienceContext';
import { TodayPlanView } from '../components/client/TodayPlanView';
import { DailyProgressView } from '../components/client/DailyProgressView';
import { ClientFeedbackView } from '../components/client/ClientFeedbackView';
import { MealLogSheet } from '../components/client/MealLogSheet';
import { AvatarWithFallback } from '../components/shared/AvatarWithFallback';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { Skeleton } from '../components/ui/skeleton';
import { getLogForCell } from '../lib/adherenceEngine';
import type { DayDescriptor, PlannedMealSlot } from '../types/adherence';
import { cn } from '../lib/utils';

type ClientTab = 'today' | 'progress' | 'feedback' | 'plan';

export const ClientCompanionPage: React.FC = () => {
  const {
    state,
    isHydrating,
    simulateError,
    setSimulateError,
    resetDemoData,
  } = useCalorieScience();
  const todayDescriptor = state.days[state.days.length - 1];

  const [activeTab, setActiveTab] = useState<ClientTab>('today');
  const [selectedDate, setSelectedDate] = useState<string>(
    todayDescriptor.date
  );
  const [loggingTarget, setLoggingTarget] = useState<{
    day: DayDescriptor;
    slot: PlannedMealSlot;
  } | null>(null);

  const unreadUpdatesCount = state.practitionerActions.filter(
    (a) => a.visibleToClient && !a.acknowledgedByClient
  ).length;

  const navItems: {
    id: ClientTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badgeCount?: number;
  }[] = [
    { id: 'today', label: 'Today', icon: CalendarCheck2 },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    {
      id: 'feedback',
      label: 'Feedback',
      icon: MessageSquareText,
      badgeCount: unreadUpdatesCount,
    },
    { id: 'plan', label: 'Care Plan', icon: ClipboardList },
  ];

  const handleJumpToDay = (date: string) => {
    setSelectedDate(date);
    setActiveTab('today');
  };

  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-slate-900 pb-20 lg:pb-0">
      {/* Compact Top App Bar (<=56px on mobile to honor 15% aggregate sticky cap) */}
      <header className="sticky top-0 z-30 h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            CalorieScience
          </Link>

          <div className="flex items-center gap-3">
            <PWAInstallButton compact className="hidden sm:inline-flex" />
            <Link
              to="/practitioner"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              Practitioner View
            </Link>
          </div>
        </div>
      </header>

      {/* Responsive Workspace: full-width mobile companion expanding into clean 2-column desktop companion */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr_300px] lg:py-8">
        {/* Desktop Left Navigation Rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-22 space-y-6">
            <div className="flex items-center gap-3">
              <AvatarWithFallback
                src={state.client.avatarUrl}
                name={state.client.name}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold text-slate-900">
                  {state.client.name}
                </p>
                <p className="text-xs text-slate-500">
                  Week {state.client.currentWeek} of{' '}
                  {state.client.programmeDurationWeeks}
                </p>
              </div>
            </div>

            <nav aria-label="Companion navigation" className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'flex min-h-[44px] w-full items-center justify-between rounded-xl px-3.5 text-sm font-medium transition-colors cursor-pointer',
                      active
                        ? 'bg-teal-50 text-teal-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {item.badgeCount ? (
                      <span className="font-mono text-xs font-semibold tabular-nums text-teal-700">
                        {item.badgeCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
              <p className="font-medium text-slate-700">Your nutritionist</p>
              <p className="mt-1">{state.client.practitionerName}</p>
              <p>{state.client.practitionerCredentials}</p>
            </div>
          </div>
        </aside>

        {/* Main Active Companion Screen */}
        <main className="min-w-0">
          {isHydrating ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-14 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : activeTab === 'today' ? (
            <TodayPlanView
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onOpenMealLog={(day, slot) => setLoggingTarget({ day, slot })}
              onGoToFeedback={() => setActiveTab('feedback')}
            />
          ) : activeTab === 'progress' ? (
            <DailyProgressView
              selectedDate={selectedDate}
              onJumpToDay={handleJumpToDay}
              onGoToFeedback={() => setActiveTab('feedback')}
            />
          ) : activeTab === 'feedback' ? (
            <ClientFeedbackView />
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs text-slate-500">
                  4-week personalised programme · {state.client.practitionerName}
                </p>
                <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-slate-900">
                  Your care plan
                </h1>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <AvatarWithFallback
                    src={state.client.avatarUrl}
                    name={state.client.name}
                    size="lg"
                  />
                  <div>
                    <h2 className="font-display text-base font-semibold text-slate-900">
                      {state.client.name}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Age {state.client.age} · {state.client.occupation}
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 text-sm text-slate-700">
                  <p className="text-xs font-medium text-slate-500">
                    Programme focus
                  </p>
                  <p className="mt-1">{state.client.goal}</p>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Daily meal framework
                </h2>
                <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
                  {state.mealPlan.map((slot) => (
                    <div key={slot.id} className="p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-display text-sm font-semibold text-slate-900">
                          {slot.label} —{' '}
                          {slot.activeAdjustment?.updatedTitle ??
                            slot.plannedTitle}
                        </p>
                        <span className="font-mono text-xs tabular-nums text-slate-500">
                          {slot.activeAdjustment?.updatedTime ??
                            slot.scheduledTime}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {slot.activeAdjustment?.updatedDescription ??
                          slot.plannedDescription}
                      </p>
                      {slot.activeAdjustment && (
                        <p className="mt-2 text-xs font-medium text-teal-700">
                          Adjusted by {state.client.practitionerName}: “
                          {slot.activeAdjustment.practitionerNote}”
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <p className="text-xs font-medium text-slate-500">
                  App & prototype controls
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  Install CalorieScience on your home screen, test sync error
                  recovery, or reset Ananya’s 7-day dataset.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <PWAInstallButton compact />
                  <button
                    type="button"
                    onClick={() => setSimulateError(!simulateError)}
                    className={cn(
                      'min-h-[38px] rounded-lg border px-3 text-xs font-medium cursor-pointer transition-colors',
                      simulateError
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {simulateError ? 'Error simulation: ON' : 'Test sync error'}
                  </button>
                  <button
                    type="button"
                    onClick={resetDemoData}
                    className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Reset 7-day demo
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>

        {/* Desktop Right Contextual Care Summary (prevents desert-island layout on 1440px) */}
        <aside className="hidden lg:block">
          <div className="sticky top-22 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Care team</p>
              <div className="mt-3 flex items-center gap-3">
                <AvatarWithFallback
                  src={state.client.practitionerAvatarUrl}
                  name={state.client.practitionerName}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-slate-900">
                    {state.client.practitionerName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {state.client.practitionerCredentials}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Your meal check-ins and notes sync live to Dr. Meera’s adherence
                dashboard so she can adjust timing and portability around your
                workday.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">
                Why honest logging matters
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Skipped snacks or swapped office lunches are never graded as
                failures. They show which meals need simpler zero-prep options.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (<=64px height) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden pb-safe"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'relative flex min-h-[48px] flex-col items-center justify-center gap-1 transition-colors cursor-pointer',
                  active ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-medium tracking-tight">
                  {item.label}
                </span>
                {item.badgeCount ? (
                  <span
                    aria-label={`${item.badgeCount} new updates`}
                    className="absolute top-1.5 right-4 font-mono text-[10px] font-semibold text-teal-700"
                  >
                    ({item.badgeCount})
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Meal Logging Bottom Sheet / Drawer */}
      {loggingTarget && (
        <MealLogSheet
          open={Boolean(loggingTarget)}
          day={loggingTarget.day}
          slot={loggingTarget.slot}
          existingLog={getLogForCell(
            state.logs,
            loggingTarget.day.date,
            loggingTarget.slot.id
          )}
          onClose={() => setLoggingTarget(null)}
        />
      )}
    </div>
  );
};
