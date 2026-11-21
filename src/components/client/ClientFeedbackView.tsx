import React, { useState } from 'react';
import { Check, Send } from 'lucide-react';
import { useCalorieScience } from '../../context/CalorieScienceContext';
import type { FeedbackTopic, MealSlotId } from '../../types/adherence';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { AvatarWithFallback } from '../shared/AvatarWithFallback';
import { cn } from '../../lib/utils';

const TOPIC_OPTIONS: { value: FeedbackTopic; label: string }[] = [
  { value: 'afternoon_barrier', label: 'Afternoon barrier' },
  { value: 'meal_timing', label: 'Meal timing' },
  { value: 'prep_difficulty', label: 'Prep difficulty' },
  { value: 'hunger_satiety', label: 'Hunger & fullness' },
  { value: 'general', label: 'General note' },
];

const SLOT_OPTIONS: { value: MealSlotId | 'none'; label: string }[] = [
  { value: 'snack', label: '4:30 PM Snack' },
  { value: 'lunch', label: '1:00 PM Lunch' },
  { value: 'dinner', label: '8:00 PM Dinner' },
  { value: 'breakfast', label: '8:00 AM Breakfast' },
  { value: 'none', label: 'Overall plan' },
];

export const ClientFeedbackView: React.FC = () => {
  const {
    state,
    submitClientFeedback,
    acknowledgePractitionerUpdate,
    isSaving,
    lastError,
  } = useCalorieScience();

  const [topic, setTopic] = useState<FeedbackTopic>('afternoon_barrier');
  const [mealSlot, setMealSlot] = useState<MealSlotId | 'none'>('snack');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const clientVisibleUpdates = state.practitionerActions.filter(
    (a) => a.visibleToClient
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      setErrorMsg('Please share a short note (at least a few words) before sending.');
      return;
    }
    setErrorMsg(null);
    const ok = await submitClientFeedback({
      topic,
      relatedMealSlotId: mealSlot === 'none' ? undefined : mealSlot,
      message,
    });
    if (ok) {
      setMessage('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-500">
          Direct line to {state.client.practitionerName} ·{' '}
          {state.client.practitionerCredentials}
        </p>
        <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-slate-900">
          Feedback & care updates
        </h1>
      </div>

      {/* Share a barrier form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Let your nutritionist know what’s hard right now
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Share timing conflicts, office constraints, or hunger patterns. This
          appears directly in Dr. Meera’s review workspace.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">Topic</p>
            <div className="flex flex-wrap gap-1.5">
              {TOPIC_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTopic(opt.value)}
                  className={cn(
                    'min-h-[38px] rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                    topic === opt.value
                      ? 'border-teal-700 bg-teal-700 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">Related meal</p>
            <div className="flex flex-wrap gap-1.5">
              {SLOT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMealSlot(opt.value)}
                  className={cn(
                    'min-h-[38px] rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                    mealSlot === opt.value
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="client-feedback-textarea"
              className="block text-xs font-medium text-slate-700"
            >
              Your message
            </label>
            <Textarea
              id="client-feedback-textarea"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="e.g. I can't manage my afternoon snack when I am at the office."
              rows={3}
            />
            {(errorMsg || lastError) && (
              <p role="alert" className="text-xs font-medium text-rose-700">
                {errorMsg || lastError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() =>
                setMessage(
                  "I can't manage my afternoon snack when I am at the office — something I can keep in my bag with zero prep would help."
                )
              }
              className="text-xs font-medium text-teal-700 hover:text-teal-800 underline underline-offset-2 cursor-pointer"
            >
              Use quick office-snack example
            </button>
            <Button
              type="submit"
              variant="default"
              size="touch"
              disabled={isSaving}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {isSaving ? 'Sending...' : 'Send to nutritionist'}
            </Button>
          </div>
        </form>
      </section>

      {/* Incoming recommendations & messages from Practitioner */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Updates from {state.client.practitionerName}
        </h2>

        {clientVisibleUpdates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
            No plan updates or messages yet. Once Dr. Meera reviews your weekly
            check-ins and sends a recommendation, it will appear right here and
            update Today’s Plan.
          </div>
        ) : (
          <div className="space-y-3">
            {clientVisibleUpdates.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-teal-200 bg-white p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <AvatarWithFallback
                    src={state.client.practitionerAvatarUrl}
                    name={item.authorName}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-900">
                        {item.authorName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {item.type === 'plan_adjustment'
                          ? 'Plan adjustment'
                          : 'Feedback message'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h3 className="mt-1 font-display text-base font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">
                      {item.body}
                    </p>
                    {item.proposedMealDescription && (
                      <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50/60 px-3.5 py-2.5 text-sm text-slate-800">
                        <p className="font-medium text-teal-900">
                          {item.proposedMealTitle}
                          {item.proposedTime ? ` · ${item.proposedTime}` : ''}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-700">
                          {item.proposedMealDescription}
                        </p>
                      </div>
                    )}
                    <div className="mt-3">
                      {item.acknowledgedByClient ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Confirmed — Dr. Meera notified
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          disabled={isSaving}
                          onClick={() =>
                            void acknowledgePractitionerUpdate(item.id)
                          }
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Got it, I’ll try this
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Ananya's submitted notes history */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Notes you’ve shared
        </h2>
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {state.feedback.map((fb) => (
            <div key={fb.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  {fb.date}
                  {fb.relatedMealSlotId
                    ? ` · ${fb.relatedMealSlotId.charAt(0).toUpperCase() + fb.relatedMealSlotId.slice(1)}`
                    : ''}
                </span>
                <span
                  className={cn(
                    'font-medium',
                    fb.status === 'addressed'
                      ? 'text-emerald-700'
                      : fb.status === 'acknowledged'
                      ? 'text-teal-700'
                      : 'text-slate-500'
                  )}
                >
                  {fb.status === 'addressed'
                    ? 'Addressed in plan'
                    : fb.status === 'acknowledged'
                    ? 'Reviewed by Dr. Meera'
                    : 'Waiting for practitioner review'}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
                “{fb.message}”
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
