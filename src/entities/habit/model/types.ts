import { CategoryType } from '@/shared/config';

export interface Habit {
  id: string;
  telegram_id: number;
  title: string;
  category: CategoryType;
  streak: number;
  completed_dates: string[]; // ISO Date strings YYYY-MM-DD
  total_completions: number;
  created_at: string;
}

export interface DayStatus {
  date: Date;
  dateStr: string;
  isCompleted: boolean;
  isToday: boolean;
  dayName: string;
  dayNumber: string;
}

export interface HabitStats {
  totalHabits: number;
  completedToday: number;
  currentStreak: number;
  totalCompletions: number;
  weeklyProgress: number; // Процент выполнения за неделю
}
