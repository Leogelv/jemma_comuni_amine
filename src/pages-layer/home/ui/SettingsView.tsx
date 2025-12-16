'use client';

import React from 'react';
import { Trash2, User, Trophy, Calendar, Zap } from 'lucide-react';
import { Habit, useDeleteHabit } from '@/entities/habit';
import { CATEGORIES, type CategoryType } from '@/shared/config';
import { cn } from '@/shared/lib';
import styles from './SettingsView.module.css';

// SettingsView — вкладка настроек с управлением привычками

interface SettingsViewProps {
  habits: Habit[];
  user?: {
    telegram_id: number;
    username?: string;
    first_name?: string;
    total_points?: number;
    current_streak?: number;
  };
  telegramId?: number;
}

export function SettingsView({ habits, user, telegramId }: SettingsViewProps) {
  const deleteHabit = useDeleteHabit();

  const handleDelete = (habitId: string) => {
    if (telegramId && confirm('Удалить эту привычку?')) {
      deleteHabit.mutate({ habit_id: habitId, telegram_id: telegramId });
    }
  };

  const displayName = user?.first_name || user?.username || 'Пользователь';

  return (
    <div className={styles.container}>
      {/* Header */}
      <h2 className={styles.header}>Настройки</h2>

      {/* User Card */}
      <div className={styles.userCard}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            <User size={32} />
          </div>
          <div className={styles.userDetails}>
            <h3>{displayName}</h3>
            <p>ID: {user?.telegram_id || 'N/A'}</p>
          </div>
        </div>

        <div className={styles.userStats}>
          <div className={styles.userStat}>
            <div className={styles.userStatContent}>
              <Trophy size={16} className={styles.amber} />
              <span>{user?.total_points || 0}</span>
            </div>
            <p>Очков</p>
          </div>
          <div className={styles.userStat}>
            <div className={styles.userStatContent}>
              <Zap size={16} className={styles.orange} />
              <span>{habits.length}</span>
            </div>
            <p>Привычек</p>
          </div>
          <div className={styles.userStat}>
            <div className={styles.userStatContent}>
              <Calendar size={16} className={styles.emerald} />
              <span>{habits.reduce((acc, h) => acc + h.total_completions, 0)}</span>
            </div>
            <p>Всего</p>
          </div>
        </div>
      </div>

      {/* Habits Management */}
      <div className={styles.habitsCard}>
        <div className={styles.habitsHeader}>
          <h3>Мои привычки</h3>
        </div>

        {habits.length === 0 ? (
          <p className={styles.emptyHabits}>
            Пока нет привычек
          </p>
        ) : (
          <div className={styles.habitsList}>
            {habits.map((habit) => {
              const category = CATEGORIES[habit.category as CategoryType] || CATEGORIES.other;
              return (
                <div
                  key={habit.id}
                  className={styles.habitItem}
                >
                  <div className={styles.habitInfo}>
                    <span>{category.emoji}</span>
                    <div className={styles.habitDetails}>
                      <h4>{habit.title}</h4>
                      <p>
                        🔥 {habit.streak} дн. · {habit.total_completions} выполнений
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className={styles.deleteButton}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* App Info */}
      <div className={styles.appInfo}>
        <p>Anti Self-Deception v0.1.0</p>
        <p>Next.js 16 + Supabase + Telegram Mini App</p>
      </div>
    </div>
  );
}
