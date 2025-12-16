// Автоматически сгенерировано из Supabase MCP
// Для регенерации: запустите generate_typescript_types через MCP

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
      habits: {
        Row: {
          category: string | null
          completed_dates: string[] | null
          created_at: string | null
          id: string
          streak: number | null
          telegram_id: number
          title: string
          total_completions: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          completed_dates?: string[] | null
          created_at?: string | null
          id?: string
          streak?: number | null
          telegram_id: number
          title: string
          total_completions?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          completed_dates?: string[] | null
          created_at?: string | null
          id?: string
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
          created_at: string | null
          current_streak: number | null
          first_name: string | null
          id: string
          last_name: string | null
          photo_url: string | null
          telegram_id: number
          total_points: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          photo_url?: string | null
          telegram_id: number
          total_points?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          photo_url?: string | null
          telegram_id?: number
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
export type TgUser = Tables<'tg_users'>
export type Habit = Tables<'habits'>
export type HabitCompletion = Tables<'habit_completions'>
export type UserAchievement = Tables<'user_achievements'>
