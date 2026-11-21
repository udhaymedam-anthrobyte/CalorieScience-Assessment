import type {
  BarrierTag,
  CalorieScienceState,
  DayDescriptor,
  ExtendedMealState,
  MealLogEntry,
  MealSlotId,
  PlannedMealSlot,
} from '../types/adherence';

export type DayFilterScope = 'all' | 'workdays' | 'weekend';

export interface AdherenceOverviewMetrics {
  plannedCount: number;
  loggedCount: number;
  loggingGapCount: number;
  loggingCompletenessPct: number;
  followedCount: number;
  partialCount: number;
  substitutedCount: number;
  skippedCount: number;
  /** Weighted alignment among LOGGED meals only (never conflates missing logs with skipped meals) */
  loggedAlignmentPct: number;
  followedOfLoggedPct: number;
}

export interface MealSlotBreakdown {
  slotId: MealSlotId;
  label: string;
  scheduledTime: string;
  planned: number;
  followed: number;
  partial: number;
  substituted: number;
  skipped: number;
  missing: number;
  workdayFollowed: number;
  workdayTotal: number;
  workdayIssues: number; // substituted + skipped on workdays
}

export interface DinnerTimingPoint {
  date: string;
  dayLabel: string;
  isWeekend: boolean;
  scheduledHour: number; // 20.0 = 8:00 PM
  actualHour: number | null;
  actualTimeLabel: string;
  delayMinutes: number | null;
  status: ExtendedMealState;
}

export interface BarrierSummaryItem {
  tag: BarrierTag;
  label: string;
  count: number;
  mealSlots: MealSlotId[];
}

export interface PractitionerInsightSummary {
  attentionLevel: 'high' | 'moderate' | 'low';
  attentionTrigger: string;
  observedFacts: string[];
  workingHypotheses: string[];
  recommendedActions: string[];
}

export const BARRIER_LABELS: Record<BarrierTag, string> = {
  work_meetings: 'Work meetings / schedule',
  no_prep_time: 'No prep or eating time',
  not_portable: 'Not office-portable',
  low_appetite: 'Low appetite',
  late_schedule: 'Late work / commute',
  social_travel: 'Social / travel',
  other: 'Other barrier',
};

export const HUNGER_LABELS: Record<string, string> = {
  very_hungry: 'Very hungry',
  slightly_hungry: 'Slightly hungry',
  comfortably_full: 'Comfortably full',
  overfull: 'Overfull',
};

export const PREP_LABELS: Record<string, string> = {
  easy: 'Easy to manage',
  moderate: 'Moderate effort',
  hard: 'Hard at work',
};

export const STATUS_LABELS: Record<ExtendedMealState, string> = {
  followed: 'Followed',
  partial: 'Partially followed',
  substituted: 'Substituted',
  skipped: 'Skipped',
  missing: 'Not logged',
  planned: 'Planned',
};

export function getLogForCell(
  logs: MealLogEntry[],
  date: string,
  mealSlotId: MealSlotId
): MealLogEntry | undefined {
  return logs.find((l) => l.date === date && l.mealSlotId === mealSlotId);
}

export function getReviewDays(
  days: DayDescriptor[],
  scope: DayFilterScope = 'all'
): DayDescriptor[] {
  const historical = days.filter((d) => !d.isToday);
  if (scope === 'workdays') return historical.filter((d) => !d.isWeekend);
  if (scope === 'weekend') return historical.filter((d) => d.isWeekend);
  return historical;
}

export function computeAdherenceOverview(
  state: CalorieScienceState,
  scope: DayFilterScope = 'all'
): AdherenceOverviewMetrics {
  const targetDays = getReviewDays(state.days, scope);
  const targetDateSet = new Set(targetDays.map((d) => d.date));
  const plannedCount = targetDays.length * state.mealPlan.length;

  let followedCount = 0;
  let partialCount = 0;
  let substitutedCount = 0;
  let skippedCount = 0;

  state.logs.forEach((log) => {
    if (!targetDateSet.has(log.date)) return;
    if (log.status === 'followed') followedCount++;
    else if (log.status === 'partial') partialCount++;
    else if (log.status === 'substituted') substitutedCount++;
    else if (log.status === 'skipped') skippedCount++;
  });

  const loggedCount =
    followedCount + partialCount + substitutedCount + skippedCount;
  const loggingGapCount = Math.max(0, plannedCount - loggedCount);
  const loggingCompletenessPct =
    plannedCount > 0 ? Math.round((loggedCount / plannedCount) * 100) : 0;

  // Weighted alignment on logged meals only:
  // followed = 1.0, partial = 0.6, substituted = 0.35, skipped = 0.0
  // Missing logs are excluded from the denominator so logging gaps are never misrepresented as non-adherence.
  const weightedSum =
    followedCount * 1.0 + partialCount * 0.6 + substitutedCount * 0.35;
  const loggedAlignmentPct =
    loggedCount > 0 ? Math.round((weightedSum / loggedCount) * 100) : 0;
  const followedOfLoggedPct =
    loggedCount > 0 ? Math.round((followedCount / loggedCount) * 100) : 0;

  return {
    plannedCount,
    loggedCount,
    loggingGapCount,
    loggingCompletenessPct,
    followedCount,
    partialCount,
    substitutedCount,
    skippedCount,
    loggedAlignmentPct,
    followedOfLoggedPct,
  };
}

export function computeMealSlotBreakdowns(
  state: CalorieScienceState,
  scope: DayFilterScope = 'all'
): MealSlotBreakdown[] {
  const targetDays = getReviewDays(state.days, scope);

  return state.mealPlan.map((slot: PlannedMealSlot) => {
    let followed = 0;
    let partial = 0;
    let substituted = 0;
    let skipped = 0;
    let missing = 0;
    let workdayFollowed = 0;
    let workdayTotal = 0;
    let workdayIssues = 0;

    targetDays.forEach((day) => {
      const log = getLogForCell(state.logs, day.date, slot.id);
      if (!day.isWeekend) workdayTotal++;

      if (!log) {
        missing++;
        return;
      }

      if (log.status === 'followed') {
        followed++;
        if (!day.isWeekend) workdayFollowed++;
      } else if (log.status === 'partial') {
        partial++;
      } else if (log.status === 'substituted') {
        substituted++;
        if (!day.isWeekend) workdayIssues++;
      } else if (log.status === 'skipped') {
        skipped++;
        if (!day.isWeekend) workdayIssues++;
      }
    });

    return {
      slotId: slot.id,
      label: slot.label,
      scheduledTime: slot.scheduledTime,
      planned: targetDays.length,
      followed,
      partial,
      substituted,
      skipped,
      missing,
      workdayFollowed,
      workdayTotal,
      workdayIssues,
    };
  });
}

export function computeDinnerTimingSeries(
  state: CalorieScienceState,
  scope: DayFilterScope = 'all'
): DinnerTimingPoint[] {
  const targetDays = getReviewDays(state.days, scope);
  const dinnerSlot = state.mealPlan.find((s) => s.id === 'dinner');
  const scheduledMin = dinnerSlot?.scheduledMinutes ?? 1200;

  return targetDays.map((day) => {
    const log = getLogForCell(state.logs, day.date, 'dinner');
    if (!log) {
      return {
        date: day.date,
        dayLabel: `${day.shortDay} ${day.dateNum}`,
        isWeekend: day.isWeekend,
        scheduledHour: Number((scheduledMin / 60).toFixed(2)),
        actualHour: null,
        actualTimeLabel: 'Not logged',
        delayMinutes: null,
        status: 'missing',
      };
    }

    const actualMin = log.actualMinutes ?? scheduledMin;
    return {
      date: day.date,
      dayLabel: `${day.shortDay} ${day.dateNum}`,
      isWeekend: day.isWeekend,
      scheduledHour: Number((scheduledMin / 60).toFixed(2)),
      actualHour: Number((actualMin / 60).toFixed(2)),
      actualTimeLabel: log.actualTime ?? dinnerSlot?.scheduledTime ?? '8:00 PM',
      delayMinutes: actualMin - scheduledMin,
      status: log.status,
    };
  });
}

export function computeBarrierSummary(
  state: CalorieScienceState,
  scope: DayFilterScope = 'all'
): BarrierSummaryItem[] {
  const targetDateSet = new Set(
    getReviewDays(state.days, scope).map((d) => d.date)
  );
  const counts = new Map<BarrierTag, { count: number; slots: Set<MealSlotId> }>();

  state.logs.forEach((log) => {
    if (!targetDateSet.has(log.date)) return;
    log.barrierTags.forEach((tag) => {
      const existing = counts.get(tag) ?? { count: 0, slots: new Set() };
      existing.count++;
      existing.slots.add(log.mealSlotId);
      counts.set(tag, existing);
    });
  });

  return Array.from(counts.entries())
    .map(([tag, info]) => ({
      tag,
      label: BARRIER_LABELS[tag],
      count: info.count,
      mealSlots: Array.from(info.slots),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Deterministic rules-based clinical insight generator.
 * Strictly separates Observed Facts (directly counted from logged entries)
 * from Working Hypotheses (interpretations to explore with the client).
 */
export function generatePractitionerInsight(
  state: CalorieScienceState
): PractitionerInsightSummary {
  const allReviewDays = getReviewDays(state.days, 'all');
  const workdays = getReviewDays(state.days, 'workdays');
  const overview = computeAdherenceOverview(state, 'all');
  const slots = computeMealSlotBreakdowns(state, 'all');
  const dinnerSeries = computeDinnerTimingSeries(state, 'all');

  const breakfast = slots.find((s) => s.slotId === 'breakfast')!;
  const lunch = slots.find((s) => s.slotId === 'lunch')!;
  const snack = slots.find((s) => s.slotId === 'snack')!;

  const workdayDates = new Set(workdays.map((d) => d.date));
  const reviewDates = new Set(allReviewDays.map((d) => d.date));

  const workdayLunchSubs = state.logs.filter(
    (l) =>
      workdayDates.has(l.date) &&
      l.mealSlotId === 'lunch' &&
      l.status === 'substituted'
  ).length;

  const workdaySnackLogs = state.logs.filter(
    (l) => workdayDates.has(l.date) && l.mealSlotId === 'snack'
  );
  const workdaySnackSkips = workdaySnackLogs.filter(
    (l) => l.status === 'skipped'
  );
  const afternoonHungerAfterSkip = workdaySnackSkips.filter(
    (l) =>
      l.hungerLevel === 'very_hungry' || l.hungerLevel === 'slightly_hungry'
  ).length;

  const lateDinners = dinnerSeries.filter(
    (d) => !d.isWeekend && d.delayMinutes !== null && d.delayMinutes >= 45
  );
  const minDelay =
    lateDinners.length > 0
      ? Math.min(...lateDinners.map((d) => d.delayMinutes ?? 0))
      : 0;
  const maxDelay =
    lateDinners.length > 0
      ? Math.max(...lateDinners.map((d) => d.delayMinutes ?? 0))
      : 0;

  const hardPrepLogs = state.logs.filter(
    (l) => reviewDates.has(l.date) && l.prepDifficulty === 'hard'
  ).length;

  const observedFacts: string[] = [];

  observedFacts.push(
    `Breakfast was followed as planned on ${breakfast.followed} of ${breakfast.planned} days${
      breakfast.partial > 0 ? ` (${breakfast.partial} partially followed)` : ''
    }.`
  );

  if (workdayLunchSubs >= 2) {
    observedFacts.push(
      `Lunch was substituted on ${workdayLunchSubs} of ${workdays.length} workdays, while weekend lunches were followed (${lunch.followed - lunch.workdayFollowed} of ${allReviewDays.length - workdays.length}).`
    );
  }

  if (workdaySnackSkips.length >= 2) {
    observedFacts.push(
      `Afternoon snack (4:30 PM) was skipped on ${workdaySnackSkips.length} of ${workdays.length} workdays${
        snack.missing > 0
          ? `, with ${snack.missing} additional day left unlogged (missing data)`
          : ''
      }. Hunger was reported on ${afternoonHungerAfterSkip} of ${workdaySnackSkips.length} skipped-snack afternoons.`
    );
  }

  if (lateDinners.length >= 2) {
    observedFacts.push(
      `Dinner timing drifted ${minDelay}–${maxDelay} minutes past the 8:00 PM target on ${lateDinners.length} logged workdays, compared with on-time weekend dinners.`
    );
  }

  if (overview.loggingGapCount > 0) {
    observedFacts.push(
      `${overview.loggedCount} of ${overview.plannedCount} planned meals (${overview.loggingCompletenessPct}%) were logged over 7 days; ${overview.loggingGapCount} slots have missing logs and are tracked separately from skipped meals.`
    );
  }

  const unreviewedFeedback = state.feedback.filter(
    (f) => f.status === 'unreviewed'
  );
  if (unreviewedFeedback.length > 0) {
    observedFacts.push(
      `Client submitted ${unreviewedFeedback.length} unreviewed barrier note${
        unreviewedFeedback.length > 1 ? 's' : ''
      }, citing limited time to prepare or eat the afternoon meal at work.`
    );
  }

  const workingHypotheses: string[] = [];
  if (workdayLunchSubs >= 2 || workdaySnackSkips.length >= 2) {
    workingHypotheses.push(
      `Workday meeting blocks and preparation effort (${hardPrepLogs} meals rated hard to manage at work) may be the primary friction behind midday substitutions and skipped snacks — rather than low motivation, given strong breakfast and weekend consistency.`
    );
  }
  if (afternoonHungerAfterSkip >= 2 && lateDinners.length >= 2) {
    workingHypotheses.push(
      `Skipping the 4:30 PM protein snack may be contributing to elevated evening hunger and larger late-dinner portions; verify hunger patterns directly with Ananya before making clinical energy adjustments.`
    );
  }
  if (overview.loggingGapCount > 0) {
    workingHypotheses.push(
      `The ${overview.loggingGapCount} unlogged slots should be clarified with the client rather than assumed to be skipped meals.`
    );
  }

  const recommendedActions: string[] = [];
  if (workdaySnackSkips.length >= 2) {
    recommendedActions.push(
      'Replace the 4:30 PM sprouted chaat with a zero-prep, desk-portable protein option (e.g., roasted almonds + Greek yogurt pouch or ready whey/soy sachet).'
    );
  }
  if (workdayLunchSubs >= 2) {
    recommendedActions.push(
      'Create a structured workday cafeteria/order guide so unavoidable lunch swaps still meet protein and fibre targets.'
    );
  }
  if (lateDinners.length >= 2) {
    recommendedActions.push(
      'Discuss shifting the weekday dinner target window to 8:30–9:00 PM to match actual commute reality.'
    );
  }

  const hasHighRiskPattern =
    workdaySnackSkips.length >= 3 ||
    workdayLunchSubs >= 3 ||
    unreviewedFeedback.length > 0;

  return {
    attentionLevel: hasHighRiskPattern
      ? 'high'
      : overview.skippedCount + overview.substitutedCount >= 4
      ? 'moderate'
      : 'low',
    attentionTrigger:
      state.reviewStatus === 'reviewed'
        ? 'Reviewed · Monitoring weekday snack adjustment'
        : hasHighRiskPattern
        ? 'Recurring workday barrier · Unreviewed client feedback'
        : 'Routine weekly check-in',
    observedFacts,
    workingHypotheses,
    recommendedActions,
  };
}

export function formatMinutesTo12h(minutes: number): string {
  const clamped = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(clamped / 60);
  const m = clamped % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function parseTimeInputToMinutes(time24: string): number {
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return 720;
  return h * 60 + m;
}

export function minutesToTimeInput(minutes: number): string {
  const clamped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
