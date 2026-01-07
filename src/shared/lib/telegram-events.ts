// Telegram Mini App Events (Bot API 8.0+)
// События активности и жизненного цикла приложения

import { logDebug } from './debug-store';
import { getTelegramVersion } from './telegram-sdk';

// ============================================================================
// ТИПЫ
// ============================================================================

export type AppActivityStatus = 'active' | 'inactive' | 'unknown';

export interface ActivityEventHandlers {
  onActivated?: () => void;
  onDeactivated?: () => void;
}

interface TelegramWebAppWithEvents {
  isActive?: boolean;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
}

// ============================================================================
// ПОЛУЧЕНИЕ TELEGRAM WEBAPP
// ============================================================================

function getWebApp(): TelegramWebAppWithEvents | null {
  if (typeof window === 'undefined') return null;

  interface WindowWithTelegram extends Window {
    Telegram?: {
      WebApp?: TelegramWebAppWithEvents;
    };
  }

  return (window as WindowWithTelegram).Telegram?.WebApp ?? null;
}

// ============================================================================
// ACTIVITY EVENTS (Bot API 8.0+)
// ============================================================================

/**
 * Проверяет, доступны ли события активности
 */
export function isActivityEventsAvailable(): boolean {
  const version = getTelegramVersion();
  if (version < 8.0) return false;

  const webApp = getWebApp();
  return !!webApp?.onEvent;
}

/**
 * Возвращает текущий статус активности приложения
 */
export function getActivityStatus(): AppActivityStatus {
  const webApp = getWebApp();

  if (!webApp || typeof webApp.isActive === 'undefined') {
    return 'unknown';
  }

  return webApp.isActive ? 'active' : 'inactive';
}

/**
 * Проверяет, активно ли приложение сейчас
 */
export function isAppActive(): boolean {
  const webApp = getWebApp();
  return webApp?.isActive ?? true; // По умолчанию считаем активным
}

// Хранилище обработчиков для корректной отписки
const activeHandlers = new Map<string, () => void>();

/**
 * Подписывается на события активности приложения
 * Возвращает функцию для отписки
 */
export function subscribeToActivityEvents(handlers: ActivityEventHandlers): () => void {
  const webApp = getWebApp();

  if (!webApp || !isActivityEventsAvailable()) {
    logDebug('events', 'warn', 'Activity events not available', {
      version: getTelegramVersion(),
      hasWebApp: !!webApp,
    });
    return () => {};
  }

  const handleActivated = () => {
    logDebug('events', 'info', 'App activated');
    handlers.onActivated?.();
  };

  const handleDeactivated = () => {
    logDebug('events', 'info', 'App deactivated');
    handlers.onDeactivated?.();
  };

  // Подписываемся
  if (handlers.onActivated) {
    webApp.onEvent('activated', handleActivated);
    activeHandlers.set('activated', handleActivated);
    logDebug('events', 'success', 'Subscribed to activated event');
  }

  if (handlers.onDeactivated) {
    webApp.onEvent('deactivated', handleDeactivated);
    activeHandlers.set('deactivated', handleDeactivated);
    logDebug('events', 'success', 'Subscribed to deactivated event');
  }

  // Возвращаем функцию отписки
  return () => {
    if (handlers.onActivated && activeHandlers.has('activated')) {
      webApp.offEvent('activated', activeHandlers.get('activated')!);
      activeHandlers.delete('activated');
      logDebug('events', 'info', 'Unsubscribed from activated event');
    }

    if (handlers.onDeactivated && activeHandlers.has('deactivated')) {
      webApp.offEvent('deactivated', activeHandlers.get('deactivated')!);
      activeHandlers.delete('deactivated');
      logDebug('events', 'info', 'Unsubscribed from deactivated event');
    }
  };
}

// ============================================================================
// HOME SCREEN EVENTS & METHODS (Bot API 8.0+)
// ============================================================================

export type HomeScreenStatus = 'unsupported' | 'unknown' | 'added' | 'missed';

interface TelegramWebAppWithHomeScreen {
  checkHomeScreenStatus: (callback: (status: HomeScreenStatus) => void) => void;
  addToHomeScreen: () => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
}

function getWebAppWithHomeScreen(): TelegramWebAppWithHomeScreen | null {
  if (typeof window === 'undefined') return null;

  interface WindowWithTelegram extends Window {
    Telegram?: {
      WebApp?: TelegramWebAppWithHomeScreen;
    };
  }

  const webApp = (window as WindowWithTelegram).Telegram?.WebApp;
  if (!webApp?.checkHomeScreenStatus) return null;

  return webApp;
}

/**
 * Проверяет, доступны ли методы Home Screen
 */
export function isHomeScreenAvailable(): boolean {
  const version = getTelegramVersion();
  if (version < 8.0) return false;

  return !!getWebAppWithHomeScreen();
}

/**
 * Проверяет статус добавления на домашний экран
 */
export function checkHomeScreenStatus(): Promise<HomeScreenStatus> {
  return new Promise((resolve) => {
    const webApp = getWebAppWithHomeScreen();

    if (!webApp) {
      logDebug('events', 'warn', 'Home screen API not available');
      resolve('unsupported');
      return;
    }

    try {
      webApp.checkHomeScreenStatus((status) => {
        logDebug('events', 'info', 'Home screen status', { status });
        resolve(status);
      });
    } catch (error) {
      logDebug('events', 'error', 'checkHomeScreenStatus failed', { error: String(error) });
      resolve('unsupported');
    }
  });
}

/**
 * Предлагает пользователю добавить приложение на домашний экран
 */
export function addToHomeScreen(): boolean {
  const webApp = getWebAppWithHomeScreen();

  if (!webApp) {
    logDebug('events', 'warn', 'Home screen API not available');
    return false;
  }

  try {
    webApp.addToHomeScreen();
    logDebug('events', 'success', 'addToHomeScreen() called');
    return true;
  } catch (error) {
    logDebug('events', 'error', 'addToHomeScreen failed', { error: String(error) });
    return false;
  }
}

/**
 * Подписывается на событие добавления на домашний экран
 */
export function subscribeToHomeScreenAdded(callback: () => void): () => void {
  const webApp = getWebAppWithHomeScreen();

  if (!webApp) {
    return () => {};
  }

  const handler = () => {
    logDebug('events', 'success', 'App added to home screen');
    callback();
  };

  webApp.onEvent('homeScreenAdded', handler);

  return () => {
    webApp.offEvent('homeScreenAdded', handler);
  };
}

// ============================================================================
// VIEWPORT EVENTS
// ============================================================================

export interface ViewportChangedData {
  isStateStable: boolean;
}

interface TelegramWebAppWithViewport {
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
  onEvent: (eventType: string, callback: (data?: ViewportChangedData) => void) => void;
  offEvent: (eventType: string, callback: (data?: ViewportChangedData) => void) => void;
}

function getWebAppWithViewport(): TelegramWebAppWithViewport | null {
  if (typeof window === 'undefined') return null;

  interface WindowWithTelegram extends Window {
    Telegram?: {
      WebApp?: TelegramWebAppWithViewport;
    };
  }

  return (window as WindowWithTelegram).Telegram?.WebApp ?? null;
}

/**
 * Получает информацию о viewport
 */
export function getViewportInfo(): { height: number; stableHeight: number; isExpanded: boolean } | null {
  const webApp = getWebAppWithViewport();

  if (!webApp) return null;

  return {
    height: webApp.viewportHeight,
    stableHeight: webApp.viewportStableHeight,
    isExpanded: webApp.isExpanded,
  };
}

/**
 * Подписывается на изменения viewport
 */
export function subscribeToViewportChanged(
  callback: (data: ViewportChangedData) => void
): () => void {
  const webApp = getWebAppWithViewport();

  if (!webApp) {
    return () => {};
  }

  const handler = (data?: ViewportChangedData) => {
    if (data) {
      logDebug('events', 'info', 'Viewport changed', data);
      callback(data);
    }
  };

  webApp.onEvent('viewportChanged', handler);

  return () => {
    webApp.offEvent('viewportChanged', handler);
  };
}

// ============================================================================
// THEME EVENTS
// ============================================================================

/**
 * Подписывается на изменение темы
 */
export function subscribeToThemeChanged(callback: () => void): () => void {
  const webApp = getWebApp();

  if (!webApp) {
    return () => {};
  }

  const handler = () => {
    logDebug('events', 'info', 'Theme changed');
    callback();
  };

  webApp.onEvent('themeChanged', handler);

  return () => {
    webApp.offEvent('themeChanged', handler);
  };
}
