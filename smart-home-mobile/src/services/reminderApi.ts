import { API_BASE_URL } from './api';

export type ReminderStatus = 'medication_time' | 'sleep_time' | 'none';

export interface PredictResult {
  activity: string;
  confidence: number;
  matched_timestamp?: string;
}

export interface ReminderResult {
  status: ReminderStatus;
  activity: string;
  confidence: number;
  time: string;
  message: string;
}

// Map backend activity labels → reminder status
const SLEEP_ACTIVITIES = new Set([
  'Sleep', 'Sleep_Out_Of_Bed', 'Bed_Toilet_Transition',
]);

// Activities that indicate it's medication/morning routine time
const MEDICATION_ACTIVITIES = new Set([
  'Personal_Hygiene', 'Dress', 'Eat_Dinner', 'Drink', 'Work_At_Table',
  'Wash_Breakfast_Dishes',
]);

export function mapActivityToReminder(activity: string, hour: number): ReminderStatus {
  if (SLEEP_ACTIVITIES.has(activity)) return 'sleep_time';

  // Medication heuristic: morning routine (6-9am) or evening (8-11pm) with hygiene/eating
  if (MEDICATION_ACTIVITIES.has(activity)) {
    const isMorningWindow = hour >= 6 && hour <= 9;
    const isEveningWindow = hour >= 20 && hour <= 23;
    if (isMorningWindow || isEveningWindow) return 'medication_time';
  }

  // Time-of-day fallback: sleep reminder between 9pm and midnight
  if (hour >= 21 || hour <= 5) {
    if (SLEEP_ACTIVITIES.has(activity)) return 'sleep_time';
  }

  return 'none';
}

export async function predictCurrentTime(): Promise<ReminderResult> {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const timeOnly = `${h}:${m}`;

  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ household: 'hh124', time_only: timeOnly }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Prediction failed (${res.status}): ${errText || res.statusText}`);
  }

  const data: PredictResult = await res.json();
  const status = mapActivityToReminder(data.activity, now.getHours());

  const messages: Record<ReminderStatus, string> = {
    medication_time: 'Time to take your medication 💊',
    sleep_time: 'Time to go to sleep 😴',
    none: 'No reminders right now.',
  };

  return {
    status,
    activity: data.activity,
    confidence: data.confidence ?? 0,
    time: timeOnly,
    message: messages[status],
  };
}
