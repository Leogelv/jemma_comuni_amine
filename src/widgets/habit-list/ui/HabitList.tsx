'use client';

import React from 'react';
import { HabitCard } from '@/entities/habit/ui/HabitCard';
import { Habit } from '@/entities/habit';
import styles from './HabitList.module.css';

// HabitList — контейнер для списка привычек

interface HabitListProps {
  habits: Habit[];
  onToggleDate: (habitId: string, date: Date) => void;
}

export function HabitList({ habits, onToggleDate }: HabitListProps) {
  // Пустое состояние обрабатывается в HomePage
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
        />
      ))}
    </div>
  );
}
