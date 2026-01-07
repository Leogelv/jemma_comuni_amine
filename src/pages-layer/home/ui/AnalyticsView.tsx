'use client';

import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
  subDays,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit } from '@/entities/habit';
import { CATEGORIES, getCategory } from '@/shared/config';
import { cn } from '@/shared/lib';
import { HeatmapCalendar } from '@/widgets/heatmap-calendar';
import styles from './AnalyticsView.module.css';

/**
 * AnalyticsView — объединённый раздел аналитики
 *
 * Показывает:
 * 1. Ключевые метрики (очки, лучший стрик, сегодня, успешность за неделю)
 * 2. Тепловая карта активности (heatmap)
 * 3. Мини-календарь с историей
 * 4. Статистика по категориям
 */

interface TgUser {
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
  total_points?: number;
  current_streak?: number;
}

interface AnalyticsViewProps {
  habits: Habit[];
  totalPoints: number;
  user?: TgUser | null;
}

type ViewMode = 'overview' | 'calendar';

export function AnalyticsView({ habits, totalPoints, user }: AnalyticsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();

  // === ВЫЧИСЛЯЕМЫЕ МЕТРИКИ ===

  // Привычки выполненные сегодня
  const completedToday = habits.filter(h =>
    h.completed_dates.some(d => isSameDay(parseISO(d), today))
  ).length;

  // Лучший текущий стрик среди всех привычек
  const maxStreak = Math.max(...habits.map(h => h.streak), 0);

  // Общее количество выполнений за всё время
  const totalCompletions = habits.reduce((acc, h) => acc + h.total_completions, 0);

  // Успешность за последние 7 дней
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i));
  const completionsLast7Days = last7Days.reduce((acc, day) => {
    return acc + habits.filter(h =>
      h.completed_dates.some(d => isSameDay(parseISO(d), day))
    ).length;
  }, 0);
  const weeklySuccessRate = habits.length > 0
    ? Math.round((completionsLast7Days / (habits.length * 7)) * 100)
    : 0;

  // Статистика по категориям
  const categoryStats = useMemo(() => {
    return Object.entries(CATEGORIES).map(([id, cat]) => {
      const categoryHabits = habits.filter(h => h.category === id);
      const completions = categoryHabits.reduce((acc, h) => acc + h.total_completions, 0);
      return {
        ...cat,
        habitsCount: categoryHabits.length,
        completions,
      };
    }).filter(c => c.habitsCount > 0);
  }, [habits]);

  // === КАЛЕНДАРЬ ===

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (monthStart.getDay() + 6) % 7;
  const paddingDays = Array.from({ length: startDayOfWeek });

  const getCompletedHabitsForDay = (day: Date): Habit[] => {
    return habits.filter(h =>
      h.completed_dates.some(d => isSameDay(parseISO(d), day))
    );
  };

  // === СТАТКАРТОЧКИ ===

  const mainStats = [
    {
      icon: Trophy,
      label: 'Очки',
      value: totalPoints.toLocaleString(),
      color: 'amber',
    },
    {
      icon: Flame,
      label: 'Лучший стрик',
      value: `${maxStreak} дн.`,
      color: 'orange',
    },
    {
      icon: Target,
      label: 'Сегодня',
      value: `${completedToday}/${habits.length}`,
      color: 'emerald',
    },
    {
      icon: TrendingUp,
      label: 'За неделю',
      value: `${weeklySuccessRate}%`,
      color: 'indigo',
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header с переключением режимов */}
      <div className={styles.header}>
        <h2>Аналитика</h2>
        <div className={styles.viewToggle}>
          <button
            onClick={() => setViewMode('overview')}
            className={cn(styles.toggleButton, viewMode === 'overview' && styles.active)}
          >
            <BarChart3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(styles.toggleButton, viewMode === 'calendar' && styles.active)}
          >
            <Calendar size={18} />
          </button>
        </div>
      </div>

      {viewMode === 'overview' ? (
        <>
          {/* Статистические карточки */}
          <div className={styles.statsGrid}>
            {mainStats.map(({ icon: Icon, label, value, color }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(styles.statCard, styles[color])}
              >
                <div className={styles.statIcon}>
                  <Icon size={20} />
                </div>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
              </motion.div>
            ))}
          </div>

          {/* Тепловая карта */}
          <div className={styles.section}>
            <HeatmapCalendar habits={habits} />
          </div>

          {/* Статистика по категориям */}
          {categoryStats.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionCard}>
                <h3 className={styles.sectionTitle}>По категориям</h3>
                <div className={styles.categoryList}>
                  {categoryStats.map((cat) => (
                    <div key={cat.id} className={styles.categoryItem}>
                      <div className={styles.categoryLeft}>
                        <div
                          className={styles.categoryBar}
                          style={{ backgroundColor: cat.color }}
                        />
                        <div className={styles.categoryInfo}>
                          <span className={styles.categoryName}>
                            {cat.emoji} {cat.label}
                          </span>
                          <span className={styles.categoryMeta}>
                            {cat.habitsCount} {cat.habitsCount === 1 ? 'привычка' : 'привычек'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.categoryRight}>
                        <div className={styles.categoryValue}>{cat.completions}</div>
                        <div className={styles.categorySubLabel}>выполнений</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Профиль пользователя */}
          {user && (
            <div className={styles.section}>
              <div className={styles.profileCard}>
                <div className={styles.profileAvatar}>
                  {user.photo_url ? (
                    <img src={user.photo_url} alt={user.first_name || 'User'} />
                  ) : (
                    <span>{(user.first_name || 'U').charAt(0)}</span>
                  )}
                </div>
                <div className={styles.profileInfo}>
                  <div className={styles.profileName}>
                    {user.first_name} {user.last_name}
                  </div>
                  {user.username && (
                    <div className={styles.profileUsername}>@{user.username}</div>
                  )}
                </div>
                <div className={styles.profileStats}>
                  <div className={styles.profileStat}>
                    <span className={styles.profileStatValue}>{totalCompletions}</span>
                    <span className={styles.profileStatLabel}>выполнений</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Режим календаря */}
          <div className={styles.calendarNavigation}>
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className={styles.calNavButton}
            >
              <ChevronLeft size={20} />
            </button>
            <span className={styles.calMonthLabel}>
              {format(currentDate, 'LLLL yyyy', { locale: ru })}
            </span>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className={styles.calNavButton}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className={styles.calendarCard}>
            {/* Days Header */}
            <div className={styles.calDaysHeader}>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                <div key={d} className={styles.calDayName}>
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

                return (
                  <div key={day.toString()} className={styles.calDayCell}>
                    <div
                      className={cn(
                        styles.calDayButton,
                        isCurrentDay && styles.calToday,
                        completedHabits.length > 0 && styles.calHasCompletions
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                    {/* Цветные точки под числом */}
                    {completedHabits.length > 0 && (
                      <div className={styles.calDotsContainer}>
                        {completedHabits.slice(0, 4).map(habit => {
                          const category = getCategory(habit.category);
                          return (
                            <span
                              key={habit.id}
                              className={styles.calHabitDot}
                              style={{ backgroundColor: category.color }}
                            />
                          );
                        })}
                        {completedHabits.length > 4 && (
                          <span className={styles.calMoreDots}>+{completedHabits.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Легенда привычек */}
          {habits.length > 0 && (
            <div className={styles.calLegend}>
              {habits.map(habit => {
                const category = getCategory(habit.category);
                return (
                  <div key={habit.id} className={styles.calLegendItem}>
                    <span
                      className={styles.calLegendDot}
                      style={{ backgroundColor: category.color }}
                    />
                    <span className={styles.calLegendLabel}>{habit.title}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
