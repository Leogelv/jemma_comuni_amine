'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { logDebug } from '@/shared/lib/debug-store';
import { init, isTMA, postEvent, mountBackButton, unmountBackButton, miniApp } from '@telegram-apps/sdk-react';

interface TelegramContextType {
  isTelegramApp: boolean;
  allowBrowserAccess: boolean;
  showAppContent: boolean;
  isReady: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
  isTelegramApp: false,
  allowBrowserAccess: false,
  showAppContent: false,
  isReady: false,
});

export const useTelegramContext = () => useContext(TelegramContext);

function requestFullscreen() {
  try {
    postEvent('web_app_request_fullscreen');
    logDebug('telegram', 'success', 'postEvent: web_app_request_fullscreen');
  } catch (error) {
    logDebug('telegram', 'warn', 'Failed to request fullscreen', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function setupSwipeBehavior() {
  try {
    postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });
    logDebug('telegram', 'success', 'postEvent: web_app_setup_swipe_behavior');
  } catch (error) {
    logDebug('telegram', 'warn', 'Failed to setup swipe behavior', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function requestSafeArea() {
  try {
    postEvent('web_app_request_safe_area');
    logDebug('telegram', 'success', 'postEvent: web_app_request_safe_area');
  } catch (error) {
    logDebug('telegram', 'warn', 'Failed to request safe area', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function requestContentSafeArea() {
  try {
    postEvent('web_app_request_content_safe_area');
    logDebug('telegram', 'success', 'postEvent: web_app_request_content_safe_area');
  } catch (error) {
    logDebug('telegram', 'warn', 'Failed to request content safe area', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

interface TelegramContextProviderProps {
  children: ReactNode;
  allowBrowserAccess?: boolean;
}

export function TelegramContextProvider({
  children,
  allowBrowserAccess = process.env.NEXT_PUBLIC_ALLOW_BROWSER_ACCESS === 'true',
}: TelegramContextProviderProps) {
  const [isTelegramApp, setIsTelegramApp] = useState<boolean | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    logDebug('telegram', 'info', 'TelegramContext useEffect started');

    const insideTelegram = isTMA();
    setIsTelegramApp(insideTelegram);

    logDebug('telegram', 'info', 'isTMA() result', { insideTelegram, allowBrowserAccess });

    if (insideTelegram) {
      init();
      logDebug('telegram', 'success', 'SDK init() выполнен');

      mountBackButton();
      logDebug('telegram', 'success', 'mountBackButton() выполнен');

      requestFullscreen();
      setupSwipeBehavior();
      requestSafeArea();
      requestContentSafeArea();

      try {
        if (miniApp && typeof miniApp.mount === 'function') {
          miniApp.mount();
          logDebug('telegram', 'success', 'miniApp.mount() выполнен');
        }

        if (miniApp && typeof miniApp.setBackgroundColor === 'function') {
          const canSetBg = !miniApp.setBackgroundColor.isAvailable || miniApp.setBackgroundColor.isAvailable();
          if (canSetBg) {
            miniApp.setBackgroundColor('#f3f4f6');
            logDebug('telegram', 'success', 'Background color set to #f3f4f6');
          }
        }

        if (miniApp && typeof miniApp.setHeaderColor === 'function') {
          const canSetHeader = !miniApp.setHeaderColor.isAvailable || miniApp.setHeaderColor.isAvailable();
          if (canSetHeader) {
            miniApp.setHeaderColor('#f3f4f6');
            logDebug('telegram', 'success', 'Header color set to #f3f4f6');
          }
        }
      } catch (error) {
        logDebug('telegram', 'warn', 'miniApp methods failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      setIsReady(true);
      logDebug('telegram', 'success', 'Telegram SDK полностью инициализирован');
    } else {
      logDebug('telegram', 'info', 'Не в Telegram окружении', { allowBrowserAccess });
      setIsReady(true);
    }

    return () => {
      if (insideTelegram) {
        try {
          unmountBackButton();
          logDebug('telegram', 'info', 'unmountBackButton() выполнен (cleanup)');
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [allowBrowserAccess]);

  if (isTelegramApp === undefined) {
    return null;
  }

  const showAppContent = isTelegramApp || allowBrowserAccess;

  return (
    <TelegramContext.Provider
      value={{
        isTelegramApp,
        allowBrowserAccess,
        showAppContent,
        isReady,
      }}
    >
      {showAppContent ? children : (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-800">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">📱</div>
            <p className="text-lg font-medium">Откройте приложение в Telegram</p>
          </div>
        </div>
      )}
    </TelegramContext.Provider>
  );
}
