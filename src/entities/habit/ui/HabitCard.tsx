'use client';

import React from 'react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Habit, DayStatus } from '../model/types';
import { CATEGORIES, type CategoryType } from '@/shared/config';
import { cn } from '@/shared/lib';

interface HabitCardProps {
  habit: Habit;
  onToggleDate: (habitId: string, date: Date) => void;
}

export function HabitCard({ habit, onToggleDate }: HabitCardProps) {
  // Генерируем последние 7 дней включая сегодня
  const days: DayStatus[] = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    return {
      date: d,
      dateStr,
      isCompleted: habit.completed_dates.some(cd => isSameDay(parseISO(cd), d)),
      isToday: isSameDay(d, new Date()),
      dayName: format(d, 'EEEEEE', { locale: ru }).toUpperCase(),
      dayNumber: format(d, 'dd'),
    };
  });

  const category = CATEGORIES[habit.category as CategoryType] || CATEGORIES.other;

  return (
    <div className={cn(
      'rounded-3xl p-5 mb-4 shadow-sm transition-all duration-300 hover:scale-[1.01]',
      category.bgLight
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.emoji}</span>
          <h3 className={cn('text-xl font-bold', category.textColor)}>
            {habit.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium bg-white/50 px-2 py-1 rounded-lg">
            🔥 {habit.streak} дн.
          </span>
          <span className="text-xs text-gray-400 font-medium bg-white/50 px-2 py-1 rounded-lg">
            +{category.points} очков
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        {days.map((day) => (
          <div key={day.dateStr} className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">{day.dayName}</span>
            <button
              onClick={() => onToggleDate(habit.id, day.date)}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                day.isCompleted
                  ? cn(category.activeColor, 'text-white shadow-lg scale-110')
                  : cn('bg-white/60', category.textColor),
                day.isToday && !day.isCompleted && 'ring-2 ring-offset-2 ring-gray-300'
              )}
            >
              {day.isCompleted ? '✓' : day.dayNumber}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
