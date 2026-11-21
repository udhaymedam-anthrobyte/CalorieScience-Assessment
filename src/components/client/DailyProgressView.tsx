import React from 'react';
import { ArrowRight, CheckCircle2, HeartHandshake } from 'lucide-react';
import { useCalorieScience } from '../../context/CalorieScienceContext';
import {
  computeAdherenceOverview,
  computeMealSlotBreakdowns,
  getLogForCell,
} from '../../lib/adherenceEngine';
import type { ExtendedMealState } from '../../types/adherence';
import { STATUS_STYLE_MAP, StatusIcon } from '../shared/StatusText';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface DailyProgressViewProps {
  selectedDate: string;
  onJumpToDay: (date: string) => void;
  onGoToFeedback: () => void;
}

export const DailyProgressView: React.FC<DailyProgressViewProps> = ({
  selectedDate,
  onJumpToDay,
  onGoToFeedback,
}) => {
  const { state } = useCalorieScience();
  const selectedDay =
    state.days.find((d) => d.date === selectedDate) ??
    state.days[state.days.length - 1];

  const todayLogs = state.mealPlan.map((slot) => ({
    slot,
    log: getLogForCell(state.logs, selectedDay.date, slot.id),
  }));

  const loggedToday = todayLogs.filter((x) => Boolean(x.log)).length;
  const followedToday = todayLogs.filter(
    (x) => x.log?.status === 'followed'
  ).length;
  const adaptedToday = todayLogs.filter(
    (x) => x.log?.status === 'partial' || x.log?.status === 'substituted'
  ).length;
  const skippedToday = todayLogs.filter(
    (x) => x.log?.status === 'skipped'
  ).length;

  const weekly = computeAdherenceOverview(state, 'all');
  const slotBreakdowns = computeMealSlotBreakdowns(state, 'all');
  const strongestSlot = [...slotBreakdowns].sort(
    (a, b) => b.followed - a.followed
  )[0];
  const toughestSlot = [...slotBreakdowns].sort(
    (a, b) => b.skipped + b.substituted - (a.skipped + a.substituted)
  )[0];

  const reviewDays = state.days.filter((d) => !d.isToday);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-500">
          Honest check-ins · Non-judgmental reflection
        </p>
        <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-slate-900">
          Your daily progress
        </h1>
      </div>

      {/* Primary honest-reporting summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-teal-700">
              {selectedDay.isToday ? 'Today’s reflection' : selectedDay.fullLabel}
            </p>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              {loggedToday === 0
                ? 'Ready whenever you are'
                : `${loggedToday} of ${state.mealPlan.length} meals checked in`}
            </h2>
            <p className="text-sm text-slate-600">
              {loggedToday === 0
                ? 'Logging even one meal today keeps your routine visible to your nutritionist.'
                : 'Thanks for checking in honestly. Recording swaps and missed meals helps refine your plan to fit real workdays.'}
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-teal-200 bg-teal-50/70">
            <span className="font-mono text-lg font-semibold tabular-nums text-teal-800">
              {loggedToday}/4
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="font-mono text-xl font-semibold tabular-nums text-emerald-700">
              {followedToday}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">As planned</p>
          </div>
          <div>
            <p className="font-mono text-xl font-semibold tabular-nums text-amber-700">
              {adaptedToday}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">Adapted / swapped</p>
          </div>
          <div>
            <p className="font-mono text-xl font-semibold tabular-nums text-slate-700">
              {skippedToday}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">Skipped</p>
          </div>
        </div>
      </section>

      {/* Supportive 7-day insights (positive anchor first, then barrier without guilt) */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>What’s working well</span>
          </div>
          <p className="mt-2 font-display text-base font-semibold text-slate-900">
            {strongestSlot.label} is your steadiest habit
          </p>
          <p className="mt-1 text-sm text-slate-600">
            You followed {strongestSlot.label.toLowerCase()} on{' '}
            <span className="font-mono font-medium tabular-nums text-slate-900">
              {strongestSlot.followed} of {strongestSlot.planned}
            </span>{' '}
            days and checked in on{' '}
            <span className="font-mono font-medium tabular-nums text-slate-900">
              {weekly.loggedCount} of {weekly.plannedCount}
            </span>{' '}
            meals this week.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-teal-700">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" />
            <span>Where the plan can fit you better</span>
          </div>
          <p className="mt-2 font-display text-base font-semibold text-slate-900">
            {toughestSlot.label} needs a simpler workday option
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {toughestSlot.label} was missed or swapped{' '}
            <span className="font-mono font-medium tabular-nums text-slate-900">
              {toughestSlot.skipped + toughestSlot.substituted}
            </span>{' '}
            times over 7 days. That’s a signal to adjust the plan, not a mark
            against you.
          </p>
        </div>
      </section>

      {/* 7-day visual check-in rhythm */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Last 7 days at a glance
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tap any day to review or update a meal check-in.
            </p>
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-500">
            {weekly.loggedCount}/{weekly.plannedCount} logged
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-medium text-slate-500">
                <th className="py-2 pr-2">Meal</th>
                {reviewDays.map((day) => (
                  <th key={day.date} className="px-1 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onJumpToDay(day.date)}
                      className="rounded-md px-1 py-0.5 hover:bg-slate-100 cursor-pointer"
                    >
                      <span className="block text-[11px] text-slate-600">
                        {day.shortDay.slice(0, 2)}
                      </span>
                      <span className="block font-mono text-[10px] tabular-nums text-slate-400">
                        {day.dateNum}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.mealPlan.map((slot) => (
                <tr key={slot.id}>
                  <td className="py-2.5 pr-2 text-xs font-medium text-slate-700 whitespace-nowrap">
                    {slot.id === 'snack' ? 'Snack' : slot.label}
                  </td>
                  {reviewDays.map((day) => {
                    const log = getLogForCell(state.logs, day.date, slot.id);
                    const cellState: ExtendedMealState = log
                      ? log.status
                      : 'missing';
                    const style = STATUS_STYLE_MAP[cellState];
                    return (
                      <td key={day.date} className="px-1 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => onJumpToDay(day.date)}
                          title={`${day.fullLabel} ${slot.label}: ${cellState}`}
                          className={cn(
                            'mx-auto flex h-9 w-9 items-center justify-center rounded-lg border transition-colors cursor-pointer',
                            style.cellBg,
                            style.cellBorder
                          )}
                        >
                          <StatusIcon status={cellState} className="h-4 w-4" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Plain unboxed legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <StatusIcon status="followed" className="h-3.5 w-3.5" /> Followed
          </span>
          <span className="inline-flex items-center gap-1">
            <StatusIcon status="partial" className="h-3.5 w-3.5" /> Partial
          </span>
          <span className="inline-flex items-center gap-1">
            <StatusIcon status="substituted" className="h-3.5 w-3.5" /> Substituted
          </span>
          <span className="inline-flex items-center gap-1">
            <StatusIcon status="skipped" className="h-3.5 w-3.5" /> Skipped
          </span>
          <span className="inline-flex items-center gap-1">
            <StatusIcon status="missing" className="h-3.5 w-3.5" /> Not logged
          </span>
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="touch"
          onClick={onGoToFeedback}
        >
          Talk to Dr. Meera about barriers
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
