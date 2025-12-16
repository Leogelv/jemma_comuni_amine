'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Habit } from '../model/types';

export function useHabits(telegramId: number | undefined) {
  return useQuery<Habit[]>({
    queryKey: ['habits', telegramId],
    queryFn: async () => {
      if (!telegramId) return [];

      const response = await fetch(`/api/habits?telegram_id=${telegramId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch habits');
      }

      return response.json();
    },
    enabled: !!telegramId,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { telegram_id: number; title: string; category: string }) => {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create habit');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['habits', variables.telegram_id] });
    },
  });
}

export function useToggleHabitCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { habit_id: string; date: string; telegram_id: number }) => {
      const response = await fetch('/api/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle habit');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['habits', variables.telegram_id] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.telegram_id] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { habit_id: string; telegram_id: number }) => {
      const response = await fetch(`/api/habits?habit_id=${data.habit_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete habit');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['habits', variables.telegram_id] });
    },
  });
}
