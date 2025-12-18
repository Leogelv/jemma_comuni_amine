'use client';

import React, { useState } from 'react';
import { format, addDays, isSameDay, parseISO, isAfter, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Habit, DayStatus } from '../model/types';
import styles from './HabitCard.module.css';

// HabitCard — дизайн как в habitflow-ai

interface HabitCardProps {
  habit: Habit;
  onToggleDate: (habitId: string, date: Date) => void;
  weekStart: Date;
}

// Тип анимации при клике
type AnimationType = 'complete' | 'uncomplete' | null;

export function HabitCard({ habit, onToggleDate, weekStart }: HabitCardProps) {
  // Храним анимацию для каждого дня: dateStr -> тип анимации
  const [animatingDays, setAnimatingDays] = useState<Record<string, AnimationType>>({});
  const today = startOfDay(new Date());

  // Генерируем 7 дней выбранной недели
  const days: DayStatus[] = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(weekStart, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    return {
      date: d,
      dateStr,
      isCompleted: habit.completed_dates.some(cd => isSameDay(parseISO(cd), d)),
      isToday: isSameDay(d, today),
      dayName: format(d, 'EEEEEE', { locale: ru }).charAt(0).toUpperCase() + format(d, 'EEEEEE', { locale: ru }).slice(1),
      dayNumber: format(d, 'd'),
    };
  });

  const handleDayClick = (day: DayStatus) => {
    // Определяем тип анимации (до toggle)
    const animType: AnimationType = day.isCompleted ? 'uncomplete' : 'complete';

    // Запускаем анимацию
    setAnimatingDays(prev => ({ ...prev, [day.dateStr]: animType }));

    // Вызываем toggle
    onToggleDate(habit.id, day.date);

    // Убираем анимацию через 600ms
    setTimeout(() => {
      setAnimatingDays(prev => ({ ...prev, [day.dateStr]: null }));
    }, 600);
  };

  // Streak текст
  const streakText = habit.streak === 1
    ? '1 день подряд'
    : habit.streak > 1
      ? `${habit.streak} ${habit.streak < 5 ? 'дня' : 'дней'} подряд`
      : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.card}
      data-category={habit.category}
    >
      {/* Header: название слева, streak справа */}
      <div className={styles.header}>
        <h3 className={styles.title}>{habit.title}</h3>
        {habit.streak > 0 && (
          <span className={styles.streak}>{streakText}</span>
        )}
      </div>

      {/* Days Grid */}
      <div className={styles.daysGrid}>
        {days.map((day) => {
          const isFuture = isAfter(startOfDay(day.date), today);
          const animState = animatingDays[day.dateStr];

          const dayButtonClasses = [
            styles.dayButton,
            day.isCompleted && styles.completed,
            day.isToday && !day.isCompleted && styles.today,
            isFuture && styles.future,
            animState === 'complete' && styles.justCompleted,
            animState === 'uncomplete' && styles.justUncompleted,
          ].filter(Boolean).join(' ');

          return (
            <div key={day.dateStr} className={styles.dayColumn}>
              <span className={styles.dayName}>{day.dayName}</span>
              <button
                onClick={() => !isFuture && handleDayClick(day)}
                disabled={isFuture}
                className={dayButtonClasses}
              >
                {day.dayNumber}
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
