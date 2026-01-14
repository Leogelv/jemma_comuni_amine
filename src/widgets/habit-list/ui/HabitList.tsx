'use client';

import { useMemo } from 'react';
import { endOfWeek, parseISO, isBefore, startOfDay } from 'date-fns';
import { HabitCard } from '@/entities/habit/ui/HabitCard';
import { Habit } from '@/entities/habit';
import styles from './HabitList.module.css';

// HabitList — контейнер для списка привычек с поддержкой навигации по неделям
// Фильтрует привычки по дате создания: не показывает в неделях, до которых привычка ещё не существовала

interface HabitListProps {
  habits: Habit[];
  onToggleDate: (habitId: string, date: Date) => void;
  onUpdate?: (habitId: string, data: { title?: string; icon?: string; color?: string }) => void;
  onDelete?: (habitId: string) => void;
  weekStart: Date;
}

export function HabitList({ habits, onToggleDate, onUpdate, onDelete, weekStart }: HabitListProps) {
  // Фильтруем привычки: показываем только те, которые были созданы до конца выбранной недели
  const filteredHabits = useMemo(() => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return habits.filter(habit => {
      const createdAt = startOfDay(parseISO(habit.created_at));
      // Привычка видна, если была создана до конца выбранной недели (включительно)
      return isBefore(createdAt, weekEnd) || createdAt.getTime() === weekEnd.getTime();
    });
  }, [habits, weekStart]);

  if (filteredHabits.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {filteredHabits.map((habit) => (
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
