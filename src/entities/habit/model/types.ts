import { CategoryType } from '@/shared/config';

export interface Habit {
  id: string;
  telegram_id: number;
  title: string;
  category: CategoryType;
  icon: string;      // Название иконки из lucide-react
  color: string;     // HEX цвет
  streak: number;
  completed_dates: string[]; // ISO Date strings YYYY-MM-DD
  total_completions: number;
  created_at: string;
  // Настройки напоминаний
  reminder_enabled: boolean;  // Включены ли напоминания для этой привычки
  reminder_time: string | null; // Время напоминания (HH:MM), если null — используется default юзера
}

export interface HabitPreset {
  id: string;
  title: string;
  category: CategoryType;
  icon: string;
  color: string;
  description?: string;
  sort_order: number;
  is_popular: boolean;
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
