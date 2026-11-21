export type MealSlotId = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type MealLogStatus = 'followed' | 'partial' | 'substituted' | 'skipped';

export type ExtendedMealState = MealLogStatus | 'missing' | 'planned';

export type HungerLevel =
  | 'very_hungry'
  | 'slightly_hungry'
  | 'comfortably_full'
  | 'overfull';

export type PrepDifficulty = 'easy' | 'moderate' | 'hard';

export type BarrierTag =
  | 'work_meetings'
  | 'no_prep_time'
  | 'not_portable'
  | 'low_appetite'
  | 'late_schedule'
  | 'social_travel'
  | 'other';

export type ClientReviewStatus =
  | 'needs_review'
  | 'reviewed'
  | 'plan_review_initiated';

export interface ActivePlanAdjustment {
  id: string;
  updatedTitle: string;
  updatedDescription: string;
  updatedTime?: string;
  practitionerNote: string;
  createdAt: string;
  acknowledgedByClient: boolean;
  acknowledgedAt?: string;
}

export interface PlannedMealSlot {
  id: MealSlotId;
  label: string;
  scheduledTime: string; // e.g., "8:00 AM"
  scheduledMinutes: number; // minutes from midnight, e.g. 480
  plannedTitle: string;
  plannedDescription: string;
  prepContext: string;
  proteinEstimate: string;
  activeAdjustment?: ActivePlanAdjustment;
}

export interface MealLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mealSlotId: MealSlotId;
  status: MealLogStatus;
  actualTime?: string; // e.g. "9:30 PM"
  actualMinutes?: number;
  substitutionText?: string;
  barrierTags: BarrierTag[];
  hungerLevel?: HungerLevel;
  prepDifficulty?: PrepDifficulty;
  comment?: string;
  loggedAt: string;
}

export type FeedbackTopic =
  | 'afternoon_barrier'
  | 'meal_timing'
  | 'prep_difficulty'
  | 'hunger_satiety'
  | 'general';

export interface ClientFeedbackMessage {
  id: string;
  date: string;
  createdAt: string;
  topic: FeedbackTopic;
  relatedMealSlotId?: MealSlotId;
  message: string;
  status: 'unreviewed' | 'acknowledged' | 'addressed';
}

export type PractitionerActionType =
  | 'plan_adjustment'
  | 'client_feedback'
  | 'internal_note'
  | 'followup_flag'
  | 'review_status';

export interface PractitionerActionItem {
  id: string;
  type: PractitionerActionType;
  title: string;
  body: string;
  createdAt: string;
  authorName: string;
  visibleToClient: boolean;
  acknowledgedByClient?: boolean;
  acknowledgedAt?: string;
  targetMealSlotId?: MealSlotId;
  proposedMealTitle?: string;
  proposedMealDescription?: string;
  proposedTime?: string;
  followUpDate?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  age: number;
  occupation: string;
  goal: string;
  programmeDurationWeeks: number;
  currentWeek: number;
  currentDay: number;
  avatarUrl: string;
  practitionerName: string;
  practitionerCredentials: string;
  practitionerAvatarUrl: string;
}

export interface DayDescriptor {
  date: string; // YYYY-MM-DD
  shortDay: string; // Mon, Tue...
  dateNum: string; // 14, 15...
  fullLabel: string; // e.g. Thu, Nov 19
  isWeekend: boolean;
  isToday: boolean;
}

export interface RosterClientSummary {
  id: string;
  name: string;
  age: number;
  goalShort: string;
  programmeWeek: string;
  triageState: 'needs_review' | 'followup_flagged' | 'on_track';
  loggingRate7d: number;
  followedRateOfLogged: number;
  primarySignal: string;
  unreviewedFeedbackCount: number;
  isInteractivePrimary?: boolean;
}

export interface CalorieScienceState {
  client: ClientProfile;
  mealPlan: PlannedMealSlot[];
  days: DayDescriptor[]; // 7 historical review days + 1 today = 8 days
  logs: MealLogEntry[];
  feedback: ClientFeedbackMessage[];
  practitionerActions: PractitionerActionItem[];
  reviewStatus: ClientReviewStatus;
  flaggedForFollowUp: boolean;
  followUpReason?: string;
  followUpDueDate?: string;
  lastUpdatedAt: string;
}
