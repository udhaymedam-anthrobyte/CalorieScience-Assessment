import type {
  CalorieScienceState,
  ClientFeedbackMessage,
  DayDescriptor,
  MealLogEntry,
  PlannedMealSlot,
  RosterClientSummary,
} from '../types/adherence';

export const ANANYA_AVATAR =
  '/src/assets/images/avatar_ananya_rao_1795255144574.jpg';
export const PRACTITIONER_AVATAR =
  '/src/assets/images/avatar_practitioner_meera_1795255233819.jpg';
export const HERO_NUTRITION_IMAGE =
  '/src/assets/images/hero_nutrition_editorial_1795255147243.jpg';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildEightDayWindow(anchorDate = new Date()): DayDescriptor[] {
  const base = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    anchorDate.getDate()
  );
  const days: DayDescriptor[] = [];

  // 7 completed review days (-7 to -1) + Today (0)
  for (let offset = -7; offset <= 0; offset++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    const dow = d.getDay();
    const shortDay = SHORT_DAYS[dow];
    const dateNum = String(d.getDate());
    const monthName = SHORT_MONTHS[d.getMonth()];
    days.push({
      date: formatISODate(d),
      shortDay,
      dateNum,
      fullLabel: `${shortDay}, ${monthName} ${dateNum}`,
      isWeekend: dow === 0 || dow === 6,
      isToday: offset === 0,
    });
  }

  return days;
}

export const INITIAL_MEAL_PLAN: PlannedMealSlot[] = [
  {
    id: 'breakfast',
    label: 'Breakfast',
    scheduledTime: '8:00 AM',
    scheduledMinutes: 480,
    plannedTitle: 'High-protein breakfast',
    plannedDescription:
      'Moong dal chilla or paneer bhurji with 1 slice whole-grain toast and a bowl of Greek yogurt.',
    prepContext: 'Prepared at home · ~12 min',
    proteinEstimate: '~28g protein',
  },
  {
    id: 'lunch',
    label: 'Lunch',
    scheduledTime: '1:00 PM',
    scheduledMinutes: 780,
    plannedTitle: 'Balanced home-style meal',
    plannedDescription:
      '1 bowl dal, seasonal sautéed sabzi, 2 whole-wheat phulkas or 1 cup brown rice, and plain curd.',
    prepContext: 'Home tiffin · needs microwave',
    proteinEstimate: '~22g protein',
  },
  {
    id: 'snack',
    label: 'Afternoon Snack',
    scheduledTime: '4:30 PM',
    scheduledMinutes: 990,
    plannedTitle: 'Protein-rich snack',
    plannedDescription:
      'Sprouted moong & cucumber chaat with roasted chana and a glass of spiced buttermilk.',
    prepContext: 'Light assembly · refrigerated',
    proteinEstimate: '~16g protein',
  },
  {
    id: 'dinner',
    label: 'Dinner',
    scheduledTime: '8:00 PM',
    scheduledMinutes: 1200,
    plannedTitle: 'Balanced dinner',
    plannedDescription:
      'Grilled paneer, tofu, or fish with stir-fried greens and 1 small portion of quinoa or 2 phulkas.',
    prepContext: 'Prepared at home · ~20 min',
    proteinEstimate: '~30g protein',
  },
];

export function createInitialScenarioState(
  anchorDate = new Date()
): CalorieScienceState {
  const days = buildEightDayWindow(anchorDate);
  const reviewDays = days.slice(0, 7);
  const today = days[7];

  const workdays = reviewDays.filter((d) => !d.isWeekend);
  const weekends = reviewDays.filter((d) => d.isWeekend);

  const logs: MealLogEntry[] = [];
  let seq = 1;
  const pushLog = (entry: Omit<MealLogEntry, 'id' | 'loggedAt'>) => {
    logs.push({
      ...entry,
      id: `log-${seq++}`,
      loggedAt: `${entry.date}T21:00:00.000Z`,
    });
  };

  // Populate the 5 workdays in chronological order with Ananya's authentic scenario:
  // - Breakfast: 4 followed, 1 partial
  // - Lunch: 4 substituted (work meetings), 1 partial
  // - Snack: 4 skipped (hunger + no prep time), 1 missing log (logging gap on workday #3)
  // - Dinner: variable late timings (9:10 PM – 10:15 PM), 2 followed, 2 partial, 1 missing log (workday #4)
  workdays.forEach((day, idx) => {
    // Breakfast
    if (idx === 3) {
      pushLog({
        date: day.date,
        mealSlotId: 'breakfast',
        status: 'partial',
        actualTime: '8:30 AM',
        actualMinutes: 510,
        barrierTags: ['work_meetings'],
        hungerLevel: 'slightly_hungry',
        prepDifficulty: 'easy',
        comment: 'Had paneer toast before an early standup, skipped the yogurt.',
      });
    } else {
      const bTimes = [
        { t: '8:05 AM', m: 485 },
        { t: '7:55 AM', m: 475 },
        { t: '8:10 AM', m: 490 },
        { t: '8:15 AM', m: 495 },
        { t: '8:00 AM', m: 480 },
      ];
      pushLog({
        date: day.date,
        mealSlotId: 'breakfast',
        status: 'followed',
        actualTime: bTimes[idx].t,
        actualMinutes: bTimes[idx].m,
        barrierTags: [],
        hungerLevel: 'comfortably_full',
        prepDifficulty: 'easy',
      });
    }

    // Lunch
    if (idx === 0) {
      pushLog({
        date: day.date,
        mealSlotId: 'lunch',
        status: 'substituted',
        actualTime: '1:45 PM',
        actualMinutes: 825,
        substitutionText: 'Office cafeteria vegetable pasta & garlic bread',
        barrierTags: ['work_meetings', 'no_prep_time'],
        hungerLevel: 'comfortably_full',
        prepDifficulty: 'hard',
        comment: 'Back-to-back planning meetings ran past 1:30 PM.',
      });
    } else if (idx === 1) {
      pushLog({
        date: day.date,
        mealSlotId: 'lunch',
        status: 'substituted',
        actualTime: '2:05 PM',
        actualMinutes: 845,
        substitutionText: 'Ordered grilled wrap & iced coffee',
        barrierTags: ['work_meetings'],
        hungerLevel: 'slightly_hungry',
        prepDifficulty: 'hard',
        comment: 'Client call extended across the lunch window.',
      });
    } else if (idx === 2) {
      pushLog({
        date: day.date,
        mealSlotId: 'lunch',
        status: 'partial',
        actualTime: '1:30 PM',
        actualMinutes: 810,
        barrierTags: ['no_prep_time'],
        hungerLevel: 'slightly_hungry',
        prepDifficulty: 'moderate',
        comment: 'Ate home dal and rice, missed the sabzi and curd.',
      });
    } else if (idx === 3) {
      pushLog({
        date: day.date,
        mealSlotId: 'lunch',
        status: 'substituted',
        actualTime: '1:50 PM',
        actualMinutes: 830,
        substitutionText: 'Office canteen chole kulche',
        barrierTags: ['work_meetings', 'not_portable'],
        hungerLevel: 'overfull',
        prepDifficulty: 'hard',
        comment: 'Left early without packing lunch; few light options in canteen.',
      });
    } else {
      pushLog({
        date: day.date,
        mealSlotId: 'lunch',
        status: 'substituted',
        actualTime: '2:15 PM',
        actualMinutes: 855,
        substitutionText: 'Ordered paneer rice bowl',
        barrierTags: ['work_meetings'],
        hungerLevel: 'comfortably_full',
        prepDifficulty: 'moderate',
        comment: 'Working team lunch at the office.',
      });
    }

    // Afternoon Snack (idx 2 intentionally unlogged to model a real Logging Gap)
    if (idx === 0) {
      pushLog({
        date: day.date,
        mealSlotId: 'snack',
        status: 'skipped',
        barrierTags: ['no_prep_time', 'work_meetings'],
        hungerLevel: 'very_hungry',
        prepDifficulty: 'hard',
        comment: 'No time to assemble sprouted salad between 4–6 PM meetings. Felt starving by 6:30 PM.',
      });
    } else if (idx === 1) {
      pushLog({
        date: day.date,
        mealSlotId: 'snack',
        status: 'skipped',
        barrierTags: ['no_prep_time', 'not_portable'],
        hungerLevel: 'very_hungry',
        prepDifficulty: 'hard',
        comment: 'Too busy at desk, only had black coffee.',
      });
    } else if (idx === 3) {
      pushLog({
        date: day.date,
        mealSlotId: 'snack',
        status: 'skipped',
        barrierTags: ['work_meetings', 'no_prep_time'],
        hungerLevel: 'slightly_hungry',
        prepDifficulty: 'hard',
        comment: 'Did not carry the buttermilk/chana box; noticeable energy dip at 5 PM.',
      });
    } else if (idx === 4) {
      pushLog({
        date: day.date,
        mealSlotId: 'snack',
        status: 'skipped',
        barrierTags: ['no_prep_time'],
        hungerLevel: 'very_hungry',
        prepDifficulty: 'hard',
        comment: 'Late lunch threw off my afternoon and I could not step away at 4:30 PM.',
      });
    }

    // Dinner (idx 3 intentionally unlogged to model a second Logging Gap)
    if (idx === 0) {
      pushLog({
        date: day.date,
        mealSlotId: 'dinner',
        status: 'followed',
        actualTime: '9:25 PM',
        actualMinutes: 1285,
        barrierTags: ['late_schedule'],
        hungerLevel: 'comfortably_full',
        prepDifficulty: 'moderate',
        comment: 'Commute ran late; cooked the planned dinner after 9 PM.',
      });
    } else if (idx === 1) {
      pushLog({
        date: day.date,
        mealSlotId: 'dinner',
        status: 'partial',
        actualTime: '9:50 PM',
        actualMinutes: 1310,
        barrierTags: ['late_schedule'],
        hungerLevel: 'overfull',
        prepDifficulty: 'moderate',
        comment: 'Arrived home very hungry after skipping snack and ate a larger portion late.',
      });
    } else if (idx === 2) {
      pushLog({
        date: day.date,
        mealSlotId: 'dinner',
        status: 'followed',
        actualTime: '9:10 PM',
        actualMinutes: 1270,
        barrierTags: ['late_schedule'],
        hungerLevel: 'comfortably_full',
        prepDifficulty: 'easy',
      });
    } else if (idx === 4) {
      pushLog({
        date: day.date,
        mealSlotId: 'dinner',
        status: 'partial',
        actualTime: '10:15 PM',
        actualMinutes: 1335,
        barrierTags: ['late_schedule'],
        hungerLevel: 'comfortably_full',
        prepDifficulty: 'moderate',
        comment: 'Late evening release wrap-up; ate quickly after 10 PM.',
      });
    }
  });

  // Populate the 2 weekend days (much steadier adherence & on-time dinners)
  weekends.forEach((day, idx) => {
    pushLog({
      date: day.date,
      mealSlotId: 'breakfast',
      status: 'followed',
      actualTime: idx === 0 ? '8:20 AM' : '8:15 AM',
      actualMinutes: idx === 0 ? 500 : 495,
      barrierTags: [],
      hungerLevel: 'comfortably_full',
      prepDifficulty: 'easy',
    });
    pushLog({
      date: day.date,
      mealSlotId: 'lunch',
      status: 'followed',
      actualTime: idx === 0 ? '1:10 PM' : '1:15 PM',
      actualMinutes: idx === 0 ? 790 : 795,
      barrierTags: [],
      hungerLevel: 'comfortably_full',
      prepDifficulty: 'easy',
    });
    pushLog({
      date: day.date,
      mealSlotId: 'snack',
      status: idx === 0 ? 'followed' : 'partial',
      actualTime: idx === 0 ? '4:40 PM' : '4:55 PM',
      actualMinutes: idx === 0 ? 1000 : 1015,
      barrierTags: [],
      hungerLevel: 'comfortably_full',
      prepDifficulty: 'easy',
      comment: idx === 1 ? 'Had roasted chana without the buttermilk.' : undefined,
    });
    pushLog({
      date: day.date,
      mealSlotId: 'dinner',
      status: 'followed',
      actualTime: idx === 0 ? '8:05 PM' : '8:15 PM',
      actualMinutes: idx === 0 ? 1205 : 1215,
      barrierTags: [],
      hungerLevel: 'comfortably_full',
      prepDifficulty: 'easy',
    });
  });

  // Today (Day 8): Breakfast logged so Today feels active; Lunch, Snack & Dinner open to log
  pushLog({
    date: today.date,
    mealSlotId: 'breakfast',
    status: 'followed',
    actualTime: '8:10 AM',
    actualMinutes: 490,
    barrierTags: [],
    hungerLevel: 'comfortably_full',
    prepDifficulty: 'easy',
    comment: 'Moong dal chilla with Greek yogurt before leaving for work.',
  });

  const feedback: ClientFeedbackMessage[] = [
    {
      id: 'fb-1',
      date: workdays[workdays.length - 1]?.date ?? reviewDays[5].date,
      createdAt: `${workdays[workdays.length - 1]?.date ?? reviewDays[5].date}T17:45:00.000Z`,
      topic: 'afternoon_barrier',
      relatedMealSlotId: 'snack',
      message:
        "I don't have enough time to prepare or eat the planned afternoon meal when I'm at work.",
      status: 'unreviewed',
    },
    {
      id: 'fb-2',
      date: workdays[2]?.date ?? reviewDays[3].date,
      createdAt: `${workdays[2]?.date ?? reviewDays[3].date}T14:20:00.000Z`,
      topic: 'meal_timing',
      relatedMealSlotId: 'lunch',
      message:
        'Meetings regularly run through 1:00 PM on weekdays, so I end up grabbing something quick from the office cafeteria.',
      status: 'unreviewed',
    },
  ];

  return {
    client: {
      id: 'ananya-rao',
      name: 'Ananya Rao',
      age: 34,
      occupation: 'Corporate professional',
      goal: 'Improve metabolic health and build sustainable eating habits',
      programmeDurationWeeks: 4,
      currentWeek: 2,
      currentDay: 8,
      avatarUrl: ANANYA_AVATAR,
      practitionerName: 'Dr. Meera Nair',
      practitionerCredentials: 'MSc Clinical Nutrition · RD',
      practitionerAvatarUrl: PRACTITIONER_AVATAR,
    },
    mealPlan: INITIAL_MEAL_PLAN.map((slot) => ({ ...slot })),
    days,
    logs,
    feedback,
    practitionerActions: [],
    reviewStatus: 'needs_review',
    flaggedForFollowUp: false,
    lastUpdatedAt: new Date().toISOString(),
  };
}

// Representative caseload roster demonstrating how the triage model scales to 50–100 clients
export const SECONDARY_ROSTER_CLIENTS: RosterClientSummary[] = [
  {
    id: 'rohan-menon',
    name: 'Rohan Menon',
    age: 41,
    goalShort: 'Lipid profile & steady weekday energy',
    programmeWeek: 'Week 3 of 8',
    triageState: 'followup_flagged',
    loggingRate7d: 71,
    followedRateOfLogged: 60,
    primarySignal: '8 logging gaps on travel days · dinner skipped twice',
    unreviewedFeedbackCount: 1,
  },
  {
    id: 'priya-kulkarni',
    name: 'Priya Kulkarni',
    age: 29,
    goalShort: 'PCOS insulin sensitivity support',
    programmeWeek: 'Week 4 of 6',
    triageState: 'needs_review',
    loggingRate7d: 89,
    followedRateOfLogged: 76,
    primarySignal: 'Breakfast timing shifted +90 min on 3 days',
    unreviewedFeedbackCount: 1,
  },
  {
    id: 'vikram-desai',
    name: 'Vikram Desai',
    age: 47,
    goalShort: 'HbA1c reduction & evening satiety',
    programmeWeek: 'Week 5 of 12',
    triageState: 'on_track',
    loggingRate7d: 96,
    followedRateOfLogged: 89,
    primarySignal: 'Consistent across all 4 slots · no reported barriers',
    unreviewedFeedbackCount: 0,
  },
  {
    id: 'kavita-sharma',
    name: 'Kavita Sharma',
    age: 38,
    goalShort: 'Post-partum iron & protein restoration',
    programmeWeek: 'Week 2 of 6',
    triageState: 'on_track',
    loggingRate7d: 93,
    followedRateOfLogged: 85,
    primarySignal: 'High breakfast & dinner alignment · 1 lunch swap',
    unreviewedFeedbackCount: 0,
  },
];
