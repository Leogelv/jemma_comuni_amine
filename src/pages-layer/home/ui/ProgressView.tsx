'use client';

import React from 'react';
import {
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Award,
  Star,
  Zap,
  Crown,
} from 'lucide-react';
import { Habit } from '@/entities/habit';
import { CATEGORIES, type CategoryType } from '@/shared/config';
import { cn } from '@/shared/lib';
import {
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subWeeks,
} from 'date-fns';
import { ru } from 'date-fns/locale';

interface ProgressViewProps {
  habits: Habit[];
  totalPoints: number;
}

export function ProgressView({ habits, totalPoints }: ProgressViewProps) {
  const today = new Date();

  // Вычисляем статистику
  const completedToday = habits.filter(h =>
    h.completed_dates.some(d => isSameDay(parseISO(d), today))
  ).length;

  const maxStreak = Math.max(...habits.map(h => h.streak), 0);
  const totalCompletions = habits.reduce((acc, h) => acc + h.total_completions, 0);

  // Прогресс за последние 4 недели
  const weeklyData = Array.from({ length: 4 }).map((_, i) => {
    const weekStart = startOfWeek(subWeeks(today, 3 - i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const completions = habits.reduce((acc, habit) => {
      return acc + habit.completed_dates.filter(d => {
        const date = parseISO(d);
        return date >= weekStart && date <= weekEnd;
      }).length;
    }, 0);

    const maxCompletions = habits.length * 7;
    const progress = maxCompletions > 0 ? Math.round((completions / maxCompletions) * 100) : 0;

    return {
      label: format(weekStart, 'd MMM', { locale: ru }),
      progress,
      completions,
    };
  });

  // Достижения
  const achievements = [
    {
      icon: Flame,
      title: 'Первые шаги',
      description: 'Выполни 1 привычку',
      unlocked: totalCompletions >= 1,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Zap,
      title: 'Неделька',
      description: '7 дней подряд',
      unlocked: maxStreak >= 7,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: Star,
      title: 'Стабильность',
      description: '30 выполнений',
      unlocked: totalCompletions >= 30,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Crown,
      title: 'Легенда',
      description: '100 выполнений',
      unlocked: totalCompletions >= 100,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  // Статистика по категориям
  const categoryStats = Object.entries(CATEGORIES).map(([id, cat]) => {
    const categoryHabits = habits.filter(h => h.category === id);
    const completions = categoryHabits.reduce((acc, h) => acc + h.total_completions, 0);
    return {
      ...cat,
      habitsCount: categoryHabits.length,
      completions,
    };
  }).filter(c => c.habitsCount > 0);

  return (
    <div className="p-6 pt-12 min-h-screen bg-[var(--background)] pb-32 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-light text-gray-800 tracking-tight">
          Прогресс
        </h2>
        <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl">
          <Trophy size={20} className="text-yellow-500" />
          <span className="text-xl font-bold text-yellow-600">{totalPoints}</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-green-500" />
            <span className="text-xs text-gray-500 font-medium uppercase">Сегодня</span>
          </div>
          <div className="text-2xl font-bold text-green-500">
            {completedToday}/{habits.length}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={18} className="text-orange-500" />
            <span className="text-xs text-gray-500 font-medium uppercase">Макс. стрик</span>
          </div>
          <div className="text-2xl font-bold text-orange-500">{maxStreak} дн.</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Award size={18} className="text-indigo-500" />
            <span className="text-xs text-gray-500 font-medium uppercase">Всего</span>
          </div>
          <div className="text-2xl font-bold text-indigo-500">{totalCompletions}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-purple-500" />
            <span className="text-xs text-gray-500 font-medium uppercase">Привычек</span>
          </div>
          <div className="text-2xl font-bold text-purple-500">{habits.length}</div>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">За последние 4 недели</h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {weeklyData.map((week, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-100 rounded-full overflow-hidden h-24 flex flex-col-reverse">
                <div
                  className="bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ height: `${week.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 mt-2 font-medium">{week.label}</span>
              <span className="text-xs text-indigo-500 font-bold">{week.progress}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Достижения</h3>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.title}
                className={cn(
                  'rounded-2xl p-4 transition-all',
                  achievement.unlocked
                    ? achievement.bgColor
                    : 'bg-gray-100 opacity-50'
                )}
              >
                <Icon
                  size={24}
                  className={achievement.unlocked ? achievement.color : 'text-gray-400'}
                />
                <h4 className={cn(
                  'font-semibold mt-2',
                  achievement.unlocked ? 'text-gray-800' : 'text-gray-500'
                )}>
                  {achievement.title}
                </h4>
                <p className="text-xs text-gray-400">{achievement.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Stats */}
      {categoryStats.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">По категориям</h3>
          <div className="space-y-3">
            {categoryStats.map((cat) => (
              <div
                key={cat.id}
                className={cn('rounded-2xl p-4', cat.bgLight)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.emoji}</span>
                    <span className={cn('font-semibold', cat.textColor)}>
                      {cat.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={cn('font-bold', cat.textColor)}>
                      {cat.completions} выполнений
                    </div>
                    <div className="text-xs text-gray-400">
                      {cat.habitsCount} привычек
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
