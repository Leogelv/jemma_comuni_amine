'use client';

import React from 'react';
import { Trophy, Flame, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/shared/lib';
import { Habit } from '@/entities/habit';
import { format, isSameDay, parseISO, startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns';

interface StatsPanelProps {
  habits: Habit[];
  totalPoints: number;
  className?: string;
}

export function StatsPanel({ habits, totalPoints, className }: StatsPanelProps) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Статистика на сегодня
  const completedToday = habits.filter(h =>
    h.completed_dates.some(d => isSameDay(parseISO(d), today))
  ).length;

  // Максимальный стрик
  const maxStreak = Math.max(...habits.map(h => h.streak), 0);

  // Прогресс за неделю
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyCompletions = habits.reduce((acc, habit) => {
    const completionsThisWeek = habit.completed_dates.filter(d => {
      const date = parseISO(d);
      return date >= weekStart && date <= weekEnd;
    }).length;
    return acc + completionsThisWeek;
  }, 0);

  const maxWeeklyCompletions = habits.length * 7;
  const weeklyProgress = maxWeeklyCompletions > 0
    ? Math.round((weeklyCompletions / maxWeeklyCompletions) * 100)
    : 0;

  const stats = [
    {
      icon: Trophy,
      label: 'Очки',
      value: totalPoints.toLocaleString(),
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: Flame,
      label: 'Макс. стрик',
      value: `${maxStreak} дн.`,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Target,
      label: 'Сегодня',
      value: `${completedToday}/${habits.length}`,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: TrendingUp,
      label: 'Неделя',
      value: `${weeklyProgress}%`,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {stats.map(({ icon: Icon, label, value, color, bgColor }) => (
        <div
          key={label}
          className={cn(
            'rounded-2xl p-4 shadow-sm transition-transform hover:scale-[1.02]',
            bgColor
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon size={18} className={color} />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              {label}
            </span>
          </div>
          <div className={cn('text-2xl font-bold', color)}>{value}</div>
        </div>
      ))}
    </div>
  );
}
