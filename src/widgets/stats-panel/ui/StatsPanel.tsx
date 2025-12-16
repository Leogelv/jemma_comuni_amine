'use client';

import React from 'react';
import { Trophy, Flame, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { Habit } from '@/entities/habit';
import { isSameDay, parseISO } from 'date-fns';
import styles from './StatsPanel.module.css';

// StatsPanel — карточки статистики с glassmorphism

interface StatsPanelProps {
  habits: Habit[];
  totalPoints: number;
  className?: string;
}

export function StatsPanel({ habits, totalPoints, className }: StatsPanelProps) {
  const today = new Date();

  // Статистика на сегодня
  const completedToday = habits.filter(h =>
    h.completed_dates.some(d => isSameDay(parseISO(d), today))
  ).length;

  // Максимальный стрик
  const maxStreak = Math.max(...habits.map(h => h.streak), 0);

  const stats = [
    {
      icon: Trophy,
      label: 'Очки',
      value: totalPoints.toLocaleString(),
      iconType: 'trophy' as const,
    },
    {
      icon: Flame,
      label: 'Макс. стрик',
      value: `${maxStreak} дн.`,
      iconType: 'flame' as const,
    },
    {
      icon: Target,
      label: 'Сегодня',
      value: `${completedToday}/${habits.length}`,
      iconType: 'target' as const,
    },
  ];

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {stats.map(({ icon: Icon, label, value, iconType }, index) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className={styles.card}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <Icon size={18} className={`${styles.icon} ${styles[iconType]}`} />
          <div className={styles.value}>
            {value}
          </div>
          <div className={styles.label}>
            {label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
