'use client';

import React, { useState, useMemo } from 'react';
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
import { getCategory } from '@/shared/config/categories';
import { cn } from '@/shared/lib';
import styles from './CalendarView.module.css';

// CalendarView — вкладка календаря с историей выполнений и фильтрами по привычкам

interface CalendarViewProps {
  habits: Habit[];
}

export function CalendarView({ habits }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  // null = показать все привычки с цветными точками
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Добавляем отступ для первого дня месяца
  const startDayOfWeek = (monthStart.getDay() + 6) % 7; // Пн=0, Вс=6
  const paddingDays = Array.from({ length: startDayOfWeek });

  // Фильтрованные привычки для подсчёта статистики
  const filteredHabits = useMemo(() => {
    if (selectedHabitId === null) return habits;
    return habits.filter(h => h.id === selectedHabitId);
  }, [habits, selectedHabitId]);

  // Получаем привычки выполненные в конкретный день
  const getCompletedHabitsForDay = (day: Date): Habit[] => {
    return habits.filter(h =>
      h.completed_dates.some(d => isSameDay(parseISO(d), day))
    );
  };

  // Подсчитываем выполнения на каждый день (для выбранной привычки или всех)
  const getDayCompletions = (day: Date): number => {
    return filteredHabits.filter(h =>
      h.completed_dates.some(d => isSameDay(parseISO(d), day))
    ).length;
  };

  // Общая статистика за месяц
  const totalMonthCompletions = daysInMonth.reduce(
    (acc, day) => acc + getDayCompletions(day),
    0
  );

  const maxPossibleCompletions = daysInMonth.length * filteredHabits.length;
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

      {/* Фильтры по привычкам */}
      {habits.length > 0 && (
        <div className={styles.filtersWrapper}>
          <div className={styles.filters}>
            <button
              className={cn(
                styles.filterChip,
                selectedHabitId === null && styles.filterChipActive
              )}
              onClick={() => setSelectedHabitId(null)}
            >
              Все
            </button>
            {habits.map(habit => {
              const category = getCategory(habit.category);
              const isActive = selectedHabitId === habit.id;
              return (
                <button
                  key={habit.id}
                  className={cn(
                    styles.filterChip,
                    isActive && styles.filterChipActive
                  )}
                  onClick={() => setSelectedHabitId(habit.id)}
                  style={{
                    '--chip-color': category.color,
                    '--chip-bg': category.colorLight,
                  } as React.CSSProperties}
                >
                  <span
                    className={styles.filterDot}
                    style={{ backgroundColor: category.color }}
                  />
                  {habit.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
            const completedHabits = getCompletedHabitsForDay(day);
            const isCurrentDay = isToday(day);

            // Режим "все привычки" — показываем цветные точки
            if (selectedHabitId === null) {
              return (
                <div key={day.toString()} className={styles.dayCell}>
                  <div
                    className={cn(
                      styles.dayButton,
                      styles.empty,
                      isCurrentDay && styles.today
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  {/* Цветные точки под числом */}
                  {completedHabits.length > 0 && (
                    <div className={styles.dotsContainer}>
                      {completedHabits.slice(0, 4).map(habit => {
                        const category = getCategory(habit.category);
                        return (
                          <span
                            key={habit.id}
                            className={styles.habitDot}
                            style={{ backgroundColor: category.color }}
                          />
                        );
                      })}
                      {completedHabits.length > 4 && (
                        <span className={styles.moreDots}>+{completedHabits.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Режим выбранной привычки — старый стиль с заливкой
            const completions = getDayCompletions(day);
            const hasCompletions = completions > 0;
            const selectedHabit = habits.find(h => h.id === selectedHabitId);
            const habitColor = selectedHabit ? getCategory(selectedHabit.category).color : undefined;

            return (
              <div key={day.toString()} className={styles.dayCell}>
                <div
                  className={cn(
                    styles.dayButton,
                    isCurrentDay && styles.today,
                    hasCompletions && styles.completed,
                    !hasCompletions && styles.empty
                  )}
                  style={hasCompletions && habitColor ? {
                    backgroundColor: habitColor,
                    color: 'white'
                  } : undefined}
                >
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Легенда цветов (только в режиме "Все") */}
      {selectedHabitId === null && habits.length > 0 && (
        <div className={styles.legend}>
          {habits.map(habit => {
            const category = getCategory(habit.category);
            return (
              <div key={habit.id} className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: category.color }}
                />
                <span className={styles.legendLabel}>{habit.title}</span>
              </div>
            );
          })}
        </div>
      )}

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
