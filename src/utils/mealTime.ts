import { MealType, MealSessionInfo } from '../types';

export interface MealSchedule {
  type: MealType;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  displayTime: string;
}

export const MEAL_SCHEDULES: Record<MealType, MealSchedule> = {
  Breakfast: {
    type: 'Breakfast',
    startHour: 7,
    startMinute: 30,
    endHour: 9,
    endMinute: 30,
    displayTime: '07:30 AM - 09:30 AM'
  },
  Lunch: {
    type: 'Lunch',
    startHour: 12,
    startMinute: 0,
    endHour: 14,
    endMinute: 30,
    displayTime: '12:00 PM - 02:30 PM'
  },
  Snacks: {
    type: 'Snacks',
    startHour: 16,
    startMinute: 30,
    endHour: 18,
    endMinute: 0,
    displayTime: '04:30 PM - 06:00 PM'
  },
  Dinner: {
    type: 'Dinner',
    startHour: 19,
    startMinute: 30,
    endHour: 22,
    endMinute: 0,
    displayTime: '07:30 PM - 10:00 PM'
  }
};

/**
 * Returns the currently active meal, or the next upcoming meal based on system clock.
 */
export function getCurrentMealType(now: Date = new Date()): MealType {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Breakfast: 07:30 (450) - 09:30 (570)
  if (currentMinutes >= 450 && currentMinutes < 570) return 'Breakfast';

  // Lunch: 12:00 (720) - 14:30 (870)
  if (currentMinutes >= 720 && currentMinutes < 870) return 'Lunch';

  // Snacks: 16:30 (990) - 18:00 (1080)
  if (currentMinutes >= 990 && currentMinutes < 1080) return 'Snacks';

  // Dinner: 19:30 (1170) - 22:00 (1320)
  if (currentMinutes >= 1170 && currentMinutes < 1320) return 'Dinner';

  // If outside active windows, find next closest meal:
  if (currentMinutes < 570) return 'Breakfast';
  if (currentMinutes < 870) return 'Lunch';
  if (currentMinutes < 1080) return 'Snacks';
  return 'Dinner';
}

/**
 * Calculates live session status, active flag, and time remaining string
 */
export function getMealSessionStatus(mealType: MealType, now: Date = new Date()): {
  isActive: boolean;
  timeLeft: string;
  displayTime: string;
} {
  const sched = MEAL_SCHEDULES[mealType];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sched.startHour * 60 + sched.startMinute;
  const endMinutes = sched.endHour * 60 + sched.endMinute;

  let isActive = false;
  let timeLeft = '';

  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
    isActive = true;
    const diff = endMinutes - currentMinutes;
    if (diff <= 1) {
      timeLeft = 'Closing in less than a minute';
    } else if (diff < 60) {
      timeLeft = `Ends in ${diff} mins`;
    } else {
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      timeLeft = `Ends in ${hrs}h ${mins}m`;
    }
  } else if (currentMinutes < startMinutes) {
    isActive = false;
    const diff = startMinutes - currentMinutes;
    if (diff < 60) {
      timeLeft = `Starts in ${diff} mins`;
    } else {
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      timeLeft = `Starts in ${hrs}h ${mins}m`;
    }
  } else {
    isActive = false;
    timeLeft = 'Session Ended for Today';
  }

  return {
    isActive,
    timeLeft,
    displayTime: sched.displayTime
  };
}

/**
 * Returns formatted date strings
 */
export function getFormattedDateInfo(now: Date = new Date()) {
  const dateStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
  const prettyDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    dateStr,
    prettyDate,
    timeStr
  };
}
