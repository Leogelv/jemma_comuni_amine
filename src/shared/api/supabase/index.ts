// Re-export supabase client и типы
export { createSupabaseBrowserClient, getSupabaseClient } from './browser';
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  DbTgUser,
  DbHabit,
  DbHabitCompletion,
  DbHabitPreset,
  DbUserAchievement,
} from './database.types';

// Экспорт синглтона supabase для удобства
import { getSupabaseClient } from './browser';

// Ленивый singleton — создаётся при первом обращении
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;
