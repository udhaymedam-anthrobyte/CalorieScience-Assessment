import React from 'react';
import { Check, CheckCheck, MessageSquareText } from 'lucide-react';
import {
  computeBarrierSummary,
  type DayFilterScope,
  generatePractitionerInsight,
} from '../../lib/adherenceEngine';
import { useCalorieScience } from '../../context/CalorieScienceContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface InsightAndFeedbackPanelProps {
  scope: DayFilterScope;
  onQuickAdjustSnack: () => void;
}

export const InsightAndFeedbackPanel: React.FC<
  InsightAndFeedbackPanelProps
> = ({ scope, onQuickAdjustSnack }) => {
  const { state, acknowledgeFeedback, isSaving } = useCalorieScience();
  const insight = generatePractitionerInsight(state);
  const barriers = computeBarrierSummary(state, scope);

  return (
    <section
      aria-label="Clinical insights and client feedback"
      className="grid grid-cols-1 gap-6 xl:grid-cols-12"
    >
      {/* Left 7 cols: Rules-based Practitioner Insight (Observed vs Working Hypotheses) */}
      <div className="rounded-xl border border-slate-200 bg-white xl:col-span-7">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Adherence intelligence summary
            </h2>
            <span className="text-xs font-medium text-teal-800">
              {insight.attentionTrigger}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Rules-based synthesis generated from the 7-day log window. Observed
            data is strictly separated from working hypotheses.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {/* Block 1: Strictly Observed Information */}
          <div className="p-5">
            <p className="text-xs font-semibold text-slate-900">
              Observed from 7-day logs (factual data)
            </p>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-700">
              {insight.observedFacts.map((fact, idx) => (
                <li key={idx} className="flex gap-2.5">
                  <span className="font-mono text-xs font-medium text-slate-400 pt-0.5 tabular-nums">
                    0{idx + 1}.
                  </span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Block 2: Working Hypotheses (Explicitly labeled as assumptions to verify) */}
          <div className="bg-slate-50/60 p-5">
            <p className="text-xs font-semibold text-slate-900">
              Working hypotheses & discussion prompts (to verify with client)
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              These are non-clinical hypotheses derived from recurring patterns
              and should be confirmed with Ananya before modifying clinical
              targets.
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
              {insight.workingHypotheses.map((hyp, idx) => (
                <li key={idx} className="flex gap-2.5">
                  <span className="text-slate-400" aria-hidden="true">
                    –
                  </span>
                  <span>{hyp}</span>
                </li>
              ))}
            </ul>

            {insight.recommendedActions.length > 0 && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold text-teal-800">
                  Suggested next steps
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  {insight.recommendedActions.map((rec, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-teal-700" aria-hidden="true">
                        →
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onQuickAdjustSnack}
                  >
                    Draft portable 4:30 PM snack adjustment
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right 5 cols: Client Feedback & Top Barriers */}
      <div className="flex flex-col rounded-xl border border-slate-200 bg-white xl:col-span-5">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Client feedback & barriers
            </h2>
            <span className="font-mono text-xs tabular-nums text-slate-500">
              {state.feedback.filter((f) => f.status === 'unreviewed').length}{' '}
              unreviewed
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Comments sent by Ananya alongside recurring meal-level barriers.
          </p>
        </div>

        {/* Client direct comments */}
        <div className="divide-y divide-slate-200">
          {state.feedback.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">
              No direct feedback messages submitted by the client yet.
            </div>
          ) : (
            state.feedback.map((fb) => (
              <div key={fb.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <MessageSquareText
                      className="h-3.5 w-3.5 text-teal-700"
                      aria-hidden="true"
                    />
                    {fb.relatedMealSlotId
                      ? `${fb.relatedMealSlotId.charAt(0).toUpperCase() + fb.relatedMealSlotId.slice(1)} barrier`
                      : 'General feedback'}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums font-normal text-slate-500">
                      {fb.date}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'font-medium',
                      fb.status === 'addressed'
                        ? 'text-emerald-700'
                        : fb.status === 'acknowledged'
                        ? 'text-teal-700'
                        : 'text-amber-800'
                    )}
                  >
                    {fb.status === 'addressed'
                      ? 'Addressed'
                      : fb.status === 'acknowledged'
                      ? 'Acknowledged'
                      : 'Needs review'}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-900">
                  “{fb.message}”
                </p>

                {fb.status !== 'addressed' && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {fb.status === 'unreviewed' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() =>
                          void acknowledgeFeedback(fb.id, 'acknowledged')
                        }
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isSaving}
                      onClick={() =>
                        void acknowledgeFeedback(fb.id, 'addressed')
                      }
                    >
                      <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Mark addressed
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Recurring Meal-Level Barriers */}
        <div className="mt-auto border-t border-slate-200 bg-slate-50/60 p-5">
          <p className="text-xs font-semibold text-slate-900">
            Top barriers tagged across meal logs
          </p>
          {barriers.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              No meal barriers reported in this date filter.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {barriers.slice(0, 4).map((b) => (
                <li
                  key={b.tag}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-slate-800">
                      {b.label}
                    </span>
                    <span className="ml-2 text-slate-500">
                      ({b.mealSlots.join(', ')})
                    </span>
                  </div>
                  <span className="font-mono font-semibold tabular-nums text-slate-700 shrink-0">
                    {b.count}×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
