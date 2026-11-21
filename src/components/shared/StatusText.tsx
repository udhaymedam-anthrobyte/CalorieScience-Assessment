import React from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleDot,
  MinusCircle,
} from 'lucide-react';
import type { ExtendedMealState } from '../../types/adherence';
import { STATUS_LABELS } from '../../lib/adherenceEngine';
import { cn } from '../../lib/utils';

interface StatusTextProps {
  status: ExtendedMealState;
  compact?: boolean;
  className?: string;
}

export const STATUS_STYLE_MAP: Record<
  ExtendedMealState,
  { text: string; cellBg: string; cellBorder: string; chartHex: string }
> = {
  followed: {
    text: 'text-emerald-700',
    cellBg: 'bg-emerald-50 hover:bg-emerald-100/80',
    cellBorder: 'border-emerald-200',
    chartHex: '#15803D',
  },
  partial: {
    text: 'text-sky-700',
    cellBg: 'bg-sky-50 hover:bg-sky-100/80',
    cellBorder: 'border-sky-200',
    chartHex: '#0369A1',
  },
  substituted: {
    text: 'text-amber-800',
    cellBg: 'bg-amber-50 hover:bg-amber-100/80',
    cellBorder: 'border-amber-200',
    chartHex: '#D97706',
  },
  skipped: {
    text: 'text-rose-700',
    cellBg: 'bg-rose-50 hover:bg-rose-100/80',
    cellBorder: 'border-rose-200',
    chartHex: '#BE123C',
  },
  missing: {
    text: 'text-slate-500',
    cellBg: 'bg-slate-50 hover:bg-slate-100',
    cellBorder: 'border-dashed border-slate-300',
    chartHex: '#CBD5E1',
  },
  planned: {
    text: 'text-slate-600',
    cellBg: 'bg-white hover:bg-slate-50',
    cellBorder: 'border-slate-200',
    chartHex: '#94A3B8',
  },
};

export const StatusIcon: React.FC<{
  status: ExtendedMealState;
  className?: string;
}> = ({ status, className = 'h-4 w-4 shrink-0' }) => {
  switch (status) {
    case 'followed':
      return <CheckCircle2 className={cn(className, 'text-emerald-700')} aria-hidden="true" />;
    case 'partial':
      return <CircleDot className={cn(className, 'text-sky-700')} aria-hidden="true" />;
    case 'substituted':
      return <ArrowLeftRight className={cn(className, 'text-amber-700')} aria-hidden="true" />;
    case 'skipped':
      return <MinusCircle className={cn(className, 'text-rose-700')} aria-hidden="true" />;
    case 'missing':
      return <CircleDashed className={cn(className, 'text-slate-400')} aria-hidden="true" />;
    case 'planned':
      return <Circle className={cn(className, 'text-slate-400')} aria-hidden="true" />;
  }
};

/**
 * Unboxed semantic status label paired with an explicit icon (zero-pill discipline,
 * never relies on color alone).
 */
export const StatusText: React.FC<StatusTextProps> = ({
  status,
  compact = false,
  className,
}) => {
  const styles = STATUS_STYLE_MAP[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium whitespace-nowrap',
        compact ? 'text-xs' : 'text-sm',
        styles.text,
        className
      )}
    >
      <StatusIcon status={status} className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0'} />
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
};
