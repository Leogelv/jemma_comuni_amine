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
import styles from './CalendarView.module.css';

// CalendarView — вкладка календаря с историей выполнений

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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2>История</h2>
        <div className={styles.navigation}>
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className={styles.navButton}
          >
            <ChevronLeft size={20} />
          </button>
          <span className={styles.monthLabel}>
            {format(currentDate, 'LLL yyyy', { locale: ru })}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className={styles.navButton}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className={styles.calendarCard}>
        {/* Days Header */}
        <div className={styles.daysHeader}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
            <div key={d} className={styles.dayName}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className={styles.calendarGrid}>
          {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}

          {daysInMonth.map(day => {
            const completions = getDayCompletions(day);
            const isCurrentDay = isToday(day);
            const hasCompletions = completions > 0;
            const allCompleted = completions === habits.length && habits.length > 0;

            return (
              <div key={day.toString()} className={styles.dayCell}>
                <div
                  className={cn(
                    styles.dayButton,
                    isCurrentDay && styles.today,
                    allCompleted && styles.complete,
                    hasCompletions && !allCompleted && styles.partial,
                    !hasCompletions && styles.empty
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Blocks */}
      <div className={styles.statsGrid}>
        <div className={styles.statBlock}>
          <div className={styles.value}>
            {totalMonthCompletions}
          </div>
          <div className={styles.label}>
            Выполнено за месяц
          </div>
        </div>
        <div className={styles.statBlock}>
          <div className={styles.value}>{monthlyProgress}%</div>
          <div className={styles.label}>
            Успешность
          </div>
        </div>
      </div>
    </div>
  );
}
