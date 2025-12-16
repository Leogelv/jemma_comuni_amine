'use client';

import React from 'react';
import {
  Trophy,
  Flame,
  Target,
  Award,
  Star,
  Zap,
  Crown,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Habit } from '@/entities/habit';
import { CATEGORIES } from '@/shared/config';
import { cn } from '@/shared/lib';
import { isSameDay, parseISO } from 'date-fns';
import { HeatmapCalendar } from '@/widgets/heatmap-calendar';
import { PointsChart, StreakChart } from '@/widgets/charts';
import styles from './ProgressView.module.css';

// ProgressView — вкладка прогресса с графиками и достижениями

interface ProgressViewProps {
  habits: Habit[];
  totalPoints: number;
}

export function ProgressView({ habits, totalPoints }: ProgressViewProps) {
  const today = new Date();

  // Вычисляем статистику
  const completedToday = habits.filter(h =>
    h.completed_dates.some(d => isSameDay(parseISO(d), today))
  ).length;

  const maxStreak = Math.max(...habits.map(h => h.streak), 0);
  const totalCompletions = habits.reduce((acc, h) => acc + h.total_completions, 0);

  // Достижения
  const achievements = [
    {
      icon: Flame,
      title: 'Первые шаги',
      description: 'Выполни 1 привычку',
      unlocked: totalCompletions >= 1,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      icon: Zap,
      title: 'Неделька',
      description: '7 дней подряд',
      unlocked: maxStreak >= 7,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
    {
      icon: Star,
      title: 'Стабильность',
      description: '30 выполнений',
      unlocked: totalCompletions >= 30,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
    },
    {
      icon: Crown,
      title: 'Легенда',
      description: '100 выполнений',
      unlocked: totalCompletions >= 100,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-500',
    },
  ];

  // Статистика по категориям
  const categoryStats = Object.entries(CATEGORIES).map(([id, cat]) => {
    const categoryHabits = habits.filter(h => h.category === id);
    const completions = categoryHabits.reduce((acc, h) => acc + h.total_completions, 0);
    return {
      ...cat,
      habitsCount: categoryHabits.length,
      completions,
    };
  }).filter(c => c.habitsCount > 0);

  // Основные stat-карточки
  const mainStats = [
    {
      icon: Trophy,
      label: 'Очки',
      value: totalPoints.toLocaleString(),
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
    {
      icon: Flame,
      label: 'Стрик',
      value: `${maxStreak}`,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      icon: Target,
      label: 'Сегодня',
      value: `${completedToday}/${habits.length}`,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      icon: TrendingUp,
      label: 'Всего',
      value: `${totalCompletions}`,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Прогресс</h2>
      </div>

      {/* Main Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statsGridInner}>
          {mainStats.map(({ icon: Icon, label, value, iconBg, iconColor }, index) => {
            // Определяем класс цвета для иконки
            const colorClass = iconBg.includes('amber') ? 'amber' :
                              iconBg.includes('orange') ? 'orange' :
                              iconBg.includes('emerald') ? 'emerald' :
                              iconBg.includes('indigo') ? 'indigo' : '';

            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={styles.statCard}
              >
                <div className={cn(styles.statIcon, styles[colorClass])}>
                  <Icon size={20} />
                </div>
                <div className={styles.value}>
                  {value}
                </div>
                <div className={styles.label}>
                  {label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Points Chart */}
      <div className={styles.section}>
        <PointsChart habits={habits} />
      </div>

      {/* Heatmap Calendar */}
      <div className={styles.section}>
        <HeatmapCalendar habits={habits} />
      </div>

      {/* Streak Chart */}
      {habits.length > 0 && (
        <div className={styles.section}>
          <StreakChart habits={habits} />
        </div>
      )}

      {/* Achievements */}
      <div className={styles.section}>
        <div className={styles.achievementsCard}>
          <h3>Достижения</h3>
          <div className={styles.achievementsGrid}>
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              const iconColorClass = achievement.iconColor.includes('orange') ? 'orange' :
                                    achievement.iconColor.includes('amber') ? 'amber' :
                                    achievement.iconColor.includes('indigo') ? 'indigo' :
                                    achievement.iconColor.includes('violet') ? 'violet' : '';

              return (
                <motion.div
                  key={achievement.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    styles.achievementItem,
                    achievement.unlocked ? styles.unlocked : styles.locked
                  )}
                >
                  <div className={cn(
                    styles.achievementIcon,
                    achievement.unlocked ? styles.unlocked : styles.locked
                  )}>
                    <Icon
                      size={20}
                      className={achievement.unlocked ? cn(styles[iconColorClass]) : cn(styles.muted)}
                    />
                  </div>
                  <h4 className={achievement.unlocked ? styles.unlocked : styles.locked}>
                    {achievement.title}
                  </h4>
                  <p>{achievement.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Stats */}
      {categoryStats.length > 0 && (
        <div className={styles.section}>
          <div className={styles.categoryStatsCard}>
            <h3>По категориям</h3>
            <div className={styles.categoryStatsList}>
              {categoryStats.map((cat) => (
                <div
                  key={cat.id}
                  className={styles.categoryStatItem}
                >
                  <div className={styles.categoryStatLeft}>
                    <div
                      className={styles.categoryStatBar}
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className={styles.categoryStatInfo}>
                      <div className={styles.categoryStatName}>
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </div>
                      <div className={styles.categoryStatMeta}>
                        {cat.habitsCount} привычек
                      </div>
                    </div>
                  </div>
                  <div className={styles.categoryStatRight}>
                    <div className={styles.categoryStatValue}>
                      {cat.completions}
                    </div>
                    <div className={styles.categoryStatLabel}>
                      выполнений
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
