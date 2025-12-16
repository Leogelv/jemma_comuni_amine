-- ============================================================================
-- ANTI SELF-DECEPTION - SUPABASE SCHEMA
-- ============================================================================
-- Запустите этот SQL в Supabase SQL Editor для создания таблиц
-- ============================================================================

-- Таблица пользователей Telegram
CREATE TABLE IF NOT EXISTS tg_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица привычек
CREATE TABLE IF NOT EXISTS habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL REFERENCES tg_users(telegram_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('sport', 'nutrition', 'regime', 'other')),
  streak INTEGER DEFAULT 0,
  completed_dates TEXT[] DEFAULT '{}',
  total_completions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица истории выполнений (для детальной аналитики)
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  completed_date DATE NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, completed_date)
);

-- Таблица достижений пользователя
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL REFERENCES tg_users(telegram_id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telegram_id, achievement_id)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_habits_telegram_id ON habits(telegram_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_telegram_id ON habit_completions(telegram_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_telegram_id ON user_achievements(telegram_id);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггер к таблицам
DROP TRIGGER IF EXISTS tg_users_updated_at ON tg_users;
CREATE TRIGGER tg_users_updated_at
  BEFORE UPDATE ON tg_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS habits_updated_at ON habits;
CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - опционально для продакшена
-- ALTER TABLE tg_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ГОТОВО! Теперь можно запускать приложение
-- ============================================================================
