import React from 'react';
import {
  Check,
  ChevronRight,
  Clock,
  MessageSquareText,
  Sparkles,
} from 'lucide-react';
import { useCalorieScience } from '../../context/CalorieScienceContext';
import {
  getLogForCell,
  HUNGER_LABELS,
} from '../../lib/adherenceEngine';
import type {
  DayDescriptor,
  ExtendedMealState,
  PlannedMealSlot,
} from '../../types/adherence';
import { Button } from '../ui/button';
import { StatusText } from '../shared/StatusText';
import { cn } from '../../lib/utils';

interface TodayPlanViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenMealLog: (day: DayDescriptor, slot: PlannedMealSlot) => void;
  onGoToFeedback: () => void;
}

export const TodayPlanView: React.FC<TodayPlanViewProps> = ({
  selectedDate,
  onSelectDate,
  onOpenMealLog,
  onGoToFeedback,
}) => {
  const { state, acknowledgePractitionerUpdate, isSaving } =
    useCalorieScience();

  const selectedDay =
    state.days.find((d) => d.date === selectedDate) ??
    state.days[state.days.length - 1];

  const dayLogs = state.mealPlan.map((slot) => ({
    slot,
    log: getLogForCell(state.logs, selectedDay.date, slot.id),
  }));

  const loggedTodayCount = dayLogs.filter((x) => Boolean(x.log)).length;
  const totalSlots = state.mealPlan.length;

  // Surface any unacknowledged practitioner updates (plan adjustments or client-visible feedback)
  const visiblePractitionerUpdates = state.practitionerActions.filter(
    (a) => a.visibleToClient && !a.acknowledgedByClient
  );

  return (
    <div className="space-y-6">
      {/* Date header & 8-day scroller */}
      <section aria-label="Day selector" className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">
              Week {state.client.currentWeek} of{' '}
              {state.client.programmeDurationWeeks} · {state.client.goal}
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-slate-900">
              {selectedDay.isToday
                ? `Today · ${selectedDay.fullLabel}`
                : selectedDay.fullLabel}
            </h1>
          </div>
          <p className="shrink-0 font-mono text-xs tabular-nums text-slate-600">
            {loggedTodayCount}/{totalSlots} checked in
          </p>
        </div>

        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {state.days.map((day) => {
            const active = day.date === selectedDay.date;
            const countForDay = state.mealPlan.filter((s) =>
              Boolean(getLogForCell(state.logs, day.date, s.id))
            ).length;

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(day.date)}
                className={cn(
                  'flex min-h-[58px] min-w-[54px] flex-col items-center justify-center rounded-2xl border px-2.5 py-2 transition-colors duration-150 cursor-pointer shrink-0',
                  active
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    active ? 'text-teal-100' : 'text-slate-500'
                  )}
                >
                  {day.isToday ? 'Today' : day.shortDay}
                </span>
                <span className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                  {day.dateNum}
                </span>
                <span
                  className={cn(
                    'mt-0.5 font-mono text-[10px] tabular-nums',
                    active ? 'text-teal-100' : 'text-slate-400'
                  )}
                >
                  {countForDay}/4
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Incoming practitioner updates banner (visibly reflects Part C actions!) */}
      {visiblePractitionerUpdates.length > 0 && (
        <section
          aria-label="Updates from your nutritionist"
          className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <p className="text-xs font-medium text-teal-800">
                New update from {state.client.practitionerName}
              </p>
              <h2 className="font-display text-base font-semibold text-slate-900">
                {visiblePractitionerUpdates[0].title}
              </h2>
              <p className="text-sm leading-relaxed text-slate-700">
                {visiblePractitionerUpdates[0].body}
              </p>
              {visiblePractitionerUpdates[0].proposedMealDescription && (
                <p className="pt-1 text-sm font-medium text-teal-900">
                  Suggested option:{' '}
                  {visiblePractitionerUpdates[0].proposedMealTitle} —{' '}
                  <span className="font-normal text-slate-700">
                    {visiblePractitionerUpdates[0].proposedMealDescription}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              size="touch"
              variant="default"
              disabled={isSaving}
              onClick={() =>
                void acknowledgePractitionerUpdate(
                  visiblePractitionerUpdates[0].id
                )
              }
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Got it, I’ll try this
            </Button>
            {visiblePractitionerUpdates.length > 1 && (
              <span className="text-xs text-teal-800">
                +{visiblePractitionerUpdates.length - 1} more update in Care Plan
              </span>
            )}
          </div>
        </section>
      )}

      {/* Non-punitive daily check-in strip */}
      <section
        aria-label="Daily check-in progress"
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {loggedTodayCount === totalSlots
                ? 'All meals checked in for this day'
                : `${loggedTodayCount} of ${totalSlots} meals checked in`}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {loggedTodayCount === totalSlots
                ? 'Thank you for logging honestly — your real routine guides the plan.'
                : 'Tap any meal below to log what happened in a few seconds.'}
            </p>
          </div>
          <span className="font-mono text-lg font-semibold tabular-nums text-teal-700">
            {Math.round((loggedTodayCount / totalSlots) * 100)}%
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-700 transition-transform duration-300 origin-left"
            style={{
              transform: `scaleX(${Math.max(0.03, loggedTodayCount / totalSlots)})`,
            }}
          />
        </div>
      </section>

      {/* Meal plan list */}
      <section aria-label="Planned meals" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            {selectedDay.isToday ? 'Today’s meal plan' : `Meals on ${selectedDay.fullLabel}`}
          </h2>
          <span className="text-xs text-slate-500">Tap a meal to check in</span>
        </div>

        <div className="space-y-3">
          {dayLogs.map(({ slot, log }) => {
            const stateKey: ExtendedMealState = log
              ? log.status
              : selectedDay.isToday
              ? 'planned'
              : 'missing';

            const hasAdjustment = Boolean(slot.activeAdjustment);
            const displayTime =
              slot.activeAdjustment?.updatedTime ?? slot.scheduledTime;
            const displayTitle =
              slot.activeAdjustment?.updatedTitle ?? slot.plannedTitle;
            const displayDesc =
              slot.activeAdjustment?.updatedDescription ??
              slot.plannedDescription;

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => onOpenMealLog(selectedDay, slot)}
                className={cn(
                  'group flex w-full flex-col rounded-2xl border bg-white p-4 text-left transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700',
                  hasAdjustment
                    ? 'border-teal-300 hover:border-teal-400'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                )}
              >
                {/* Row top line: Time + Meal label · Status */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-medium tabular-nums text-slate-700">
                      {displayTime}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700">
                      {slot.label}
                    </span>
                    {hasAdjustment && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-medium text-teal-700">
                          <Sparkles className="h-3 w-3" aria-hidden="true" />
                          Updated plan
                        </span>
                      </>
                    )}
                  </div>
                  <StatusText status={stateKey} compact />
                </div>

                {/* Meal title & description */}
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      {displayTitle}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {displayDesc}
                    </p>
                  </div>
                  <ChevronRight
                    className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-slate-600"
                    aria-hidden="true"
                  />
                </div>

                {/* Metadata footer: Planned context OR Actual logged summary */}
                <div className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                  {log ? (
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-700">
                        {log.actualTime && (
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                            <Clock className="h-3 w-3 text-slate-400" aria-hidden="true" />
                            Logged {log.actualTime}
                          </span>
                        )}
                        {log.substitutionText && (
                          <>
                            {log.actualTime && <span aria-hidden="true">·</span>}
                            <span className="font-medium text-amber-800">
                              Had: {log.substitutionText}
                            </span>
                          </>
                        )}
                        {log.hungerLevel && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{HUNGER_LABELS[log.hungerLevel]}</span>
                          </>
                        )}
                      </div>
                      {log.comment && (
                        <p className="line-clamp-1 text-slate-500">
                          “{log.comment}”
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {slot.prepContext} · {slot.proteinEstimate}
                      </span>
                      <span className="font-medium text-teal-700">
                        {selectedDay.isToday ? 'Check in' : 'Add late log'}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick shortcut to share a barrier */}
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">
            Something tricky with today’s timing or prep?
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            Let Dr. Meera know so we can adapt the meal to fit your workday.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="touch"
          onClick={onGoToFeedback}
          className="w-full sm:w-auto"
        >
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
          Share feedback
        </Button>
      </section>
    </div>
  );
};
