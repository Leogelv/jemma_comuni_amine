'use client';

/**
 * useRealtimeSubscription — универсальный хук для real-time подписок Supabase
 *
 * Ключевые особенности:
 * - Использует refs для стабильности (предотвращает утечки памяти)
 * - Автоматически инвалидирует React Query кэш при изменениях
 * - Поддерживает переподключение при возврате из background
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/shared/api/supabase/browser';

// Типы для реалтайм подписки
export interface RealtimeSubscriptionOptions {
  /** Уникальное имя канала, например `habits-${userId}` */
  channelName: string;
  /** Таблица БД для подписки */
  table: string;
  /** Postgres фильтр, например `telegram_id=eq.123456` */
  filter?: string;
  /** React Query ключи для инвалидации при изменениях */
  invalidateKeys: (string | unknown[])[];
  /** Опциональный callback при получении payload */
  onPayload?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  /** Включить/выключить подписку */
  enabled?: boolean;
}

export function useRealtimeSubscription({
  channelName,
  table,
  filter,
  invalidateKeys,
  onPayload,
  enabled = true,
}: RealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();

  // Refs для стабильности — предотвращаем пересоздание подписки при re-renders
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);
  const invalidateKeysRef = useRef(invalidateKeys);
  const onPayloadRef = useRef(onPayload);
  const queryClientRef = useRef(queryClient);

  // Обновляем refs при изменении значений
  useEffect(() => {
    invalidateKeysRef.current = invalidateKeys;
  }, [invalidateKeys]);

  useEffect(() => {
    onPayloadRef.current = onPayload;
  }, [onPayload]);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  // Обработчик изменений из Supabase Realtime
  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      console.log(`🔥 [Realtime] ${channelName} получен payload:`, payload.eventType);

      // Инвалидируем все React Query keys
      invalidateKeysRef.current.forEach((key) => {
        queryClientRef.current.invalidateQueries({
          queryKey: Array.isArray(key) ? key : [key],
          refetchType: 'all', // КРИТИЧНО для force-refresh
        });
      });

      // Вызываем пользовательский callback если есть
      if (onPayloadRef.current) {
        onPayloadRef.current(payload);
      }
    },
    [channelName]
  );

  // Создание и управление подпиской
  useEffect(() => {
    if (!enabled) {
      // Отписываемся если disabled
      if (channelRef.current && subscribedRef.current) {
        console.log(`🔥 [Realtime] ${channelName} отписываемся (disabled)`);
        channelRef.current.unsubscribe();
        channelRef.current = null;
        subscribedRef.current = false;
      }
      return;
    }

    // Получаем Supabase клиент
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch {
      console.warn(`🔥 [Realtime] ${channelName} - Supabase недоступен`);
      return;
    }

    // Уже подписаны — пропускаем
    if (subscribedRef.current && channelRef.current) {
      return;
    }

    console.log(`🔥 [Realtime] ${channelName} создаём подписку на ${table}`, filter ? `с фильтром: ${filter}` : '');

    // Создаём канал с подпиской на postgres_changes
    const channel = supabase.channel(channelName).on(
      'postgres_changes',
      {
        event: '*', // Все события: INSERT, UPDATE, DELETE
        schema: 'public',
        table,
        ...(filter ? { filter } : {}),
      },
      handleChange
    );

    // Подписываемся
    channel.subscribe((status) => {
      console.log(`🔥 [Realtime] ${channelName} статус:`, status);
      if (status === 'SUBSCRIBED') {
        subscribedRef.current = true;
      }
    });

    channelRef.current = channel;

    // Cleanup при размонтировании
    return () => {
      if (channelRef.current) {
        console.log(`🔥 [Realtime] ${channelName} cleanup - отписываемся`);
        channelRef.current.unsubscribe();
        channelRef.current = null;
        subscribedRef.current = false;
      }
    };
  }, [channelName, table, filter, enabled, handleChange]);

  // Слушаем visibility change для переподключения при возврате из background
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !subscribedRef.current) {
        console.log(`🔥 [Realtime] ${channelName} - возврат из background, переподключаемся`);
        // Инвалидируем кэш при возврате
        invalidateKeysRef.current.forEach((key) => {
          queryClientRef.current.invalidateQueries({
            queryKey: Array.isArray(key) ? key : [key],
            refetchType: 'all',
          });
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [channelName, enabled]);
}
