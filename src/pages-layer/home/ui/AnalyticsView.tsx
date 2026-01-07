'use client';

import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  differenceInDays,
  startOfWeek,
  eachWeekOfInterval,
  subWeeks,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { Habit } from '@/entities/habit';
import { CATEGORIES, getCategory } from '@/shared/config';
import { cn } from '@/shared/lib';
import styles from './AnalyticsView.module.css';

/**
 * AnalyticsView — объединённый раздел аналитики с детальным просмотром по привычкам
 *
 * Режимы:
 * 1. Overview — общая статистика + список привычек для перехода в детальный просмотр
 * 2. HabitDetail — детальная статистика по одной привычке с графиками
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

export function AnalyticsView({ habits, totalPoints, user }: AnalyticsViewProps) {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [detailMonth, setDetailMonth] = useState(new Date());

  const today = new Date();
  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  // === ОБЩИЕ МЕТРИКИ ===

  const completedToday = habits.filter(h =>
    h.completed_dates.some(d => isSameDay(parseISO(d), today))
  ).length;

  const maxStreak = Math.max(...habits.map(h => h.streak), 0);
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

  // === СТАТИСТИКА ПО КАТЕГОРИЯМ ===

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

  // === МЕТРИКИ ДЛЯ ДЕТАЛЬНОГО ПРОСМОТРА ПРИВЫЧКИ ===

  const habitDetailStats = useMemo(() => {
    if (!selectedHabit) return null;

    const dates = selectedHabit.completed_dates.map(d => parseISO(d));
    const sortedDates = dates.sort((a, b) => b.getTime() - a.getTime());

    // Последние 30 дней — сколько из них выполнено
    const last30Days = Array.from({ length: 30 }, (_, i) => subDays(today, i));
    const completedLast30 = last30Days.filter(day =>
      dates.some(d => isSameDay(d, day))
    ).length;

    // Последние 7 дней
    const completedLast7 = last7Days.filter(day =>
      dates.some(d => isSameDay(d, day))
    ).length;

    // Лучший стрик за всё время (пересчитываем вручную)
    let bestStreak = 0;
    let currentStreak = 0;
    const uniqueDates = [...new Set(selectedHabit.completed_dates)].sort();

    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = parseISO(uniqueDates[i - 1]);
        const currDate = parseISO(uniqueDates[i]);
        const diff = differenceInDays(currDate, prevDate);
        if (diff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, currentStreak);
    }

    // Дней с начала отслеживания
    const createdAt = parseISO(selectedHabit.created_at);
    const daysSinceCreation = differenceInDays(today, createdAt) + 1;

    // Общий % успешности
    const overallRate = daysSinceCreation > 0
      ? Math.round((selectedHabit.total_completions / daysSinceCreation) * 100)
      : 0;

    // Данные для недельного графика (последние 12 недель)
    const last12Weeks = Array.from({ length: 12 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(today, 11 - i), { weekStartsOn: 1 });
      const weekDays = Array.from({ length: 7 }, (_, j) => subDays(weekStart, -j));
      const completed = weekDays.filter(day =>
        dates.some(d => isSameDay(d, day))
      ).length;
      return {
        weekStart,
        completed,
        label: format(weekStart, 'd MMM', { locale: ru }),
      };
    });

    return {
      completedLast7,
      completedLast30,
      bestStreak,
      daysSinceCreation,
      overallRate,
      last12Weeks,
      firstCompletion: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null,
      lastCompletion: sortedDates.length > 0 ? sortedDates[0] : null,
    };
  }, [selectedHabit, today]);

  // === КАЛЕНДАРЬ ДЛЯ ДЕТАЛЬНОГО ПРОСМОТРА ===

  const monthStart = startOfMonth(detailMonth);
  const monthEnd = endOfMonth(detailMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (monthStart.getDay() + 6) % 7;
  const paddingDays = Array.from({ length: startDayOfWeek });

  const isCompletedOnDay = (day: Date): boolean => {
    if (!selectedHabit) return false;
    return selectedHabit.completed_dates.some(d => isSameDay(parseISO(d), day));
  };

  // === ГЛАВНЫЕ СТАТКАРТЫ ===

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

  // === РЕНДЕР ДЕТАЛЬНОГО ПРОСМОТРА ПРИВЫЧКИ ===

  if (selectedHabit && habitDetailStats) {
    const category = getCategory(selectedHabit.category);
    const maxWeeklyCompleted = Math.max(...habitDetailStats.last12Weeks.map(w => w.completed), 1);

    return (
      <div className={styles.container}>
        {/* Шапка с кнопкой назад */}
        <div className={styles.detailHeader}>
          <button
            onClick={() => setSelectedHabitId(null)}
            className={styles.backButton}
          >
            <ArrowLeft size={20} />
          </button>
          <div className={styles.detailTitleBlock}>
            <span
              className={styles.habitColorDot}
              style={{ backgroundColor: category.color }}
            />
            <h2 className={styles.detailTitle}>{selectedHabit.title}</h2>
          </div>
        </div>

        {/* Основные показатели привычки */}
        <div className={styles.habitStatsGrid}>
          <div className={styles.habitStatCard}>
            <Flame size={20} className={styles.habitStatIcon} style={{ color: '#F97316' }} />
            <div className={styles.habitStatValue}>{selectedHabit.streak}</div>
            <div className={styles.habitStatLabel}>Текущий стрик</div>
          </div>
          <div className={styles.habitStatCard}>
            <Zap size={20} className={styles.habitStatIcon} style={{ color: '#8B5CF6' }} />
            <div className={styles.habitStatValue}>{habitDetailStats.bestStreak}</div>
            <div className={styles.habitStatLabel}>Лучший стрик</div>
          </div>
          <div className={styles.habitStatCard}>
            <CheckCircle2 size={20} className={styles.habitStatIcon} style={{ color: '#10B981' }} />
            <div className={styles.habitStatValue}>{selectedHabit.total_completions}</div>
            <div className={styles.habitStatLabel}>Всего</div>
          </div>
          <div className={styles.habitStatCard}>
            <TrendingUp size={20} className={styles.habitStatIcon} style={{ color: '#3B82F6' }} />
            <div className={styles.habitStatValue}>{habitDetailStats.overallRate}%</div>
            <div className={styles.habitStatLabel}>Успешность</div>
          </div>
        </div>

        {/* Недельный график (bar chart) */}
        <div className={styles.section}>
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Выполнения за 12 недель</h3>
            <div className={styles.weeklyChart}>
              {habitDetailStats.last12Weeks.map((week, i) => (
                <div key={i} className={styles.weeklyBar}>
                  <div className={styles.barContainer}>
                    <motion.div
                      className={styles.bar}
                      initial={{ height: 0 }}
                      animate={{ height: `${(week.completed / 7) * 100}%` }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                  <span className={styles.barLabel}>{week.completed}</span>
                </div>
              ))}
            </div>
            <div className={styles.weeklyLabels}>
              {habitDetailStats.last12Weeks.filter((_, i) => i % 3 === 0).map((week, i) => (
                <span key={i} className={styles.weekLabel}>{week.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className={styles.section}>
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Прогресс</h3>

            <div className={styles.progressItem}>
              <div className={styles.progressHeader}>
                <span>За последние 7 дней</span>
                <span className={styles.progressValue}>{habitDetailStats.completedLast7}/7</span>
              </div>
              <div className={styles.progressBar}>
                <motion.div
                  className={styles.progressFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${(habitDetailStats.completedLast7 / 7) * 100}%` }}
                  style={{ backgroundColor: category.color }}
                />
              </div>
            </div>

            <div className={styles.progressItem}>
              <div className={styles.progressHeader}>
                <span>За последние 30 дней</span>
                <span className={styles.progressValue}>{habitDetailStats.completedLast30}/30</span>
              </div>
              <div className={styles.progressBar}>
                <motion.div
                  className={styles.progressFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${(habitDetailStats.completedLast30 / 30) * 100}%` }}
                  style={{ backgroundColor: category.color }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Календарь месяца */}
        <div className={styles.section}>
          <div className={styles.sectionCard}>
            <div className={styles.calendarNavigation}>
              <button
                onClick={() => setDetailMonth(subMonths(detailMonth, 1))}
                className={styles.calNavButton}
              >
                <ChevronLeft size={20} />
              </button>
              <span className={styles.calMonthLabel}>
                {format(detailMonth, 'LLLL yyyy', { locale: ru })}
              </span>
              <button
                onClick={() => setDetailMonth(addMonths(detailMonth, 1))}
                className={styles.calNavButton}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className={styles.calDaysHeader}>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                <div key={d} className={styles.calDayName}>{d}</div>
              ))}
            </div>

            <div className={styles.calendarGrid}>
              {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
              {daysInMonth.map(day => {
                const completed = isCompletedOnDay(day);
                const isCurrentDay = isToday(day);
                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      styles.calDayCell,
                      completed && styles.calDayCompleted,
                      isCurrentDay && styles.calDayToday
                    )}
                    style={completed ? { backgroundColor: category.color } : undefined}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Инфо о привычке */}
        <div className={styles.section}>
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Информация</h3>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Категория</span>
                <span className={styles.infoValue}>{category.emoji} {category.label}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Создана</span>
                <span className={styles.infoValue}>
                  {format(parseISO(selectedHabit.created_at), 'd MMMM yyyy', { locale: ru })}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Дней отслеживания</span>
                <span className={styles.infoValue}>{habitDetailStats.daysSinceCreation}</span>
              </div>
              {habitDetailStats.lastCompletion && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Последнее выполнение</span>
                  <span className={styles.infoValue}>
                    {format(habitDetailStats.lastCompletion, 'd MMMM yyyy', { locale: ru })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === РЕНДЕР ОСНОВНОГО OVERVIEW ===

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Аналитика</h2>
      </div>

      {/* Общие статкарточки */}
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

      {/* Список привычек для детального просмотра */}
      {habits.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Привычки</h3>
            <div className={styles.habitsList}>
              {habits.map((habit, index) => {
                const category = getCategory(habit.category);
                const completedTodayHabit = habit.completed_dates.some(d =>
                  isSameDay(parseISO(d), today)
                );

                return (
                  <motion.button
                    key={habit.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedHabitId(habit.id)}
                    className={styles.habitItem}
                  >
                    <div className={styles.habitLeft}>
                      <div
                        className={styles.habitColorBar}
                        style={{ backgroundColor: category.color }}
                      />
                      <div className={styles.habitInfo}>
                        <span className={styles.habitName}>{habit.title}</span>
                        <span className={styles.habitMeta}>
                          {category.emoji} {habit.streak > 0 ? `${habit.streak} дн. стрик` : 'Нет стрика'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.habitRight}>
                      {completedTodayHabit ? (
                        <CheckCircle2 size={20} style={{ color: '#10B981' }} />
                      ) : (
                        <Circle size={20} style={{ color: '#D1D5DB' }} />
                      )}
                      <ChevronRight size={18} className={styles.habitChevron} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
