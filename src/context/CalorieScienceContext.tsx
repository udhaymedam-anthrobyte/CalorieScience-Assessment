import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
import { createInitialScenarioState } from '../data/initialScenario';
import type {
  BarrierTag,
  CalorieScienceState,
  ClientReviewStatus,
  FeedbackTopic,
  HungerLevel,
  MealLogStatus,
  MealSlotId,
  PrepDifficulty,
} from '../types/adherence';

const STORAGE_KEY = 'caloriescience_companion_state_v1';

export interface UpsertMealLogInput {
  date: string;
  mealSlotId: MealSlotId;
  status: MealLogStatus;
  actualTime?: string;
  actualMinutes?: number;
  substitutionText?: string;
  barrierTags: BarrierTag[];
  hungerLevel?: HungerLevel;
  prepDifficulty?: PrepDifficulty;
  comment?: string;
}

export interface SendPlanAdjustmentInput {
  targetMealSlotId: MealSlotId;
  updatedTitle: string;
  updatedDescription: string;
  updatedTime?: string;
  practitionerNote: string;
}

interface CalorieScienceContextValue {
  state: CalorieScienceState;
  isHydrating: boolean;
  isSaving: boolean;
  simulateError: boolean;
  lastError: string | null;
  setSimulateError: (v: boolean) => void;
  clearError: () => void;
  upsertMealLog: (input: UpsertMealLogInput) => Promise<boolean>;
  clearMealLog: (date: string, mealSlotId: MealSlotId) => Promise<boolean>;
  submitClientFeedback: (input: {
    topic: FeedbackTopic;
    relatedMealSlotId?: MealSlotId;
    message: string;
  }) => Promise<boolean>;
  acknowledgeFeedback: (
    feedbackId: string,
    nextStatus: 'acknowledged' | 'addressed'
  ) => Promise<boolean>;
  sendPlanAdjustment: (input: SendPlanAdjustmentInput) => Promise<boolean>;
  revertPlanAdjustment: (slotId: MealSlotId) => Promise<boolean>;
  sendClientMessage: (title: string, body: string) => Promise<boolean>;
  addPractitionerNote: (title: string, body: string) => Promise<boolean>;
  toggleFollowUpFlag: (input: {
    flagged: boolean;
    reason?: string;
    dueDate?: string;
  }) => Promise<boolean>;
  updateReviewStatus: (status: ClientReviewStatus, note?: string) => Promise<boolean>;
  acknowledgePractitionerUpdate: (actionId: string) => Promise<boolean>;
  resetDemoData: () => void;
}

const CalorieScienceContext = createContext<CalorieScienceContextValue | null>(
  null
);

function loadPersistedState(): CalorieScienceState {
  if (typeof window === 'undefined') return createInitialScenarioState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialScenarioState();
    const parsed = JSON.parse(raw) as CalorieScienceState;
    if (!parsed || !parsed.client || !Array.isArray(parsed.days) || !Array.isArray(parsed.mealPlan)) {
      return createInitialScenarioState();
    }
    return parsed;
  } catch {
    return createInitialScenarioState();
  }
}

export const CalorieScienceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<CalorieScienceState>(() =>
    loadPersistedState()
  );
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [simulateError, setSimulateError] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Brief realistic initial hydration for skeleton visibility without delaying interaction
  useEffect(() => {
    const timer = window.setTimeout(() => setIsHydrating(false), 180);
    return () => window.clearTimeout(timer);
  }, []);

  // Persist to localStorage whenever state updates
  const persistState = useCallback((next: CalorieScienceState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota errors in restricted sandboxes
    }
  }, []);

  // Live cross-tab sync (if evaluator opens /client and /practitioner in two tabs side-by-side)
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const synced = JSON.parse(event.newValue) as CalorieScienceState;
          setState(synced);
        } catch {
          // Ignore malformed storage payload
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const runMutation = useCallback(
    async (
      updater: (prev: CalorieScienceState) => CalorieScienceState,
      successMessage?: string
    ): Promise<boolean> => {
      setIsSaving(true);
      setLastError(null);
      await new Promise((r) => window.setTimeout(r, 140));

      if (simulateError) {
        const msg =
          'Could not sync changes right now (simulated offline/sync error). Your draft is preserved — turn off error simulation or retry.';
        setLastError(msg);
        setIsSaving(false);
        toast.error('Sync failed — please retry');
        return false;
      }

      setState((prev) => {
        const next = {
          ...updater(prev),
          lastUpdatedAt: new Date().toISOString(),
        };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });

      setIsSaving(false);
      if (successMessage) toast.success(successMessage);
      return true;
    },
    [simulateError]
  );

  const upsertMealLog = useCallback(
    async (input: UpsertMealLogInput) => {
      return runMutation((prev) => {
        const existingIndex = prev.logs.findIndex(
          (l) => l.date === input.date && l.mealSlotId === input.mealSlotId
        );
        const now = new Date().toISOString();
        const nextLog = {
          id:
            existingIndex >= 0
              ? prev.logs[existingIndex].id
              : `log-${Date.now()}`,
          ...input,
          loggedAt: now,
        };
        const nextLogs =
          existingIndex >= 0
            ? prev.logs.map((l, i) => (i === existingIndex ? nextLog : l))
            : [...prev.logs, nextLog];
        return { ...prev, logs: nextLogs };
      }, 'Meal check-in saved');
    },
    [runMutation]
  );

  const clearMealLog = useCallback(
    async (date: string, mealSlotId: MealSlotId) => {
      return runMutation((prev) => ({
        ...prev,
        logs: prev.logs.filter(
          (l) => !(l.date === date && l.mealSlotId === mealSlotId)
        ),
      }), 'Meal check-in cleared');
    },
    [runMutation]
  );

  const submitClientFeedback = useCallback(
    async (input: {
      topic: FeedbackTopic;
      relatedMealSlotId?: MealSlotId;
      message: string;
    }) => {
      const trimmed = input.message.trim();
      if (!trimmed) return false;
      return runMutation((prev) => {
        const today = prev.days[prev.days.length - 1]?.date ?? new Date().toISOString().slice(0, 10);
        const newItem = {
          id: `fb-${Date.now()}`,
          date: today,
          createdAt: new Date().toISOString(),
          topic: input.topic,
          relatedMealSlotId: input.relatedMealSlotId,
          message: trimmed,
          status: 'unreviewed' as const,
        };
        return {
          ...prev,
          feedback: [newItem, ...prev.feedback],
          reviewStatus:
            prev.reviewStatus === 'reviewed'
              ? 'needs_review'
              : prev.reviewStatus,
        };
      }, 'Shared with Dr. Meera Nair');
    },
    [runMutation]
  );

  const acknowledgeFeedback = useCallback(
    async (feedbackId: string, nextStatus: 'acknowledged' | 'addressed') => {
      return runMutation(
        (prev) => ({
          ...prev,
          feedback: prev.feedback.map((f) =>
            f.id === feedbackId ? { ...f, status: nextStatus } : f
          ),
        }),
        nextStatus === 'addressed'
          ? 'Feedback marked addressed'
          : 'Feedback acknowledged'
      );
    },
    [runMutation]
  );

  const sendPlanAdjustment = useCallback(
    async (input: SendPlanAdjustmentInput) => {
      return runMutation((prev) => {
        const now = new Date().toISOString();
        const actionId = `act-${Date.now()}`;
        const slotLabel =
          prev.mealPlan.find((s) => s.id === input.targetMealSlotId)?.label ??
          'Meal';

        const updatedPlan = prev.mealPlan.map((slot) =>
          slot.id === input.targetMealSlotId
            ? {
                ...slot,
                activeAdjustment: {
                  id: actionId,
                  updatedTitle: input.updatedTitle,
                  updatedDescription: input.updatedDescription,
                  updatedTime: input.updatedTime,
                  practitionerNote: input.practitionerNote,
                  createdAt: now,
                  acknowledgedByClient: false,
                },
              }
            : slot
        );

        const newAction = {
          id: actionId,
          type: 'plan_adjustment' as const,
          title: `Updated ${slotLabel} recommendation`,
          body: input.practitionerNote,
          createdAt: now,
          authorName: prev.client.practitionerName,
          visibleToClient: true,
          acknowledgedByClient: false,
          targetMealSlotId: input.targetMealSlotId,
          proposedMealTitle: input.updatedTitle,
          proposedMealDescription: input.updatedDescription,
          proposedTime: input.updatedTime,
        };

        // Also mark related unreviewed feedback as addressed when adjusting that meal slot
        const updatedFeedback = prev.feedback.map((f) =>
          f.relatedMealSlotId === input.targetMealSlotId &&
          f.status !== 'addressed'
            ? { ...f, status: 'addressed' as const }
            : f
        );

        return {
          ...prev,
          mealPlan: updatedPlan,
          feedback: updatedFeedback,
          practitionerActions: [newAction, ...prev.practitionerActions],
          reviewStatus: 'plan_review_initiated',
        };
      }, 'Plan adjustment sent to Ananya’s Companion App');
    },
    [runMutation]
  );

  const revertPlanAdjustment = useCallback(
    async (slotId: MealSlotId) => {
      return runMutation((prev) => {
        const slotLabel =
          prev.mealPlan.find((s) => s.id === slotId)?.label ?? 'Meal';
        const updatedPlan = prev.mealPlan.map((slot) =>
          slot.id === slotId ? { ...slot, activeAdjustment: undefined } : slot
        );
        const newAction = {
          id: `act-${Date.now()}`,
          type: 'review_status' as const,
          title: `Reverted ${slotLabel} to original plan`,
          body: `Restored the baseline ${slotLabel.toLowerCase()} recommendation in the client’s plan.`,
          createdAt: new Date().toISOString(),
          authorName: prev.client.practitionerName,
          visibleToClient: false,
        };
        return {
          ...prev,
          mealPlan: updatedPlan,
          practitionerActions: [newAction, ...prev.practitionerActions],
        };
      }, 'Meal slot reverted to original plan');
    },
    [runMutation]
  );

  const sendClientMessage = useCallback(
    async (title: string, body: string) => {
      const cleanBody = body.trim();
      if (!cleanBody) return false;
      return runMutation((prev) => {
        const newAction = {
          id: `act-${Date.now()}`,
          type: 'client_feedback' as const,
          title: title.trim() || 'Message from your nutritionist',
          body: cleanBody,
          createdAt: new Date().toISOString(),
          authorName: prev.client.practitionerName,
          visibleToClient: true,
          acknowledgedByClient: false,
        };
        return {
          ...prev,
          practitionerActions: [newAction, ...prev.practitionerActions],
        };
      }, 'Feedback sent to client');
    },
    [runMutation]
  );

  const addPractitionerNote = useCallback(
    async (title: string, body: string) => {
      const cleanBody = body.trim();
      if (!cleanBody) return false;
      return runMutation((prev) => {
        const newAction = {
          id: `act-${Date.now()}`,
          type: 'internal_note' as const,
          title: title.trim() || 'Clinical review note',
          body: cleanBody,
          createdAt: new Date().toISOString(),
          authorName: prev.client.practitionerName,
          visibleToClient: false,
        };
        return {
          ...prev,
          practitionerActions: [newAction, ...prev.practitionerActions],
        };
      }, 'Clinical note saved privately');
    },
    [runMutation]
  );

  const toggleFollowUpFlag = useCallback(
    async (input: { flagged: boolean; reason?: string; dueDate?: string }) => {
      return runMutation(
        (prev) => {
          const newAction = {
            id: `act-${Date.now()}`,
            type: 'followup_flag' as const,
            title: input.flagged
              ? 'Flagged for follow-up'
              : 'Follow-up flag cleared',
            body: input.flagged
              ? input.reason?.trim() ||
                'Review workday lunch portability and afternoon snack adjustment.'
              : 'Follow-up item resolved.',
            createdAt: new Date().toISOString(),
            authorName: prev.client.practitionerName,
            visibleToClient: false,
            followUpDate: input.dueDate,
          };
          return {
            ...prev,
            flaggedForFollowUp: input.flagged,
            followUpReason: input.flagged ? newAction.body : undefined,
            followUpDueDate: input.flagged ? input.dueDate : undefined,
            practitionerActions: [newAction, ...prev.practitionerActions],
          };
        },
        input.flagged ? 'Client flagged for follow-up' : 'Follow-up flag cleared'
      );
    },
    [runMutation]
  );

  const updateReviewStatus = useCallback(
    async (status: ClientReviewStatus, note?: string) => {
      const statusLabel =
        status === 'reviewed'
          ? 'Marked client as reviewed'
          : status === 'plan_review_initiated'
          ? 'Initiated meal-plan review'
          : 'Reopened for review';
      return runMutation((prev) => {
        const newAction = {
          id: `act-${Date.now()}`,
          type: 'review_status' as const,
          title: statusLabel,
          body:
            note?.trim() ||
            (status === 'reviewed'
              ? 'Completed 7-day adherence pattern review.'
              : 'Scheduled meal-plan adjustment for weekday schedule barriers.'),
          createdAt: new Date().toISOString(),
          authorName: prev.client.practitionerName,
          visibleToClient: false,
        };
        return {
          ...prev,
          reviewStatus: status,
          practitionerActions: [newAction, ...prev.practitionerActions],
        };
      }, statusLabel);
    },
    [runMutation]
  );

  const acknowledgePractitionerUpdate = useCallback(
    async (actionId: string) => {
      return runMutation((prev) => {
        const now = new Date().toISOString();
        return {
          ...prev,
          mealPlan: prev.mealPlan.map((slot) =>
            slot.activeAdjustment?.id === actionId
              ? {
                  ...slot,
                  activeAdjustment: {
                    ...slot.activeAdjustment,
                    acknowledgedByClient: true,
                    acknowledgedAt: now,
                  },
                }
              : slot
          ),
          practitionerActions: prev.practitionerActions.map((a) =>
            a.id === actionId
              ? { ...a, acknowledgedByClient: true, acknowledgedAt: now }
              : a
          ),
        };
      }, 'Acknowledged — Dr. Meera Nair can see your confirmation');
    },
    [runMutation]
  );

  const resetDemoData = useCallback(() => {
    const fresh = createInitialScenarioState();
    persistState(fresh);
    setSimulateError(false);
    setLastError(null);
    toast.success('Demo scenario reset to Ananya Rao’s initial 7-day state');
  }, [persistState]);

  const value = useMemo<CalorieScienceContextValue>(
    () => ({
      state,
      isHydrating,
      isSaving,
      simulateError,
      lastError,
      setSimulateError,
      clearError: () => setLastError(null),
      upsertMealLog,
      clearMealLog,
      submitClientFeedback,
      acknowledgeFeedback,
      sendPlanAdjustment,
      revertPlanAdjustment,
      sendClientMessage,
      addPractitionerNote,
      toggleFollowUpFlag,
      updateReviewStatus,
      acknowledgePractitionerUpdate,
      resetDemoData,
    }),
    [
      state,
      isHydrating,
      isSaving,
      simulateError,
      lastError,
      upsertMealLog,
      clearMealLog,
      submitClientFeedback,
      acknowledgeFeedback,
      sendPlanAdjustment,
      revertPlanAdjustment,
      sendClientMessage,
      addPractitionerNote,
      toggleFollowUpFlag,
      updateReviewStatus,
      acknowledgePractitionerUpdate,
      resetDemoData,
    ]
  );

  return (
    <CalorieScienceContext.Provider value={value}>
      {children}
    </CalorieScienceContext.Provider>
  );
};

export function useCalorieScience() {
  const ctx = useContext(CalorieScienceContext);
  if (!ctx) {
    throw new Error(
      'useCalorieScience must be used within CalorieScienceProvider'
    );
  }
  return ctx;
}
