'use client';

import React from 'react';
import { Trash2, User, Trophy, Calendar, Zap } from 'lucide-react';
import { Habit, useDeleteHabit } from '@/entities/habit';
import { CATEGORIES, type CategoryType } from '@/shared/config';
import { cn } from '@/shared/lib';

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
    <div className="p-6 pt-12 min-h-screen bg-[var(--background)] pb-32 safe-area-top">
      {/* Header */}
      <h2 className="text-3xl font-light text-gray-800 tracking-tight mb-8">
        Настройки
      </h2>

      {/* User Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <User size={32} className="text-indigo-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{displayName}</h3>
            <p className="text-sm text-gray-400">
              ID: {user?.telegram_id || 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy size={16} className="text-yellow-500" />
              <span className="text-xl font-bold text-gray-800">
                {user?.total_points || 0}
              </span>
            </div>
            <p className="text-xs text-gray-400">Очков</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap size={16} className="text-orange-500" />
              <span className="text-xl font-bold text-gray-800">
                {habits.length}
              </span>
            </div>
            <p className="text-xs text-gray-400">Привычек</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar size={16} className="text-green-500" />
              <span className="text-xl font-bold text-gray-800">
                {habits.reduce((acc, h) => acc + h.total_completions, 0)}
              </span>
            </div>
            <p className="text-xs text-gray-400">Всего</p>
          </div>
        </div>
      </div>

      {/* Habits Management */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Мои привычки
        </h3>

        {habits.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Пока нет привычек
          </p>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => {
              const category = CATEGORIES[habit.category as CategoryType] || CATEGORIES.other;
              return (
                <div
                  key={habit.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-2xl',
                    category.bgLight
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{category.emoji}</span>
                    <div>
                      <h4 className={cn('font-semibold', category.textColor)}>
                        {habit.title}
                      </h4>
                      <p className="text-xs text-gray-400">
                        🔥 {habit.streak} дн. · {habit.total_completions} выполнений
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-2 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <Trash2 size={18} className="text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="mt-6 text-center text-sm text-gray-400">
        <p>Anti Self-Deception v0.1.0</p>
        <p className="mt-1">Next.js 16 + Supabase + Telegram Mini App</p>
      </div>
    </div>
  );
}
