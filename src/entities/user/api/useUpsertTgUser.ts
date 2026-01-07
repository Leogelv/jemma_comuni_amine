'use client';

/**
 * useUpsertTgUser — хук для работы с пользователем
 *
 * Включает real-time подписку на tg_users для автоматической синхронизации points
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/shared/lib/useRealtimeSubscription';
import type { TgUser, UpdateProfilePayload } from '../model/types';

export interface UpsertUserPayload {
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

export function useUpsertTgUser(values: UpsertUserPayload) {
  // Real-time подписка на изменения tg_users (для синхронизации points)
  useRealtimeSubscription({
    channelName: `tg-users-${values.telegram_id}`,
    table: 'tg_users',
    filter: values.telegram_id ? `telegram_id=eq.${values.telegram_id}` : undefined,
    invalidateKeys: [['user', values.telegram_id]],
    enabled: !!values.telegram_id,
  });

  return useQuery<TgUser>({
    queryKey: ['user', values.telegram_id],
    queryFn: async () => {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upsert user');
      }

      return response.json();
    },
    enabled: !!values.telegram_id,
    staleTime: 0, // Realtime приоритет
    refetchOnWindowFocus: false,
  });
}

// ============================================
// useUpdateProfile — обновление профиля пользователя
// ============================================

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfilePayload) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return response.json();
    },
    // Optimistic update
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['user', variables.telegram_id] });

      const previousUser = queryClient.getQueryData<TgUser>(['user', variables.telegram_id]);

      // Обновляем кэш оптимистично
      queryClient.setQueryData<TgUser>(['user', variables.telegram_id], (old) => {
        if (!old) return old;
        return { ...old, ...variables };
      });

      return { previousUser };
    },
    // Rollback при ошибке
    onError: (_error, variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(['user', variables.telegram_id], context.previousUser);
      }
    },
    // Инвалидируем для получения реальных данных
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.telegram_id] });
    },
  });
}
