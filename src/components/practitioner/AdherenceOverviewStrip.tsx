import React from 'react';
import type { AdherenceOverviewMetrics } from '../../lib/adherenceEngine';
import { StatusIcon } from '../shared/StatusText';

interface AdherenceOverviewStripProps {
  metrics: AdherenceOverviewMetrics;
  scopeLabel: string;
}

export const AdherenceOverviewStrip: React.FC<AdherenceOverviewStripProps> = ({
  metrics,
  scopeLabel,
}) => {
  const breakdownItems = [
    {
      label: 'Meals planned',
      value: metrics.plannedCount,
      sub: scopeLabel,
      status: 'planned' as const,
      valueClass: 'text-slate-900',
    },
    {
      label: 'Followed',
      value: metrics.followedCount,
      sub:
        metrics.loggedCount > 0
          ? `${Math.round((metrics.followedCount / metrics.loggedCount) * 100)}% of logged`
          : '0% of logged',
      status: 'followed' as const,
      valueClass: 'text-emerald-700',
    },
    {
      label: 'Partial',
      value: metrics.partialCount,
      sub: 'Partly followed',
      status: 'partial' as const,
      valueClass: 'text-sky-700',
    },
    {
      label: 'Substituted',
      value: metrics.substitutedCount,
      sub: 'Swapped meal',
      status: 'substituted' as const,
      valueClass: 'text-amber-800',
    },
    {
      label: 'Skipped',
      value: metrics.skippedCount,
      sub: 'Reported missed',
      status: 'skipped' as const,
      valueClass: 'text-rose-700',
    },
    {
      label: 'Logging gaps',
      value: metrics.loggingGapCount,
      sub: 'Missing data',
      status: 'missing' as const,
      valueClass: 'text-slate-600',
    },
  ];

  return (
    <section
      aria-label="Adherence overview"
      className="rounded-xl border border-slate-200 bg-white"
    >
      {/* 6-column numeric stat row with hairline dividers (no nested cards) */}
      <div className="grid grid-cols-2 divide-y divide-slate-200 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-y-0">
        {breakdownItems.map((item) => (
          <div key={item.label} className="p-4 sm:p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <StatusIcon status={item.status} className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
            <p
              className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${item.valueClass}`}
            >
              {item.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Contextual separation of Logging Completeness vs Plan Alignment */}
      <div className="grid grid-cols-1 gap-4 border-t border-slate-200 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-600 md:grid-cols-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong className="font-semibold text-slate-900">
              Logging completeness:
            </strong>{' '}
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {metrics.loggedCount}/{metrics.plannedCount} (
              {metrics.loggingCompletenessPct}%)
            </span>
          </span>
          <span className="text-slate-500">
            Missing logs are excluded from skipped counts
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 md:border-l md:border-slate-200 md:pl-4">
          <span>
            <strong className="font-semibold text-slate-900">
              Logged meal alignment:
            </strong>{' '}
            <span className="font-mono font-semibold tabular-nums text-teal-800">
              {metrics.loggedAlignmentPct}%
            </span>{' '}
            <span className="text-slate-500">
              ({metrics.followedOfLoggedPct}% exact match)
            </span>
          </span>
          <span className="text-slate-500">
            Weighted: followed 1.0 · partial 0.6 · swap 0.35
          </span>
        </div>
      </div>
    </section>
  );
};
