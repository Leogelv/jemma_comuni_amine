'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { logDebug } from '@/shared/lib/debug-store';
import {
  init,
  isTMA,
  postEvent,
  mountBackButton,
  unmountBackButton,
  miniApp,
  // Viewport — правильный способ работы с safe area
  mountViewport,
  unmountViewport,
  bindViewportCssVars,
  isViewportMounted,
  viewportHeight,
  viewportWidth,
  viewportSafeAreaInsets,
  viewportContentSafeAreaInsets,
  isViewportExpanded,
  expandViewport,
} from '@telegram-apps/sdk-react';
import {
  saveAppState,
  loadAppState,
  type AppState,
} from '@/shared/lib/telegram-storage';
import {
  subscribeToActivityEvents,
  isAppActive,
  isHomeScreenAvailable,
  checkHomeScreenStatus,
  addToHomeScreen,
  type HomeScreenStatus,
} from '@/shared/lib/telegram-events';

interface TelegramContextType {
  isTelegramApp: boolean;
  allowBrowserAccess: boolean;
  showAppContent: boolean;
  isReady: boolean;
  isMobile: boolean;
  // Состояние активности (Bot API 8.0+)
  isActive: boolean;
  // Home Screen API (Bot API 8.0+)
  homeScreenStatus: HomeScreenStatus;
  promptAddToHomeScreen: () => void;
  // Сохранение состояния приложения
  saveState: (state: Partial<AppState>) => Promise<void>;
  loadState: () => Promise<AppState | undefined>;
}

const TelegramContext = createContext<TelegramContextType>({
  isTelegramApp: false,
  allowBrowserAccess: false,
  showAppContent: false,
  isReady: false,
  isMobile: true,
  isActive: true,
  homeScreenStatus: 'unknown',
  promptAddToHomeScreen: () => {},
  saveState: async () => {},
  loadState: async () => undefined,
});

export const useTelegramContext = () => useContext(TelegramContext);

// Хук для определения мобильного viewport
export const useViewport = () => {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkViewport = () => {
      // Telegram Desktop обычно имеет viewport > 600px
      setIsMobile(window.innerWidth < 600);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return { isMobile };
};

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

/**
 * Биндинг safe area insets в CSS переменные
 * SDK не делает это автоматически — нужно вручную
 */
function bindSafeAreaCssVars() {
  const safeInsets = viewportSafeAreaInsets();
  const contentInsets = viewportContentSafeAreaInsets();

  const root = document.documentElement;

  // Safe area insets (iOS notch, Android status bar)
  root.style.setProperty('--tg-safe-area-inset-top', `${safeInsets?.top ?? 0}px`);
  root.style.setProperty('--tg-safe-area-inset-bottom', `${safeInsets?.bottom ?? 0}px`);
  root.style.setProperty('--tg-safe-area-inset-left', `${safeInsets?.left ?? 0}px`);
  root.style.setProperty('--tg-safe-area-inset-right', `${safeInsets?.right ?? 0}px`);

  // Content safe area (Telegram UI header/footer)
  root.style.setProperty('--tg-content-safe-area-inset-top', `${contentInsets?.top ?? 0}px`);
  root.style.setProperty('--tg-content-safe-area-inset-bottom', `${contentInsets?.bottom ?? 0}px`);

  // Комбинированный отступ (notch + Telegram UI)
  const totalTop = (safeInsets?.top ?? 0) + (contentInsets?.top ?? 0);
  const totalBottom = (safeInsets?.bottom ?? 0) + (contentInsets?.bottom ?? 0);
  root.style.setProperty('--tg-total-safe-area-top', `${totalTop}px`);
  root.style.setProperty('--tg-total-safe-area-bottom', `${totalBottom}px`);

  logDebug('telegram', 'success', 'Safe area CSS vars bound', {
    safeTop: safeInsets?.top ?? 0,
    safeBottom: safeInsets?.bottom ?? 0,
    contentTop: contentInsets?.top ?? 0,
    contentBottom: contentInsets?.bottom ?? 0,
    totalTop,
    totalBottom,
  });
}

/**
 * Монтирование viewport с CSS переменными
 * Правильный способ работы с safe area в Telegram Mini App
 */
async function initViewport() {
  try {
    // Проверяем доступность метода
    if (mountViewport.isAvailable && !mountViewport.isAvailable()) {
      logDebug('telegram', 'warn', 'mountViewport not available');
      return;
    }

    // Монтируем viewport
    await mountViewport();
    logDebug('telegram', 'success', 'Viewport mounted');

    // Биндим CSS переменные для viewport размеров
    // Создаст: --tg-viewport-height, --tg-viewport-width, --tg-viewport-stable-height
    if (bindViewportCssVars.isAvailable && bindViewportCssVars.isAvailable()) {
      bindViewportCssVars();
      logDebug('telegram', 'success', 'Viewport CSS vars bound');
    }

    // Биндим CSS переменные для safe area (SDK не делает автоматически!)
    bindSafeAreaCssVars();

    // Расширяем viewport если ещё не расширен
    if (expandViewport.isAvailable && expandViewport.isAvailable()) {
      expandViewport();
      logDebug('telegram', 'success', 'Viewport expanded');
    }

    // Логируем данные для дебага
    logDebug('telegram', 'info', 'Viewport data', {
      height: viewportHeight(),
      width: viewportWidth(),
      isExpanded: isViewportExpanded(),
      safeAreaInsets: viewportSafeAreaInsets(),
      contentSafeAreaInsets: viewportContentSafeAreaInsets(),
    });

  } catch (error) {
    logDebug('telegram', 'warn', 'Failed to init viewport', {
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
  const [isMobile, setIsMobile] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [homeScreenStatus, setHomeScreenStatus] = useState<HomeScreenStatus>('unknown');

  // Ref для хранения текущего состояния (чтобы сохранять при deactivated)
  const currentStateRef = useRef<Partial<AppState>>({});

  // Callback для сохранения состояния
  const saveState = useCallback(async (state: Partial<AppState>) => {
    currentStateRef.current = { ...currentStateRef.current, ...state };
    await saveAppState(currentStateRef.current);
  }, []);

  // Callback для загрузки состояния
  const loadState = useCallback(async () => {
    const result = await loadAppState();
    if (result.success && result.data) {
      currentStateRef.current = result.data;
      return result.data;
    }
    return undefined;
  }, []);

  // Callback для добавления на Home Screen
  const promptAddToHomeScreen = useCallback(() => {
    if (addToHomeScreen()) {
      logDebug('telegram', 'info', 'Home screen prompt shown');
    }
  }, []);

  useEffect(() => {
    logDebug('telegram', 'info', 'TelegramContext useEffect started');

    const checkTelegram = async () => {
      // Проверяем viewport для определения mobile/desktop
      setIsMobile(window.innerWidth < 600);

      let insideTelegram: boolean;
      try {
        insideTelegram = isTMA();
      } catch (err) {
        insideTelegram = false;
        logDebug('telegram', 'warn', 'isTMA() check failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      setIsTelegramApp(insideTelegram);

      logDebug('telegram', 'info', 'isTMA() result', { insideTelegram, allowBrowserAccess });

      if (insideTelegram) {
        init();
        logDebug('telegram', 'success', 'SDK init() выполнен');

        mountBackButton();
        logDebug('telegram', 'success', 'mountBackButton() выполнен');

        requestFullscreen();
        setupSwipeBehavior();

        // Используем новый правильный способ — mountViewport с CSS variables
        await initViewport();

        // Fallback на старые методы если viewport не смонтировался
        if (!isViewportMounted()) {
          logDebug('telegram', 'warn', 'Viewport not mounted, using fallback postEvent');
          requestSafeArea();
          requestContentSafeArea();
        }

        try {
          if (miniApp && typeof miniApp.mount === 'function') {
            miniApp.mount();
            logDebug('telegram', 'success', 'miniApp.mount() выполнен');
          }

          // Устанавливаем цвета
          const bgColor = '#f3f4f6';
          const headerColor = '#f3f4f6';

          if (miniApp && typeof miniApp.setBackgroundColor === 'function') {
            const canSetBg = !miniApp.setBackgroundColor.isAvailable || miniApp.setBackgroundColor.isAvailable();
            if (canSetBg) {
              miniApp.setBackgroundColor(bgColor);
              logDebug('telegram', 'success', `Background color set to ${bgColor}`);
            }
          }

          if (miniApp && typeof miniApp.setHeaderColor === 'function') {
            const canSetHeader = !miniApp.setHeaderColor.isAvailable || miniApp.setHeaderColor.isAvailable();
            if (canSetHeader) {
              miniApp.setHeaderColor(headerColor);
              logDebug('telegram', 'success', `Header color set to ${headerColor}`);
            }
          }

          // Сигнализируем о готовности приложения
          if (miniApp && typeof miniApp.ready === 'function') {
            miniApp.ready();
            logDebug('telegram', 'success', 'miniApp.ready() выполнен');
          }

        } catch (error) {
          logDebug('telegram', 'warn', 'miniApp methods failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        // Подписываемся на события активности (Bot API 8.0+)
        const unsubscribeActivity = subscribeToActivityEvents({
          onActivated: () => {
            setIsActive(true);
            logDebug('telegram', 'info', 'App activated — восстанавливаем состояние');
          },
          onDeactivated: () => {
            setIsActive(false);
            // Автосохранение при деактивации (свёртывании)
            if (Object.keys(currentStateRef.current).length > 0) {
              saveAppState(currentStateRef.current);
              logDebug('telegram', 'info', 'App deactivated — состояние сохранено');
            }
          },
        });

        // Проверяем статус Home Screen (Bot API 8.0+)
        if (isHomeScreenAvailable()) {
          checkHomeScreenStatus().then((status) => {
            setHomeScreenStatus(status);
            logDebug('telegram', 'info', 'Home screen status', { status });
          });
        }

        // Устанавливаем начальный статус активности
        setIsActive(isAppActive());

        setIsReady(true);
        logDebug('telegram', 'success', 'Telegram SDK полностью инициализирован');

        // Возвращаем cleanup для activity events
        return unsubscribeActivity;
      } else {
        logDebug('telegram', 'info', 'Не в Telegram окружении', { allowBrowserAccess });
        setIsReady(true);
        return () => {};
      }
    };

    // Запускаем и сохраняем cleanup функцию когда Promise разрешится
    let activityCleanup: (() => void) | undefined;
    const cleanupPromise = checkTelegram();
    cleanupPromise.then((cleanup) => {
      activityCleanup = cleanup;
    });

    // Слушаем resize для обновления isMobile
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      // Cleanup activity events
      activityCleanup?.();

      // Cleanup Telegram SDK
      try {
        if (isTMA()) {
          unmountBackButton();
          if (isViewportMounted()) {
            unmountViewport();
          }
          logDebug('telegram', 'info', 'Telegram SDK cleanup выполнен');
        }
      } catch {
        // Ignore cleanup errors
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
        isMobile,
        isActive,
        homeScreenStatus,
        promptAddToHomeScreen,
        saveState,
        loadState,
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
