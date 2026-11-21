import React, { useEffect, useState } from 'react';
import { Clock, RotateCcw, X } from 'lucide-react';
import {
  BARRIER_LABELS,
  formatMinutesTo12h,
  HUNGER_LABELS,
  minutesToTimeInput,
  parseTimeInputToMinutes,
  PREP_LABELS,
} from '../../lib/adherenceEngine';
import type {
  BarrierTag,
  DayDescriptor,
  HungerLevel,
  MealLogEntry,
  MealLogStatus,
  PlannedMealSlot,
  PrepDifficulty,
} from '../../types/adherence';
import { useCalorieScience } from '../../context/CalorieScienceContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { StatusIcon } from '../shared/StatusText';
import { cn } from '../../lib/utils';

interface MealLogSheetProps {
  open: boolean;
  day: DayDescriptor;
  slot: PlannedMealSlot;
  existingLog?: MealLogEntry;
  onClose: () => void;
}

const STATUS_OPTIONS: {
  value: MealLogStatus;
  title: string;
  hint: string;
}[] = [
  {
    value: 'followed',
    title: 'Followed as planned',
    hint: 'Ate close to the planned meal',
  },
  {
    value: 'partial',
    title: 'Partially followed',
    hint: 'Had part of the meal or adjusted portion',
  },
  {
    value: 'substituted',
    title: 'Substituted',
    hint: 'Had something different instead',
  },
  {
    value: 'skipped',
    title: 'Skipped',
    hint: 'Missed this meal completely',
  },
];

const QUICK_SUBSTITUTIONS = [
  'Office cafeteria meal',
  'Ordered wrap / rice bowl',
  'Coffee & biscuits',
  'Roasted nuts / fruit',
];

const QUICK_BARRIERS: BarrierTag[] = [
  'work_meetings',
  'no_prep_time',
  'not_portable',
  'late_schedule',
  'low_appetite',
  'social_travel',
];

const HUNGER_OPTIONS: HungerLevel[] = [
  'very_hungry',
  'slightly_hungry',
  'comfortably_full',
  'overfull',
];

const PREP_OPTIONS: PrepDifficulty[] = ['easy', 'moderate', 'hard'];

export const MealLogSheet: React.FC<MealLogSheetProps> = ({
  open,
  day,
  slot,
  existingLog,
  onClose,
}) => {
  const { upsertMealLog, clearMealLog, isSaving, lastError, clearError } =
    useCalorieScience();

  const [status, setStatus] = useState<MealLogStatus>('followed');
  const [actualTime24, setActualTime24] = useState<string>(
    minutesToTimeInput(slot.scheduledMinutes)
  );
  const [substitutionText, setSubstitutionText] = useState('');
  const [barrierTags, setBarrierTags] = useState<BarrierTag[]>([]);
  const [hungerLevel, setHungerLevel] = useState<HungerLevel | undefined>(
    'comfortably_full'
  );
  const [prepDifficulty, setPrepDifficulty] = useState<
    PrepDifficulty | undefined
  >('easy');
  const [comment, setComment] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    clearError();
    setValidationError(null);
    if (existingLog) {
      setStatus(existingLog.status);
      setActualTime24(
        minutesToTimeInput(existingLog.actualMinutes ?? slot.scheduledMinutes)
      );
      setSubstitutionText(existingLog.substitutionText ?? '');
      setBarrierTags(existingLog.barrierTags ?? []);
      setHungerLevel(existingLog.hungerLevel);
      setPrepDifficulty(existingLog.prepDifficulty);
      setComment(existingLog.comment ?? '');
    } else {
      setStatus('followed');
      setActualTime24(minutesToTimeInput(slot.scheduledMinutes));
      setSubstitutionText('');
      setBarrierTags([]);
      setHungerLevel('comfortably_full');
      setPrepDifficulty('easy');
      setComment('');
    }
  }, [open, existingLog, slot.scheduledMinutes, clearError]);

  if (!open) return null;

  const toggleBarrier = (tag: BarrierTag) => {
    setBarrierTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleStatusSelect = (next: MealLogStatus) => {
    setStatus(next);
    setValidationError(null);
    if (next === 'skipped') {
      setHungerLevel((prev) =>
        prev === 'comfortably_full' || !prev ? 'slightly_hungry' : prev
      );
      setPrepDifficulty('hard');
    } else if (next === 'followed') {
      setBarrierTags([]);
      setHungerLevel('comfortably_full');
      setPrepDifficulty('easy');
    }
  };

  const handleSave = async () => {
    if (status === 'substituted' && !substitutionText.trim()) {
      setValidationError(
        'Please share briefly what you had instead so your nutritionist can understand your routine.'
      );
      return;
    }

    const actualMinutes =
      status === 'skipped' ? undefined : parseTimeInputToMinutes(actualTime24);
    const actualTime =
      actualMinutes !== undefined
        ? formatMinutesTo12h(actualMinutes)
        : undefined;

    const ok = await upsertMealLog({
      date: day.date,
      mealSlotId: slot.id,
      status,
      actualTime,
      actualMinutes,
      substitutionText:
        status === 'substituted' ? substitutionText.trim() : undefined,
      barrierTags: status === 'followed' ? [] : barrierTags,
      hungerLevel,
      prepDifficulty,
      comment: comment.trim() || undefined,
    });

    if (ok) {
      onClose();
    }
  };

  const handleClear = async () => {
    const ok = await clearMealLog(day.date, slot.id);
    if (ok) onClose();
  };

  const activeTitle = slot.activeAdjustment
    ? slot.activeAdjustment.updatedTitle
    : slot.plannedTitle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-xs md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-log-sheet-title"
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-slate-200 bg-white shadow-xl md:max-w-lg md:rounded-2xl">
        {/* Grab handle on mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1.5 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 pt-3 pb-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">
              {day.isToday ? 'Today' : day.fullLabel} · Planned{' '}
              <span className="font-mono tabular-nums">
                {slot.activeAdjustment?.updatedTime ?? slot.scheduledTime}
              </span>
            </p>
            <h2
              id="meal-log-sheet-title"
              className="mt-0.5 font-display text-lg font-semibold text-slate-900"
            >
              {slot.label}: {activeTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close meal check-in"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <p className="text-sm text-slate-600">
            Every honest check-in helps Dr. Meera shape your plan around your real
            schedule — swaps and skips are useful data, never a failure.
          </p>

          {lastError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {lastError}
            </div>
          )}

          {/* 4 core adherence options */}
          <div>
            <p className="mb-2.5 text-sm font-medium text-slate-900">
              How did this meal go?
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STATUS_OPTIONS.map((opt) => {
                const selected = status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusSelect(opt.value)}
                    className={cn(
                      'flex min-h-[56px] items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors duration-150 cursor-pointer',
                      selected
                        ? 'border-teal-700 bg-teal-50/60 ring-1 ring-teal-700'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <StatusIcon
                      status={opt.value}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {opt.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{opt.hint}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Substitution detail when substituted */}
          {status === 'substituted' && (
            <div className="space-y-2.5">
              <label
                htmlFor="substitution-input"
                className="block text-sm font-medium text-slate-900"
              >
                What did you have instead?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUBSTITUTIONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSubstitutionText(preset);
                      setValidationError(null);
                    }}
                    className={cn(
                      'min-h-[36px] rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                      substitutionText === preset
                        ? 'border-teal-700 bg-teal-700 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Input
                id="substitution-input"
                value={substitutionText}
                onChange={(e) => {
                  setSubstitutionText(e.target.value);
                  setValidationError(null);
                }}
                placeholder="e.g. Office cafeteria pasta, ordered wrap, or quick snack"
              />
              {validationError && (
                <p className="text-xs font-medium text-rose-700">
                  {validationError}
                </p>
              )}
            </div>
          )}

          {/* Barriers when not fully followed */}
          {status !== 'followed' && (
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-slate-900">
                What got in the way? <span className="font-normal text-slate-500">(optional)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_BARRIERS.map((tag) => {
                  const active = barrierTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleBarrier(tag)}
                      className={cn(
                        'min-h-[40px] rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                        active
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {BARRIER_LABELS[tag]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actual time (unless skipped) */}
          {status !== 'skipped' && (
            <div className="space-y-2">
              <label
                htmlFor="actual-time-input"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-900"
              >
                <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                When did you eat?
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="actual-time-input"
                  type="time"
                  value={actualTime24}
                  onChange={(e) => setActualTime24(e.target.value)}
                  className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm tabular-nums text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                />
                <button
                  type="button"
                  onClick={() =>
                    setActualTime24(minutesToTimeInput(slot.scheduledMinutes))
                  }
                  className="min-h-[40px] rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  On time ({slot.scheduledTime})
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActualTime24(
                      minutesToTimeInput(slot.scheduledMinutes + 60)
                    )
                  }
                  className="min-h-[40px] rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  +1 hr late
                </button>
              </div>
            </div>
          )}

          {/* Hunger / satiety feedback */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">
              {status === 'skipped'
                ? 'How hungry did you feel around this time?'
                : 'How did you feel afterward?'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {HUNGER_OPTIONS.map((level) => {
                const active = hungerLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setHungerLevel(level)}
                    className={cn(
                      'min-h-[42px] rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {HUNGER_LABELS[level]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prep difficulty */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">
              Preparation / access difficulty
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PREP_OPTIONS.map((diff) => {
                const active = prepDifficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setPrepDifficulty(diff)}
                    className={cn(
                      'min-h-[42px] rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer',
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {PREP_LABELS[diff]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional note */}
          <div className="space-y-2">
            <label
              htmlFor="meal-note-input"
              className="block text-sm font-medium text-slate-900"
            >
              Optional note for your nutritionist
            </label>
            <Textarea
              id="meal-note-input"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                status === 'partial'
                  ? 'e.g. Had dal and rice, skipped sabzi or ate a smaller portion...'
                  : status === 'skipped'
                  ? 'e.g. Back-to-back calls between 4–6 PM, no time to step away...'
                  : 'Any quick context about timing, hunger, or office schedule...'
              }
              className="min-h-[72px]"
            />
          </div>
        </div>

        {/* Sticky bottom CTA */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 pb-safe md:rounded-b-2xl">
          {existingLog ? (
            <Button
              type="button"
              variant="ghost"
              size="touch"
              onClick={() => void handleClear()}
              disabled={isSaving}
              className="text-slate-600"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Clear log
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="touch"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="touch"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex-1 md:flex-initial md:min-w-[160px]"
          >
            {isSaving ? 'Saving...' : existingLog ? 'Update check-in' : 'Save check-in'}
          </Button>
        </div>
      </div>
    </div>
  );
};
