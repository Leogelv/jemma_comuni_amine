// Автоматически сгенерировано из Supabase MCP
// Для регенерации: запустите generate_typescript_types через MCP
// Последнее обновление: 2026-01-07

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      habit_completions: {
        Row: {
          completed_date: string
          created_at: string | null
          habit_id: string
          id: string
          points_earned: number | null
          telegram_id: number
        }
        Insert: {
          completed_date: string
          created_at?: string | null
          habit_id: string
          id?: string
          points_earned?: number | null
          telegram_id: number
        }
        Update: {
          completed_date?: string
          created_at?: string | null
          habit_id?: string
          id?: string
          points_earned?: number | null
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_presets: {
        Row: {
          category: string | null
          color: string
          created_at: string | null
          description: string | null
          icon: string
          id: string
          is_popular: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          category?: string | null
          color?: string
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_popular?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          category?: string | null
          color?: string
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_popular?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          category: string | null
          color: string | null
          completed_dates: string[] | null
          created_at: string | null
          icon: string | null
          id: string
          reminder_enabled: boolean | null
          reminder_time: string | null
          streak: number | null
          telegram_id: number
          title: string
          total_completions: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          completed_dates?: string[] | null
          created_at?: string | null
          icon?: string | null
          id?: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak?: number | null
          telegram_id: number
          title: string
          total_completions?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          completed_dates?: string[] | null
          created_at?: string | null
          icon?: string | null
          id?: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          streak?: number | null
          telegram_id?: number
          title?: string
          total_completions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "tg_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      tg_users: {
        Row: {
          age: number | null
          created_at: string | null
          current_streak: number | null
          default_reminder_time: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          notifications_enabled: boolean | null
          photo_url: string | null
          telegram_id: number
          timezone: string | null
          total_points: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          current_streak?: number | null
          default_reminder_time?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          notifications_enabled?: boolean | null
          photo_url?: string | null
          telegram_id: number
          timezone?: string | null
          total_points?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          current_streak?: number | null
          default_reminder_time?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          notifications_enabled?: boolean | null
          photo_url?: string | null
          telegram_id?: number
          timezone?: string | null
          total_points?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          telegram_id: number
          unlocked_at: string | null
        }
        Insert: {
          achievement_id: string
          id?: string
          telegram_id: number
          unlocked_at?: string | null
        }
        Update: {
          achievement_id?: string
          id?: string
          telegram_id?: number
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "tg_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Хелперы для удобного использования типов
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Конкретные типы для использования в приложении
export type DbTgUser = Tables<'tg_users'>
export type DbHabit = Tables<'habits'>
export type DbHabitCompletion = Tables<'habit_completions'>
export type DbHabitPreset = Tables<'habit_presets'>
export type DbUserAchievement = Tables<'user_achievements'>
