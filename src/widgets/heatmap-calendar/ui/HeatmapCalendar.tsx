'use client';

import React, { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  isSameDay,
  parseISO,
  getDay,
  startOfWeek
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit } from '@/entities/habit';
import styles from './HeatmapCalendar.module.css';

// HeatmapCalendar — GitHub-style календарь активности

interface HeatmapCalendarProps {
  habits: Habit[];
  className?: string;
}

// Интенсивность цвета в зависимости от количества выполненных привычек
function getIntensityClass(count: number, maxCount: number): string {
  if (count === 0) return styles.intensity0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return styles.intensity1;
  if (ratio <= 0.5) return styles.intensity2;
  if (ratio <= 0.75) return styles.intensity3;
  return styles.intensity4;
}

export function HeatmapCalendar({ habits, className }: HeatmapCalendarProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const currentMonth = useMemo(() => {
    return subMonths(new Date(), monthOffset);
  }, [monthOffset]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Все дни месяца
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Смещение для первого дня (чтобы начать с понедельника)
  const startDayOfWeek = getDay(monthStart);
  const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Понедельник = 0

  // Подсчёт выполненных привычек для каждого дня
  const dayStats = useMemo(() => {
    const stats: Record<string, number> = {};

    daysInMonth.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = habits.filter(habit =>
        habit.completed_dates.some(d => isSameDay(parseISO(d), day))
      ).length;
      stats[dayStr] = count;
    });

    return stats;
  }, [habits, daysInMonth]);

  const maxCompletions = Math.max(...Object.values(dayStats), 1);

  // Информация о выбранном дне
  const selectedDayInfo = useMemo(() => {
    if (!selectedDay) return null;
    const dayStr = format(selectedDay, 'yyyy-MM-dd');
    const completedHabits = habits.filter(habit =>
      habit.completed_dates.some(d => isSameDay(parseISO(d), selectedDay))
    );
    return {
      date: selectedDay,
      count: dayStats[dayStr] || 0,
      habits: completedHabits,
    };
  }, [selectedDay, habits, dayStats]);

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Header с навигацией */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </h3>
        <div className={styles.navigation}>
          <button
            onClick={() => setMonthOffset(prev => prev + 1)}
            className={styles.navButton}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setMonthOffset(prev => Math.max(0, prev - 1))}
            disabled={monthOffset === 0}
            className={styles.navButton}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Дни недели */}
      <div className={styles.weekDays}>
        {weekDays.map(day => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      {/* Календарная сетка */}
      <div className={styles.grid}>
        {/* Пустые ячейки для смещения */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} style={{ aspectRatio: '1' }} />
        ))}

        {/* Дни месяца */}
        {daysInMonth.map((day, index) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const count = dayStats[dayStr] || 0;
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDay && isSameDay(day, selectedDay);

          const dayClasses = [
            styles.day,
            getIntensityClass(count, maxCompletions),
            isToday && styles.today,
            isSelected && styles.selected
          ].filter(Boolean).join(' ');

          return (
            <motion.button
              key={dayStr}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={dayClasses}
              title={`${format(day, 'd MMMM', { locale: ru })}: ${count} из ${habits.length}`}
            />
          );
        })}
      </div>

      {/* Легенда */}
      <div className={styles.legend}>
        <span className={`${styles.legendLabel} ${styles.left}`}>Меньше</span>
        <div className={`${styles.legendBox} ${styles.intensity0}`} />
        <div className={`${styles.legendBox} ${styles.intensity1}`} />
        <div className={`${styles.legendBox} ${styles.intensity2}`} />
        <div className={`${styles.legendBox} ${styles.intensity3}`} />
        <div className={`${styles.legendBox} ${styles.intensity4}`} />
        <span className={`${styles.legendLabel} ${styles.right}`}>Больше</span>
      </div>

      {/* Tooltip для выбранного дня */}
      {selectedDayInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.selectedInfo}
        >
          <div className={styles.selectedDate}>
            {format(selectedDayInfo.date, 'd MMMM yyyy', { locale: ru })}
          </div>
          <div className={styles.selectedCount}>
            Выполнено: {selectedDayInfo.count} из {habits.length} привычек
          </div>
          {selectedDayInfo.habits.length > 0 && (
            <div className={styles.selectedHabits}>
              {selectedDayInfo.habits.map(habit => (
                <span
                  key={habit.id}
                  className={styles.habitBadge}
                >
                  {habit.title}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
