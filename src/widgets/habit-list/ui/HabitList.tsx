'use client';

import React from 'react';
import { HabitCard } from '@/entities/habit/ui/HabitCard';
import { Habit } from '@/entities/habit';
import styles from './HabitList.module.css';

// HabitList — контейнер для списка привычек с поддержкой навигации по неделям

interface HabitListProps {
  habits: Habit[];
  onToggleDate: (habitId: string, date: Date) => void;
  onUpdate?: (habitId: string, data: { title?: string; icon?: string }) => void;
  onDelete?: (habitId: string) => void;
  weekStart: Date;
}

export function HabitList({ habits, onToggleDate, onUpdate, onDelete, weekStart }: HabitListProps) {
  if (habits.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onToggleDate={onToggleDate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          weekStart={weekStart}
        />
      ))}
    </div>
  );
}
