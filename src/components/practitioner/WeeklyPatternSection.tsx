import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Clock, X } from 'lucide-react';
import {
  BARRIER_LABELS,
  computeDinnerTimingSeries,
  computeMealSlotBreakdowns,
  type DayFilterScope,
  getLogForCell,
  getReviewDays,
  HUNGER_LABELS,
  PREP_LABELS,
} from '../../lib/adherenceEngine';
import type {
  CalorieScienceState,
  ExtendedMealState,
  MealSlotId,
} from '../../types/adherence';
import {
  STATUS_STYLE_MAP,
  StatusIcon,
  StatusText,
} from '../shared/StatusText';
import { cn } from '../../lib/utils';

interface WeeklyPatternSectionProps {
  state: CalorieScienceState;
  scope: DayFilterScope;
  onScopeChange: (scope: DayFilterScope) => void;
}

function formatHourTick(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export const WeeklyPatternSection: React.FC<WeeklyPatternSectionProps> = ({
  state,
  scope,
  onScopeChange,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    slotId: MealSlotId;
  } | null>(null);

  const days = getReviewDays(state.days, scope);
  const todayDay = state.days.find((d) => d.isToday);
  const slotBreakdowns = computeMealSlotBreakdowns(state, scope);
  const dinnerSeries = computeDinnerTimingSeries(state, scope);

  const selectedDayObj = selectedCell
    ? state.days.find((d) => d.date === selectedCell.date)
    : undefined;
  const selectedSlotObj = selectedCell
    ? state.mealPlan.find((s) => s.id === selectedCell.slotId)
    : undefined;
  const selectedLog = selectedCell
    ? getLogForCell(state.logs, selectedCell.date, selectedCell.slotId)
    : undefined;

  const dinnerBarData = dinnerSeries.map((pt) => ({
    ...pt,
    displayHour: pt.actualHour ?? 0,
    isMissing: pt.actualHour === null,
  }));

  return (
    <section
      aria-label="Weekly adherence patterns"
      className="space-y-6"
    >
      {/* Matrix Container */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              7-day adherence matrix & live today check-ins
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Compare planned slots against actual logged behaviour. Click any
              cell to inspect timing, swaps, or hunger context.
            </p>
          </div>

          {/* Interactive Scope Segmented Filter */}
          <div
            role="group"
            aria-label="Day scope filter"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 self-start sm:self-auto"
          >
            {(
              [
                { value: 'all', label: 'All 7 days' },
                { value: 'workdays', label: 'Workdays' },
                { value: 'weekend', label: 'Weekend' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onScopeChange(opt.value);
                  setSelectedCell(null);
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                  scope === opt.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="overflow-x-auto px-5 py-4">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                <th className="w-[185px] pb-3 pr-4">Planned meal slot</th>
                {days.map((day) => (
                  <th key={day.date} className="px-1.5 pb-3 text-center">
                    <span className="block font-medium text-slate-700">
                      {day.shortDay}
                    </span>
                    <span className="block font-mono text-[11px] tabular-nums text-slate-400">
                      {day.dateNum}
                      {day.isWeekend ? ' · Wknd' : ''}
                    </span>
                  </th>
                ))}
                {todayDay && (
                  <th className="border-l border-slate-200 pl-3 pr-1.5 pb-3 text-center">
                    <span className="block font-semibold text-teal-800">
                      Today
                    </span>
                    <span className="block font-mono text-[11px] tabular-nums text-teal-700/80">
                      Live
                    </span>
                  </th>
                )}
                <th className="w-[96px] pb-3 pl-3 text-right">7d Followed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.mealPlan.map((slot) => {
                const summary = slotBreakdowns.find(
                  (b) => b.slotId === slot.id
                );
                const todayLog = todayDay
                  ? getLogForCell(state.logs, todayDay.date, slot.id)
                  : undefined;
                const todayStatus: ExtendedMealState = todayLog
                  ? todayLog.status
                  : 'planned';
                const todayStyle = STATUS_STYLE_MAP[todayStatus];
                const isTodaySelected =
                  Boolean(todayDay) &&
                  selectedCell?.date === todayDay?.date &&
                  selectedCell?.slotId === slot.id;

                return (
                  <tr key={slot.id} className="hover:bg-slate-50/40">
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium text-slate-900">
                        {slot.label}
                      </p>
                      <p className="font-mono text-xs tabular-nums text-slate-500">
                        {slot.activeAdjustment?.updatedTime ??
                          slot.scheduledTime}
                      </p>
                    </td>
                    {days.map((day) => {
                      const log = getLogForCell(state.logs, day.date, slot.id);
                      const status: ExtendedMealState = log
                        ? log.status
                        : 'missing';
                      const style = STATUS_STYLE_MAP[status];
                      const isSelected =
                        selectedCell?.date === day.date &&
                        selectedCell?.slotId === slot.id;
                      const delayMin =
                        log?.actualMinutes !== undefined
                          ? log.actualMinutes - slot.scheduledMinutes
                          : null;

                      return (
                        <td key={day.date} className="px-1.5 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCell(
                                isSelected
                                  ? null
                                  : { date: day.date, slotId: slot.id }
                              )
                            }
                            className={cn(
                              'mx-auto flex h-12 w-full min-w-[64px] flex-col items-center justify-center rounded-lg border px-1.5 transition-colors cursor-pointer',
                              style.cellBg,
                              style.cellBorder,
                              isSelected && 'ring-2 ring-teal-700 ring-offset-1'
                            )}
                          >
                            <StatusIcon status={status} className="h-4 w-4" />
                            <span className="mt-0.5 font-mono text-[10px] tabular-nums text-slate-600">
                              {status === 'missing'
                                ? 'No log'
                                : status === 'skipped'
                                ? 'Skipped'
                                : delayMin !== null && delayMin >= 45
                                ? `+${delayMin}m`
                                : log?.actualTime
                                ? log.actualTime.replace(':00 ', '')
                                : status}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                    {todayDay && (
                      <td className="border-l border-slate-200 pl-3 pr-1.5 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCell(
                              isTodaySelected
                                ? null
                                : { date: todayDay.date, slotId: slot.id }
                            )
                          }
                          className={cn(
                            'mx-auto flex h-12 w-full min-w-[68px] flex-col items-center justify-center rounded-lg border px-1.5 transition-colors cursor-pointer',
                            todayStyle.cellBg,
                            todayStyle.cellBorder,
                            isTodaySelected && 'ring-2 ring-teal-700 ring-offset-1'
                          )}
                        >
                          <StatusIcon status={todayStatus} className="h-4 w-4" />
                          <span className="mt-0.5 font-mono text-[10px] tabular-nums text-slate-600">
                            {todayStatus === 'planned'
                              ? 'Pending'
                              : todayStatus === 'skipped'
                              ? 'Skipped'
                              : todayLog?.actualTime
                              ? todayLog.actualTime.replace(':00 ', '')
                              : todayStatus}
                          </span>
                        </button>
                      </td>
                    )}
                    <td className="py-3 pl-3 text-right font-mono text-sm font-medium tabular-nums text-slate-800">
                      {summary
                        ? `${summary.followed}/${summary.planned}`
                        : '0/0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Inline cell inspection panel (only shown when practitioner clicks a cell) */}
        {selectedCell && selectedDayObj && selectedSlotObj && (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-900">
                    {selectedDayObj.fullLabel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {selectedSlotObj.label} (Planned{' '}
                    <span className="font-mono tabular-nums">
                      {selectedSlotObj.scheduledTime}
                    </span>
                    )
                  </span>
                  <span aria-hidden="true">·</span>
                  <StatusText
                    status={
                      selectedLog
                        ? selectedLog.status
                        : selectedDayObj.isToday
                        ? 'planned'
                        : 'missing'
                    }
                    compact
                  />
                </div>
                <p className="text-sm font-medium text-slate-900">
                  {selectedSlotObj.activeAdjustment ? 'Active plan' : 'Planned'}:{' '}
                  {selectedSlotObj.activeAdjustment?.updatedTitle ??
                    selectedSlotObj.plannedTitle}{' '}
                  —{' '}
                  <span className="font-normal text-slate-600">
                    {selectedSlotObj.activeAdjustment?.updatedDescription ??
                      selectedSlotObj.plannedDescription}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 cursor-pointer"
                aria-label="Close entry detail"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedLog ? (
              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-200/80 pt-3 text-xs text-slate-700 sm:grid-cols-3">
                <div>
                  <p className="font-medium text-slate-500">Actual behaviour</p>
                  <p className="mt-1">
                    {selectedLog.substitutionText
                      ? `Substituted with: ${selectedLog.substitutionText}`
                      : selectedLog.status === 'skipped'
                      ? 'Client reported skipping this meal.'
                      : selectedLog.actualTime
                      ? `Eaten at ${selectedLog.actualTime}`
                      : 'Logged as recorded.'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-500">
                    Satiety & prep context
                  </p>
                  <p className="mt-1">
                    {selectedLog.hungerLevel
                      ? HUNGER_LABELS[selectedLog.hungerLevel]
                      : 'No hunger rating'}
                    {' · '}
                    {selectedLog.prepDifficulty
                      ? PREP_LABELS[selectedLog.prepDifficulty]
                      : 'No prep rating'}
                  </p>
                  {selectedLog.barrierTags.length > 0 && (
                    <p className="mt-1 text-slate-600">
                      Barriers:{' '}
                      {selectedLog.barrierTags
                        .map((b) => BARRIER_LABELS[b])
                        .join(', ')}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-500">Client note</p>
                  <p className="mt-1 text-slate-800">
                    {selectedLog.comment
                      ? `“${selectedLog.comment}”`
                      : 'No additional note provided.'}
                  </p>
                </div>
              </div>
            ) : selectedDayObj.isToday ? (
              <p className="mt-3 border-t border-slate-200/80 pt-3 text-xs text-slate-600">
                Scheduled for today — Ananya has not checked in for this meal
                yet. As soon as she logs it in /client, it will update here
                live.
              </p>
            ) : (
              <p className="mt-3 border-t border-slate-200/80 pt-3 text-xs text-slate-600">
                No check-in was recorded for this slot (logging gap). Do not
                assume this meal was skipped — verify during check-in.
              </p>
            )}
          </div>
        )}

        {/* Matrix Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 px-5 py-3 text-xs text-slate-600">
          <StatusText status="followed" compact />
          <StatusText status="partial" compact />
          <StatusText status="substituted" compact />
          <StatusText status="skipped" compact />
          <StatusText status="missing" compact />
          <span className="ml-auto hidden font-mono text-[11px] text-slate-500 sm:inline">
            +Xm indicates minutes eaten past scheduled target
          </span>
        </div>
      </div>

      {/* Two Contextual Recharts Analytics Panels */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Chart 1: Outcome Breakdown by Meal Slot */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Outcome distribution by meal slot
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Isolates which specific meal times drive substitutions, skips, and
              logging gaps.
            </p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={slotBreakdowns}
                margin={{ top: 8, right: 8, left: -20, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="followed"
                  name="Followed"
                  stackId="a"
                  fill="#15803D"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="partial"
                  name="Partial"
                  stackId="a"
                  fill="#0369A1"
                />
                <Bar
                  dataKey="substituted"
                  name="Substituted"
                  stackId="a"
                  fill="#D97706"
                />
                <Bar
                  dataKey="skipped"
                  name="Skipped"
                  stackId="a"
                  fill="#BE123C"
                />
                <Bar
                  dataKey="missing"
                  name="Missing log"
                  stackId="a"
                  fill="#CBD5E1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Dinner Timing Variance vs 8:00 PM Target */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Dinner timing drift vs 8:00 PM target
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Actual logged dinner hour across days. Missing logs are omitted
                rather than plotted as zero.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 whitespace-nowrap shrink-0">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Target 8:00 PM
            </span>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dinnerBarData}
                margin={{ top: 8, right: 12, left: -6, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[19, 23]}
                  ticks={[19, 20, 21, 22, 23]}
                  tickFormatter={(v) => formatHourTick(Number(v))}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(_val, _name, item) => {
                    const p = item?.payload as
                      | (typeof dinnerBarData)[number]
                      | undefined;
                    if (!p || p.isMissing) return ['Not logged', 'Dinner'];
                    const delayStr =
                      p.delayMinutes !== null && p.delayMinutes > 0
                        ? ` (+${p.delayMinutes} min)`
                        : '';
                    return [`${p.actualTimeLabel}${delayStr}`, 'Logged time'];
                  }}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={20}
                  stroke="#0F766E"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Bar dataKey="actualHour" radius={[5, 5, 0, 0]} maxBarSize={34}>
                  {dinnerBarData.map((entry) => (
                    <Cell
                      key={entry.date}
                      fill={
                        entry.actualHour === null
                          ? 'transparent'
                          : (entry.delayMinutes ?? 0) >= 60
                          ? '#D97706'
                          : '#0F766E'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};
