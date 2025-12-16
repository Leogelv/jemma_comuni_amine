'use client';

import React from 'react';
import { HabitCard } from '@/entities/habit/ui/HabitCard';
import { Habit } from '@/entities/habit';

interface HabitListProps {
  habits: Habit[];
  onToggleDate: (habitId: string, date: Date) => void;
}

export function HabitList({ habits, onToggleDate }: HabitListProps) {
  if (habits.length === 0) {
    return (
      <div className="text-center py-16 opacity-60">
        <div className="text-6xl mb-4">🌱</div>
        <p className="text-gray-500 text-lg font-medium">Начни с малого</p>
        <p className="text-gray-400 text-sm mt-2">
          Добавь свою первую привычку
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
