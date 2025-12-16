'use client';

import React, { useState } from 'react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame } from 'lucide-react';
import { Habit, DayStatus } from '../model/types';
import { getCategory } from '@/shared/config';
import styles from './HabitCard.module.css';

// HabitCard — красивый минималистичный дизайн

interface HabitCardProps {
  habit: Habit;
  onToggleDate: (habitId: string, date: Date) => void;
}

export function HabitCard({ habit, onToggleDate }: HabitCardProps) {
  const [tappedDay, setTappedDay] = useState<string | null>(null);

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
      dayNumber: format(d, 'd'),
    };
  });

  const category = getCategory(habit.category);

  const handleDayClick = (day: DayStatus) => {
    setTappedDay(day.dateStr);
    onToggleDate(habit.id, day.date);
    setTimeout(() => setTappedDay(null), 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.card}
      data-category={habit.category}
    >
      {/* Цветовой акцент слева (вертикальная полоса) */}
      <div className={styles.categoryAccent} />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.categoryIcon}>
            {category.emoji}
          </div>
          <div className={styles.habitInfo}>
            <h3 className={styles.habitTitle}>
              {habit.title}
            </h3>
            <div className={styles.habitMeta}>
              <span className={styles.points}>
                +{category.points} очков
              </span>
            </div>
          </div>
        </div>

        {/* Streak Badge */}
        {habit.streak > 0 && (
          <div className={styles.streakBadge}>
            <Flame size={12} className={styles.streakIcon} />
            <span className={styles.streakCount}>
              {habit.streak}
            </span>
          </div>
        )}
      </div>

      {/* Days Grid */}
      <div className={styles.daysGrid}>
        {days.map((day) => {
          // Определяем, является ли день будущим (не включая сегодня)
          const isFuture = day.date > new Date() && !day.isToday;

          // Собираем CSS классы для кнопки дня
          const dayButtonClasses = [
            styles.dayButton,
            day.isCompleted && styles.completed,
            day.isToday && !day.isCompleted && styles.today,
          ].filter(Boolean).join(' ');

          return (
            <div key={day.dateStr} className={styles.dayColumn}>
              <span className={styles.dayName}>
                {day.dayName}
              </span>
              <motion.button
                onClick={() => !isFuture && handleDayClick(day)}
                whileTap={!isFuture ? { scale: 0.85 } : {}}
                animate={tappedDay === day.dateStr ? { scale: 1.15 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                disabled={isFuture}
                className={dayButtonClasses}
              >
                <AnimatePresence mode="wait">
                  {day.isCompleted ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 20,
                        duration: 0.3
                      }}
                      className={styles.checkmark}
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="number"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {day.dayNumber}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
