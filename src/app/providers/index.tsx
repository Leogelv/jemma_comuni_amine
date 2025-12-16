'use client';

import { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { TelegramContextProvider } from './TelegramContext';
import { TelegramUserProvider } from './TelegramUserProvider';

/**
 * Главный провайдер приложения
 *
 * Порядок провайдеров важен:
 * 1. QueryProvider — React Query для кэширования
 * 2. TelegramContextProvider — Инициализация Telegram SDK
 * 3. TelegramUserProvider — Контекст пользователя Telegram
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <TelegramContextProvider allowBrowserAccess>
        <TelegramUserProvider>
          {children}
        </TelegramUserProvider>
      </TelegramContextProvider>
    </QueryProvider>
  );
}

export { useTelegramContext } from './TelegramContext';
