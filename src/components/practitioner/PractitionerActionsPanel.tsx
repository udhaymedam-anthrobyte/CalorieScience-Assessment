import React, { useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Flag,
  Lock,
  Send,
  Sparkles,
} from 'lucide-react';
import { useCalorieScience } from '../../context/CalorieScienceContext';
import type { MealSlotId } from '../../types/adherence';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { cn } from '../../lib/utils';

type ActionTab = 'adjust_plan' | 'client_message' | 'internal_note' | 'followup';

interface PractitionerActionsPanelProps {
  activeTab: ActionTab;
  onTabChange: (tab: ActionTab) => void;
  presetNonce: number;
}

const ADJUSTMENT_PRESETS: Record<
  'portable_snack' | 'workday_lunch' | 'dinner_window',
  {
    label: string;
    slotId: MealSlotId;
    title: string;
    description: string;
    time: string;
    note: string;
  }
> = {
  portable_snack: {
    label: 'Portable 4:30 PM snack',
    slotId: 'snack',
    title: 'Zero-prep portable protein snack',
    description:
      '30g roasted almonds or makhana + 1 ready Greek yogurt pouch or 1 scoop unflavoured whey/soy protein shaker kept at your desk.',
    time: '4:30 PM',
    note: 'I saw your note about afternoon meetings leaving no prep time. Let’s switch your 4:30 PM snack to a desk-ready option you can eat in 2 minutes to prevent evening hunger.',
  },
  workday_lunch: {
    label: 'Workday cafeteria lunch swaps',
    slotId: 'lunch',
    title: 'Home-style meal or structured office swap',
    description:
      'Home dal + sabzi + curd when packed, OR office cafeteria swap: grilled paneer/chicken bowl with extra salad & plain curd (skip refined pasta/fried sides).',
    time: '1:00 PM – 1:45 PM',
    note: 'Since weekday meetings often overlap 1:00 PM, here is a flexible protein-first cafeteria swap so you do not feel stuck when you cannot carry tiffin.',
  },
  dinner_window: {
    label: 'Flexible weekday dinner window',
    slotId: 'dinner',
    title: 'Balanced light dinner (commute-friendly)',
    description:
      'Pre-marinated grilled tofu/paneer or fish with quick sautéed greens & 1–2 phulkas — lighter portion when eating after 9:00 PM.',
    time: '8:30 PM',
    note: 'Shifted your weekday dinner window to 8:30 PM to better reflect commute hours, paired with an afternoon desk snack so you arrive home less hungry.',
  },
};

export const PractitionerActionsPanel: React.FC<
  PractitionerActionsPanelProps
> = ({ activeTab, onTabChange, presetNonce }) => {
  const {
    state,
    sendPlanAdjustment,
    revertPlanAdjustment,
    sendClientMessage,
    addPractitionerNote,
    toggleFollowUpFlag,
    updateReviewStatus,
    isSaving,
    lastError,
  } = useCalorieScience();

  const activeAdjustments = state.mealPlan.filter((s) =>
    Boolean(s.activeAdjustment)
  );

  // Plan adjustment form state
  const [targetSlot, setTargetSlot] = useState<MealSlotId>('snack');
  const [updatedTitle, setUpdatedTitle] = useState(
    ADJUSTMENT_PRESETS.portable_snack.title
  );
  const [updatedDescription, setUpdatedDescription] = useState(
    ADJUSTMENT_PRESETS.portable_snack.description
  );
  const [updatedTime, setUpdatedTime] = useState(
    ADJUSTMENT_PRESETS.portable_snack.time
  );
  const [adjustmentNote, setAdjustmentNote] = useState(
    ADJUSTMENT_PRESETS.portable_snack.note
  );

  // Client message form state
  const [msgTitle, setMsgTitle] = useState(
    'Great breakfast consistency — let’s simplify your afternoons'
  );
  const [msgBody, setMsgBody] = useState(
    'Your breakfast routine and honest logging this week are really helpful. Let’s try keeping roasted almonds and a yogurt pouch at your desk for 4:30 PM meetings and check in on Friday.'
  );

  // Private note form state
  const [noteTitle, setNoteTitle] = useState('Week 2 adherence review');
  const [noteBody, setNoteBody] = useState('');

  // Follow-up form state
  const [followUpReason, setFollowUpReason] = useState(
    'Check if portable 4:30 PM snack reduces workday afternoon hunger and late dinner overeating.'
  );
  const [followUpDueDate, setFollowUpDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });

  React.useEffect(() => {
    if (presetNonce > 0) {
      const p = ADJUSTMENT_PRESETS.portable_snack;
      setTargetSlot(p.slotId);
      setUpdatedTitle(p.title);
      setUpdatedDescription(p.description);
      setUpdatedTime(p.time);
      setAdjustmentNote(p.note);
    }
  }, [presetNonce]);

  const applyPreset = (key: keyof typeof ADJUSTMENT_PRESETS) => {
    const p = ADJUSTMENT_PRESETS[key];
    setTargetSlot(p.slotId);
    setUpdatedTitle(p.title);
    setUpdatedDescription(p.description);
    setUpdatedTime(p.time);
    setAdjustmentNote(p.note);
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatedTitle.trim() || !updatedDescription.trim()) return;
    await sendPlanAdjustment({
      targetMealSlotId: targetSlot,
      updatedTitle: updatedTitle.trim(),
      updatedDescription: updatedDescription.trim(),
      updatedTime: updatedTime.trim() || undefined,
      practitionerNote: adjustmentNote.trim(),
    });
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await sendClientMessage(msgTitle, msgBody);
    if (ok) {
      setMsgBody('');
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await addPractitionerNote(noteTitle, noteBody);
    if (ok) {
      setNoteBody('');
    }
  };

  return (
    <section
      id="practitioner-actions-section"
      aria-label="Practitioner actions"
      className="grid grid-cols-1 gap-6 xl:grid-cols-12"
    >
      {/* Left 7 cols: Action Composer */}
      <div className="rounded-xl border border-slate-200 bg-white xl:col-span-7">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Practitioner actions
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Turn observed adherence patterns into live plan updates, client
                coaching, or clinical follow-up.
              </p>
            </div>
          </div>

          {/* Segmented action selector */}
          <div className="mt-4 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                { id: 'adjust_plan', label: 'Adjust meal plan' },
                { id: 'client_message', label: 'Send client feedback' },
                { id: 'internal_note', label: 'Private note' },
                { id: 'followup', label: 'Follow-up & status' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {lastError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
            >
              {lastError}
            </div>
          )}

          {activeTab === 'adjust_plan' && (
            <form
              onSubmit={(e) => void handleSubmitAdjustment(e)}
              className="space-y-4"
            >
              {activeAdjustments.length > 0 && (
                <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5 space-y-2">
                  <p className="text-xs font-semibold text-teal-900">
                    Live plan adjustments active in Ananya’s Companion App
                  </p>
                  {activeAdjustments.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-slate-900">
                          {slot.label}:
                        </span>{' '}
                        {slot.activeAdjustment?.updatedTitle}{' '}
                        <span className="text-teal-800 font-medium">
                          ·{' '}
                          {slot.activeAdjustment?.acknowledgedByClient
                            ? 'Confirmed by Ananya'
                            : 'Awaiting client confirmation'}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void revertPlanAdjustment(slot.id)}
                        className="text-xs font-medium text-slate-600 underline hover:text-slate-900 cursor-pointer shrink-0"
                      >
                        Revert
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-teal-800">
                  Visibly updates Ananya’s Today’s Plan & Care Updates in /client
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    Object.keys(ADJUSTMENT_PRESETS) as Array<
                      keyof typeof ADJUSTMENT_PRESETS
                    >
                  ).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyPreset(key)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                    >
                      {ADJUSTMENT_PRESETS[key].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="adjust-slot-select"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Target meal slot
                  </label>
                  <select
                    id="adjust-slot-select"
                    value={targetSlot}
                    onChange={(e) =>
                      setTargetSlot(e.target.value as MealSlotId)
                    }
                    className="flex min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    {state.mealPlan.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.label} ({slot.scheduledTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="adjust-time-input"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Recommended timing
                  </label>
                  <Input
                    id="adjust-time-input"
                    value={updatedTime}
                    onChange={(e) => setUpdatedTime(e.target.value)}
                    placeholder="e.g. 4:30 PM"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="adjust-title-input"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Updated meal title
                </label>
                <Input
                  id="adjust-title-input"
                  value={updatedTitle}
                  onChange={(e) => setUpdatedTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="adjust-desc-input"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Updated portable meal recommendation
                </label>
                <Textarea
                  id="adjust-desc-input"
                  value={updatedDescription}
                  onChange={(e) => setUpdatedDescription(e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="adjust-note-input"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Explanation shown to Ananya
                </label>
                <Textarea
                  id="adjust-note-input"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <Button type="submit" disabled={isSaving}>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {isSaving
                    ? 'Sending update...'
                    : 'Send adjustment to Client App'}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'client_message' && (
            <form
              onSubmit={(e) => void handleSubmitMessage(e)}
              className="space-y-4"
            >
              <p className="text-xs font-medium text-teal-800">
                Appears directly in Ananya’s Companion App feedback feed
              </p>
              <div>
                <label
                  htmlFor="client-msg-title"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Subject
                </label>
                <Input
                  id="client-msg-title"
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="client-msg-body"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Supportive coaching message
                </label>
                <Textarea
                  id="client-msg-body"
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Write a brief, encouraging recommendation..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving || !msgBody.trim()}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {isSaving ? 'Sending...' : 'Send feedback to client'}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'internal_note' && (
            <form
              onSubmit={(e) => void handleSubmitNote(e)}
              className="space-y-4"
            >
              <p className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                <Lock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                Private clinical documentation — not visible in the Client
                Companion App
              </p>
              <div>
                <label
                  htmlFor="internal-note-title"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Note heading
                </label>
                <Input
                  id="internal-note-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="internal-note-body"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Clinical observation & plan
                </label>
                <Textarea
                  id="internal-note-body"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="e.g. Workday afternoon snack gap likely driving late dinner satiety overshoot. Re-evaluate after 5 days on desk-portable swap."
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isSaving || !noteBody.trim()}
                >
                  Save private note
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'followup' && (
            <div className="space-y-5">
              {/* Flag for follow-up */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    Follow-up queue flag
                  </p>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      state.flaggedForFollowUp
                        ? 'text-amber-800'
                        : 'text-slate-500'
                    )}
                  >
                    {state.flaggedForFollowUp
                      ? `Flagged · Due ${state.followUpDueDate ?? 'Soon'}`
                      : 'Not flagged'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
                  <Input
                    value={followUpReason}
                    onChange={(e) => setFollowUpReason(e.target.value)}
                    placeholder="Reason for follow-up..."
                    aria-label="Follow-up reason"
                  />
                  <Input
                    type="date"
                    value={followUpDueDate}
                    onChange={(e) => setFollowUpDueDate(e.target.value)}
                    aria-label="Follow-up date"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={state.flaggedForFollowUp ? 'outline' : 'default'}
                    disabled={isSaving}
                    onClick={() =>
                      void toggleFollowUpFlag({
                        flagged: !state.flaggedForFollowUp,
                        reason: followUpReason,
                        dueDate: followUpDueDate,
                      })
                    }
                  >
                    <Flag className="h-4 w-4" aria-hidden="true" />
                    {state.flaggedForFollowUp
                      ? 'Clear follow-up flag'
                      : 'Flag client for follow-up'}
                  </Button>
                </div>
              </div>

              {/* Review status controls */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <p className="text-sm font-medium text-slate-900">
                  Weekly review status
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={
                      state.reviewStatus === 'reviewed'
                        ? 'secondary'
                        : 'outline'
                    }
                    disabled={isSaving}
                    onClick={() => void updateReviewStatus('reviewed')}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Mark client as reviewed
                  </Button>
                  <Button
                    type="button"
                    variant={
                      state.reviewStatus === 'plan_review_initiated'
                        ? 'secondary'
                        : 'outline'
                    }
                    disabled={isSaving}
                    onClick={() =>
                      void updateReviewStatus('plan_review_initiated')
                    }
                  >
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                    Initiate meal-plan review
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right 5 cols: Chronological Clinical Activity Log */}
      <div className="flex flex-col rounded-xl border border-slate-200 bg-white xl:col-span-5">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Intervention log
            </h2>
            <span className="font-mono text-xs tabular-nums text-slate-500">
              {state.practitionerActions.length} recorded
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Tracks practitioner notes, follow-up flags, and client-synced plan
            updates.
          </p>
        </div>

        <div className="flex-1 divide-y divide-slate-200">
          {state.practitionerActions.length === 0 ? (
            <div className="p-5 text-sm leading-relaxed text-slate-500">
              No actions taken yet for Ananya’s Week 2 review. Send a portable
              4:30 PM snack adjustment or coaching note on the left to see the
              closed loop update immediately in the Client Companion App.
            </div>
          ) : (
            state.practitionerActions.map((act) => (
              <div key={act.id} className="p-4 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span
                    className={cn(
                      'font-medium',
                      act.visibleToClient ? 'text-teal-700' : 'text-slate-600'
                    )}
                  >
                    {act.visibleToClient
                      ? act.acknowledgedByClient
                        ? 'Client-visible · Confirmed by Ananya'
                        : 'Client-visible · Live in Companion App'
                      : 'Internal practitioner record'}
                  </span>
                  <span className="font-mono tabular-nums">
                    {new Date(act.createdAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {act.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {act.body}
                </p>
                {act.proposedMealTitle && (
                  <p className="mt-1.5 text-xs font-medium text-slate-800">
                    New plan: {act.proposedMealTitle}
                    {act.proposedTime ? ` (${act.proposedTime})` : ''}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
