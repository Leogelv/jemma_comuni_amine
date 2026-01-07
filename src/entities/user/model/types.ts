// Типы пользователя с настройками профиля и уведомлений

export type Gender = 'male' | 'female' | 'other';

export interface TgUser {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  total_points?: number;
  current_streak?: number;
  created_at?: string;
  updated_at?: string;
  // Профиль
  age?: number;
  gender?: Gender;
  timezone?: string;
  // Настройки уведомлений
  notifications_enabled?: boolean;
  default_reminder_time?: string; // HH:MM формат
}

export interface UpdateProfilePayload {
  telegram_id: number;
  first_name?: string;
  age?: number;
  gender?: Gender;
  timezone?: string;
  notifications_enabled?: boolean;
  default_reminder_time?: string;
}
