'use client';

import { createContext, ReactNode, useContext, useMemo, useEffect, useState, useRef } from 'react';
import { useUpsertTgUser } from '../api/useUpsertTgUser';
import { logDebug } from '@/shared/lib/debug-store';
import {
  initTelegramApp,
  getTelegramData,
  isTelegramEnvironment,
  type TelegramInitResult,
} from '@/shared/lib/telegram-sdk';

// ============================================================================
// ТИПЫ
// ============================================================================

interface TgUser {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  total_points?: number;
  current_streak?: number;
}

interface TgWebAppData {
  user?: {
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  };
}

interface ContextValue {
  user?: TgUser;
  isLoading?: boolean;
  telegramData?: TgWebAppData | null;
  sdkReady: boolean;
  isFullscreen: boolean;
}

// ============================================================================
// КОНТЕКСТ
// ============================================================================

const TelegramUserContext = createContext<ContextValue>({
  user: undefined,
  isLoading: true,
  telegramData: undefined,
  sdkReady: false,
  isFullscreen: false,
});

export const useTelegramUser = () => useContext(TelegramUserContext);

// ============================================================================
// ХУКИ
// ============================================================================

function useTelegramInit() {
  const [tgWebAppData, setTgWebAppData] = useState<TgWebAppData | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function initialize() {
      logDebug('telegram', 'info', 'Начало инициализации Telegram SDK');

      const inTelegram = isTelegramEnvironment();
      logDebug('telegram', 'info', `Telegram окружение: ${inTelegram}`);

      let initResult: TelegramInitResult | null = null;
      try {
        initResult = await initTelegramApp({
          fullscreen: true,
          disableVerticalSwipe: true,
          requestSafeArea: true,
          requestContentSafeArea: true,
          backgroundColor: '#f3f4f6',
          headerColor: '#f3f4f6',
        });

        logDebug('telegram', 'success', 'SDK инициализирован', initResult);
        setIsFullscreen(initResult.fullscreenResult);
      } catch (error) {
        logDebug('telegram', 'error', 'Ошибка инициализации SDK', { error: String(error) });
      }

      try {
        const telegramData = await getTelegramData();
        logDebug('telegram', 'info', 'Получены данные Telegram', {
          hasInitData: !!telegramData.initData,
          userId: telegramData.userId,
          startParam: telegramData.startParam,
        });

        if (telegramData.userId) {
          try {
            const sdk = await import('@telegram-apps/sdk-react');
            const launchParams = sdk.retrieveLaunchParams?.();
            const userData = launchParams?.tgWebAppData ?? null;

            setTgWebAppData(userData);
            logDebug('telegram', 'success', 'Данные пользователя получены', {
              userId: userData?.user?.id,
              username: userData?.user?.username,
            });
          } catch {
            setTgWebAppData({ user: { id: telegramData.userId } });
          }
        } else {
          setTgWebAppData(null);
          logDebug('telegram', 'warn', 'Пользователь не найден (не Telegram контекст)');
        }
      } catch (error) {
        logDebug('telegram', 'error', 'Ошибка получения данных Telegram', { error: String(error) });
        setTgWebAppData(null);
      }

      setSdkReady(true);
      logDebug('telegram', 'success', 'Telegram SDK готов к работе');
    }

    initialize();
  }, []);

  return { tgWebAppData, sdkReady, isFullscreen };
}

// ============================================================================
// ПРОВАЙДЕР
// ============================================================================

export function TelegramUserProvider({ children }: { children: ReactNode }) {
  const { tgWebAppData, sdkReady, isFullscreen } = useTelegramInit();

  useEffect(() => {
    logDebug('telegram', 'info', 'TelegramUserProvider смонтирован');
    return () => {
      logDebug('telegram', 'info', 'TelegramUserProvider размонтирован');
    };
  }, []);

  const payload = useMemo(
    () => ({
      telegram_id: tgWebAppData?.user?.id || 0,
      username: tgWebAppData?.user?.username,
      first_name: tgWebAppData?.user?.first_name,
      last_name: tgWebAppData?.user?.last_name,
      photo_url: tgWebAppData?.user?.photo_url,
    }),
    [tgWebAppData]
  );

  const { data, isLoading, error } = useUpsertTgUser(payload);

  useEffect(() => {
    if (isLoading) {
      logDebug('telegram', 'info', 'Выполняется upsert пользователя Telegram', { payload });
    } else if (error) {
      logDebug('telegram', 'error', 'Ошибка upsert пользователя Telegram', { error, payload });
    } else if (data) {
      logDebug('telegram', 'success', 'Пользователь Telegram успешно сохранен', {
        userId: data.id,
        telegramId: data.telegram_id,
      });
    }
  }, [data, isLoading, error, payload]);

  return (
    <TelegramUserContext.Provider
      value={{
        user: data || undefined,
        isLoading,
        telegramData: tgWebAppData,
        sdkReady,
        isFullscreen,
      }}
    >
      {children}
    </TelegramUserContext.Provider>
  );
}
