'use client';

/**
 * useHabits — хуки для работы с привычками
 *
 * Fire-and-Forget подход:
 * - Optimistic updates: UI обновляется мгновенно ДО ответа сервера
 * - Rollback при ошибке: если сервер не подтвердил — откатываем
 * - Real-time sync: Supabase Realtime автоматически синхронизирует данные
 *
 * Кэширование:
 * - При загрузке — мгновенно показываем данные из DeviceStorage/CloudStorage
 * - После получения с сервера — обновляем кэш
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Habit, HabitPreset } from '../model/types';
import { getCategory } from '@/shared/config';
import { useRealtimeSubscription } from '@/shared/lib/useRealtimeSubscription';
import { supabase } from '@/shared/api/supabase';
import { cacheHabits, loadCachedHabits } from '@/shared/lib/telegram-storage';

// ============================================
// useHabits — получение списка привычек
// С кэшированием в DeviceStorage/CloudStorage
// ============================================

export function useHabits(telegramId: number | undefined) {
  const queryClient = useQueryClient();
  const cacheLoadedRef = useRef(false);

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

  // Загружаем из кэша ОДИН раз при маунте (для мгновенного отображения)
  useEffect(() => {
    if (!telegramId || cacheLoadedRef.current) return;
    cacheLoadedRef.current = true;

    // Асинхронно загружаем кэш и сетим как начальные данные
    loadCachedHabits<Habit[]>(telegramId).then((result) => {
      if (result.success && result.data && result.data.length > 0) {
        // Сетим кэш как начальные данные (если ещё нет данных)
        const currentData = queryClient.getQueryData<Habit[]>(['habits', telegramId]);
        if (!currentData || currentData.length === 0) {
          queryClient.setQueryData(['habits', telegramId], result.data);
        }
      }
    });
  }, [telegramId, queryClient]);

  const query = useQuery<Habit[]>({
    queryKey: ['habits', telegramId],
    queryFn: async () => {
      if (!telegramId) return [];

      const response = await fetch(`/api/habits?telegram_id=${telegramId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch habits');
      }

      const habits: Habit[] = await response.json();

      // Кэшируем полученные данные для следующего запуска
      if (habits.length > 0) {
        cacheHabits(telegramId, habits);
      }

      return habits;
    },
    enabled: !!telegramId,
    staleTime: 0, // Всегда считаем данные устаревшими (realtime приоритет)
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Realtime сам обновит
  });

  // Обновляем кэш при изменении данных (через optimistic updates или realtime)
  useEffect(() => {
    if (telegramId && query.data && query.data.length > 0) {
      cacheHabits(telegramId, query.data);
    }
  }, [telegramId, query.data]);

  return query;
}

// ============================================
// useCreateHabit — создание привычки
// ============================================

// ============================================
// useHabitPresets — получение предустановленных привычек
// ============================================

export function useHabitPresets() {
  return useQuery<HabitPreset[]>({
    queryKey: ['habit-presets'],
    queryFn: async () => {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('habit_presets')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[useHabitPresets] Error:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 час — presets редко меняются
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      telegram_id: number;
      title: string;
      category: string;
      icon?: string;
      color?: string;
    }) => {
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
        icon: variables.icon || 'circle',
        color: variables.color || '#6366F1',
        streak: 0,
        completed_dates: [],
        total_completions: 0,
        created_at: new Date().toISOString(),
        reminder_enabled: false,
        reminder_time: null,
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
// useUpdateHabit — обновление привычки (title, icon, color)
// ============================================

interface UpdateHabitData {
  habit_id: string;
  telegram_id: number;
  title?: string;
  icon?: string;
  color?: string;
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateHabitData) => {
      const response = await fetch('/api/habits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: data.habit_id,
          title: data.title,
          icon: data.icon,
          color: data.color,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update habit');
      }

      return response.json();
    },
    // Optimistic update
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['habits', variables.telegram_id] });

      const previousHabits = queryClient.getQueryData<Habit[]>(['habits', variables.telegram_id]);

      // Обновляем поля в UI сразу
      queryClient.setQueryData<Habit[]>(['habits', variables.telegram_id], (old = []) =>
        old.map((h) => {
          if (h.id !== variables.habit_id) return h;
          return {
            ...h,
            ...(variables.title && { title: variables.title }),
            ...(variables.icon && { icon: variables.icon }),
            ...(variables.color && { color: variables.color }),
          };
        })
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

// Алиас для обратной совместимости
export const useUpdateHabitTitle = useUpdateHabit;

// ============================================
// useUpdateHabitReminder — обновление настроек напоминаний
// ============================================

export function useUpdateHabitReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      habit_id: string;
      telegram_id: number;
      reminder_enabled: boolean;
      reminder_time: string | null;
    }) => {
      const response = await fetch('/api/habits/reminder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update habit reminder');
      }

      return response.json();
    },
    // Optimistic update
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['habits', variables.telegram_id] });

      const previousHabits = queryClient.getQueryData<Habit[]>(['habits', variables.telegram_id]);

      // Обновляем в UI сразу
      queryClient.setQueryData<Habit[]>(['habits', variables.telegram_id], (old = []) =>
        old.map((h) =>
          h.id === variables.habit_id
            ? { ...h, reminder_enabled: variables.reminder_enabled, reminder_time: variables.reminder_time }
            : h
        )
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
