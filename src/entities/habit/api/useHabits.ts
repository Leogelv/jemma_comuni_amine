'use client';

/**
 * useHabits — хуки для работы с привычками
 *
 * Fire-and-Forget подход:
 * - Optimistic updates: UI обновляется мгновенно ДО ответа сервера
 * - Rollback при ошибке: если сервер не подтвердил — откатываем
 * - Real-time sync: Supabase Realtime автоматически синхронизирует данные
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Habit } from '../model/types';
import { getCategory } from '@/shared/config';
import { useRealtimeSubscription } from '@/shared/lib/useRealtimeSubscription';

// ============================================
// useHabits — получение списка привычек
// ============================================

export function useHabits(telegramId: number | undefined) {
  // Real-time подписка на изменения таблицы habits
  useRealtimeSubscription({
    channelName: `habits-${telegramId}`,
    table: 'habits',
    filter: telegramId ? `telegram_id=eq.${telegramId}` : undefined,
    invalidateKeys: [
      ['habits', telegramId],
      ['user', telegramId],
    ],
    enabled: !!telegramId,
  });

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
    staleTime: 0, // Всегда считаем данные устаревшими (realtime приоритет)
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Realtime сам обновит
  });
}

// ============================================
// useCreateHabit — создание привычки
// ============================================

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
    // Optimistic update — добавляем в UI сразу
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['habits', variables.telegram_id] });

      const previousHabits = queryClient.getQueryData<Habit[]>(['habits', variables.telegram_id]);

      // Создаём оптимистичную запись
      const optimisticHabit: Habit = {
        id: `optimistic-${Date.now()}`,
        telegram_id: variables.telegram_id,
        title: variables.title,
        category: variables.category as Habit['category'],
        streak: 0,
        completed_dates: [],
        total_completions: 0,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Habit[]>(['habits', variables.telegram_id], (old = []) => [
        optimisticHabit,
        ...old,
      ]);

      return { previousHabits };
    },
    // Rollback при ошибке
    onError: (_error, variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits', variables.telegram_id], context.previousHabits);
      }
    },
    // Инвалидируем для получения реальных данных
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['habits', variables.telegram_id] });
    },
  });
}

// ============================================
// useToggleHabitCompletion — FIRE-AND-FORGET toggle
// ============================================

interface ToggleVariables {
  habit_id: string;
  date: string;
  telegram_id: number;
}

interface ToggleContext {
  previousHabits: Habit[] | undefined;
  previousUser: { total_points?: number } | undefined;
  wasCompleted: boolean;
  pointsDelta: number;
}

export function useToggleHabitCompletion() {
  const queryClient = useQueryClient();

  return useMutation<{ habit: Habit; pointsDelta: number }, Error, ToggleVariables, ToggleContext>({
    // API запрос — fire-and-forget, результат приходит через Realtime
    mutationFn: async (data) => {
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

    // ===== OPTIMISTIC UPDATE =====
    // UI обновляется МГНОВЕННО, не ждём сервер
    onMutate: async (variables) => {
      // 1. Отменяем любые pending запросы
      await queryClient.cancelQueries({ queryKey: ['habits', variables.telegram_id] });
      await queryClient.cancelQueries({ queryKey: ['user', variables.telegram_id] });

      // 2. Сохраняем предыдущие данные для rollback
      const previousHabits = queryClient.getQueryData<Habit[]>(['habits', variables.telegram_id]);
      const previousUser = queryClient.getQueryData<{ total_points?: number }>([
        'user',
        variables.telegram_id,
      ]);

      // 3. Находим привычку и определяем статус
      const habit = previousHabits?.find((h) => h.id === variables.habit_id);
      const wasCompleted = habit?.completed_dates?.includes(variables.date) ?? false;
      const category = getCategory(habit?.category || 'other');
      const pointsDelta = wasCompleted ? -category.points : category.points;

      // 4. Обновляем habits кэш МГНОВЕННО
      queryClient.setQueryData<Habit[]>(['habits', variables.telegram_id], (oldHabits = []) => {
        return oldHabits.map((h) => {
          if (h.id !== variables.habit_id) return h;

          // Toggle completed_dates
          const newDates = wasCompleted
            ? h.completed_dates.filter((d) => d !== variables.date)
            : [...h.completed_dates, variables.date];

          // Пересчитываем streak (упрощённо — сервер пересчитает точно)
          const streak = calculateOptimisticStreak(newDates);

          return {
            ...h,
            completed_dates: newDates,
            total_completions: newDates.length,
            streak,
          };
        });
      });

      // 5. Обновляем user points кэш МГНОВЕННО
      queryClient.setQueryData<{ total_points?: number }>(
        ['user', variables.telegram_id],
        (oldUser) => {
          if (!oldUser) return oldUser;
          const currentPoints = oldUser.total_points || 0;
          return {
            ...oldUser,
            total_points: Math.max(0, currentPoints + pointsDelta),
          };
        }
      );

      // Возвращаем context для возможного rollback
      return { previousHabits, previousUser, wasCompleted, pointsDelta };
    },

    // ===== ROLLBACK ПРИ ОШИБКЕ =====
    onError: (_error, variables, context) => {
      console.error('🔥 [Toggle] Ошибка, откатываем:', _error);

      // Откатываем habits
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits', variables.telegram_id], context.previousHabits);
      }

      // Откатываем user points
      if (context?.previousUser) {
        queryClient.setQueryData(['user', variables.telegram_id], context.previousUser);
      }
    },

    // ===== НЕ ИНВАЛИДИРУЕМ — Realtime сам обновит =====
    // onSettled не нужен, т.к. Supabase Realtime пришлёт актуальные данные
  });
}

// ============================================
// useDeleteHabit — удаление привычки
// ============================================

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
    // Optimistic delete
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['habits', variables.telegram_id] });

      const previousHabits = queryClient.getQueryData<Habit[]>(['habits', variables.telegram_id]);

      // Удаляем из UI сразу
      queryClient.setQueryData<Habit[]>(['habits', variables.telegram_id], (old = []) =>
        old.filter((h) => h.id !== variables.habit_id)
      );

      return { previousHabits };
    },
    // Rollback при ошибке
    onError: (_error, variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits', variables.telegram_id], context.previousHabits);
      }
    },
  });
}

// ============================================
// Вспомогательные функции
// ============================================

/**
 * Упрощённый расчёт streak для optimistic update
 * Сервер пересчитает точно, это только для мгновенного UI
 */
function calculateOptimisticStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = dates
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const latestDate = sortedDates[0];
  latestDate.setHours(0, 0, 0, 0);

  // Если последняя дата раньше вчерашнего — streak = 0
  if (latestDate < yesterday) {
    return 0;
  }

  let streak = 1;
  let currentDate = latestDate;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);

    const checkDate = sortedDates[i];
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === prevDate.getTime()) {
      streak++;
      currentDate = checkDate;
    } else if (checkDate.getTime() < prevDate.getTime()) {
      break;
    }
  }

  return streak;
}
