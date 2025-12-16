'use client';

import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit } from '@/entities/habit';
import { cn } from '@/shared/lib';

interface CalendarViewProps {
  habits: Habit[];
}

export function CalendarView({ habits }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Добавляем отступ для первого дня месяца
  const startDayOfWeek = (monthStart.getDay() + 6) % 7; // Пн=0, Вс=6
  const paddingDays = Array.from({ length: startDayOfWeek });

  // Подсчитываем выполнения на каждый день
  const getDayCompletions = (day: Date): number => {
    return habits.filter(h =>
      h.completed_dates.some(d => isSameDay(parseISO(d), day))
    ).length;
  };

  // Общая статистика за месяц
  const totalMonthCompletions = daysInMonth.reduce(
    (acc, day) => acc + getDayCompletions(day),
    0
  );

  const maxPossibleCompletions = daysInMonth.length * habits.length;
  const monthlyProgress = maxPossibleCompletions > 0
    ? Math.round((totalMonthCompletions / maxPossibleCompletions) * 100)
    : 0;

  return (
    <div className="p-6 pt-12 min-h-screen bg-[var(--background)] pb-32 safe-area-top">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-light text-gray-800 capitalize tracking-tight">
          История
        </h2>
        <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-sm">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-gray-700 w-24 text-center capitalize">
            {format(currentDate, 'LLL yyyy', { locale: ru })}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-6 text-center">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
            <div key={d} className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-4 gap-x-1 text-center">
          {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}

          {daysInMonth.map(day => {
            const completions = getDayCompletions(day);
            const isCurrentDay = isToday(day);
            const hasCompletions = completions > 0;
            const allCompleted = completions === habits.length && habits.length > 0;

            return (
              <div key={day.toString()} className="flex justify-center">
                <div
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all relative',
                    isCurrentDay && 'ring-2 ring-indigo-500 ring-offset-2',
                    allCompleted && 'bg-green-500 text-white shadow-lg shadow-green-200',
                    hasCompletions && !allCompleted && 'bg-indigo-100 text-indigo-600',
                    !hasCompletions && !isCurrentDay && 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {format(day, 'd')}
                  {hasCompletions && !allCompleted && (
                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[8px] text-indigo-400">
                      {completions}/{habits.length}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Blocks */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {totalMonthCompletions}
          </div>
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Выполнено за месяц
          </div>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-800 mb-1">{monthlyProgress}%</div>
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Успешность
          </div>
        </div>
      </div>
    </div>
  );
}
