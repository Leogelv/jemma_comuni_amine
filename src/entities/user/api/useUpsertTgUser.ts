'use client';

/**
 * useUpsertTgUser — хук для работы с пользователем
 *
 * Включает real-time подписку на tg_users для автоматической синхронизации points
 */

import { useQuery } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/shared/lib/useRealtimeSubscription';

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

  return useQuery({
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
