'use client';

import { ReactNode, useEffect } from 'react';
import { TelegramUserProvider as UserProvider } from '@/entities/user';
import { logDebug } from '@/shared/lib/debug-store';

export function TelegramUserProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    logDebug('providers', 'success', 'TelegramUserProvider mounted');

    return () => {
      logDebug('providers', 'info', 'TelegramUserProvider unmounted');
    };
  }, []);

  return <UserProvider>{children}</UserProvider>;
}
