// Утилиты для работы с Telegram WebApp API

import { logDebug } from './debug-store';

// ============================================================================
// ТИПЫ
// ============================================================================

export interface TelegramWebApp {
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  expand: () => void;
  requestFullscreen?: () => void;
  setBackgroundColor: (color: string) => void;
  setHeaderColor: (color: string) => void;
  ready: () => void;
  close: () => void;
  [key: string]: unknown;
}

export interface TelegramData {
  initData: string | null;
  userId: number | null;
  startParam: string | null;
}

export interface TelegramInitOptions {
  fullscreen?: boolean;
  disableVerticalSwipe?: boolean;
  requestSafeArea?: boolean;
  requestContentSafeArea?: boolean;
  backgroundColor?: string;
  headerColor?: string;
}

export interface TelegramInitResult {
  success: boolean;
  version: number;
  expandResult: boolean;
  fullscreenResult: boolean;
}

// ============================================================================
// ПОЛУЧЕНИЕ TELEGRAM WEBAPP
// ============================================================================

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;

  interface WindowWithTelegram extends Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }

  const telegram = (window as WindowWithTelegram).Telegram;
  if (!telegram?.WebApp) return null;

  return telegram.WebApp;
}

export function isTelegramEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return !!getTelegramWebApp();
}

export function getTelegramVersion(): number {
  const tg = getTelegramWebApp();
  if (!tg?.version) return 0;
  const version = parseFloat(tg.version);
  return isNaN(version) ? 0 : version;
}

// ============================================================================
// ПОЛУЧЕНИЕ ДАННЫХ ИЗ TELEGRAM
// ============================================================================

export async function getTelegramData(): Promise<TelegramData> {
  let initData: string | null = null;
  let userId: number | null = null;
  let startParam: string | null = null;

  try {
    const sdk = await import('@telegram-apps/sdk-react');

    try {
      const rawData = sdk.retrieveRawInitData?.();
      if (rawData && rawData.length > 0) {
        initData = rawData;
      }
    } catch {
      // Вне Telegram - это нормально
    }

    try {
      const launchParams = sdk.retrieveLaunchParams?.();
      if (launchParams?.tgWebAppData?.user?.id) {
        userId = launchParams.tgWebAppData.user.id;
      }
      if (typeof launchParams?.startParam === 'string') {
        startParam = launchParams.startParam;
      }
    } catch {
      // Вне Telegram - это нормально
    }
  } catch {
    // SDK не доступен
  }

  return { initData, userId, startParam };
}

// ============================================================================
// SAFE POST EVENT
// ============================================================================

async function safePostEvent(eventName: string, payload?: unknown): Promise<boolean> {
  try {
    const sdk = await import('@telegram-apps/sdk-react');
    const postEventAny = sdk.postEvent as (event: string, params?: unknown) => void;

    if (typeof payload === 'undefined') {
      postEventAny(eventName);
    } else {
      postEventAny(eventName, payload);
    }

    logDebug('telegram', 'info', `postEvent: ${eventName}`, payload ?? null);
    return true;
  } catch (error) {
    logDebug('telegram', 'warn', `postEvent ${eventName} failed`, { error: String(error) });
    return false;
  }
}

// ============================================================================
// FULLSCREEN & EXPAND
// ============================================================================

export function expandApp(): boolean {
  try {
    const tg = getTelegramWebApp();
    if (!tg) return false;

    if (typeof tg.expand === 'function') {
      tg.expand();
      logDebug('telegram', 'success', 'WebApp expanded via native expand()');
      return true;
    }
    return false;
  } catch (error) {
    logDebug('telegram', 'warn', 'Failed to expand WebApp', { error: String(error) });
    return false;
  }
}

export async function requestFullscreen(): Promise<boolean> {
  try {
    const tg = getTelegramWebApp();

    if (tg && typeof tg.requestFullscreen === 'function') {
      try {
        tg.requestFullscreen();
        logDebug('telegram', 'success', 'Fullscreen via native requestFullscreen()');
        return true;
      } catch (e) {
        logDebug('telegram', 'warn', 'Native requestFullscreen failed', { error: String(e) });
      }
    }

    const result = await safePostEvent('web_app_request_fullscreen');
    if (result) {
      logDebug('telegram', 'success', 'Fullscreen via postEvent');
      return true;
    }

    return false;
  } catch (error) {
    logDebug('telegram', 'error', 'requestFullscreen error', { error: String(error) });
    return false;
  }
}

export async function setupSwipeBehavior(allowVerticalSwipe: boolean = false): Promise<boolean> {
  return safePostEvent('web_app_setup_swipe_behavior', {
    allow_vertical_swipe: allowVerticalSwipe,
  });
}

export async function requestSafeArea(): Promise<boolean> {
  return safePostEvent('web_app_request_safe_area');
}

export async function requestContentSafeArea(): Promise<boolean> {
  return safePostEvent('web_app_request_content_safe_area');
}

// ============================================================================
// ЦВЕТА И ТЕМА
// ============================================================================

export function setBackgroundColor(color: string): boolean {
  try {
    const tg = getTelegramWebApp();
    if (!tg) return false;

    if (typeof tg.setBackgroundColor === 'function') {
      tg.setBackgroundColor(color);
      logDebug('telegram', 'success', `Background color set to ${color}`);
      return true;
    }
    return false;
  } catch (error) {
    logDebug('telegram', 'warn', 'Failed to set background color', { error: String(error) });
    return false;
  }
}

export function setHeaderColor(color: string): boolean {
  try {
    const tg = getTelegramWebApp();
    if (!tg) return false;

    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor(color);
      logDebug('telegram', 'success', `Header color set to ${color}`);
      return true;
    }
    return false;
  } catch (error) {
    logDebug('telegram', 'warn', 'Failed to set header color', { error: String(error) });
    return false;
  }
}

// ============================================================================
// ПОЛНАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================================================

export async function initTelegramApp(options?: TelegramInitOptions): Promise<TelegramInitResult> {
  const {
    fullscreen = true,
    disableVerticalSwipe = true,
    requestSafeArea: doRequestSafeArea = true,
    requestContentSafeArea: doRequestContentSafeArea = true,
    backgroundColor = '#f3f4f6',
    headerColor = '#f3f4f6',
  } = options || {};

  const version = getTelegramVersion();

  logDebug('telegram', 'info', 'Starting Telegram initialization', {
    version,
    options: { fullscreen, disableVerticalSwipe, backgroundColor, headerColor },
  });

  // 1. SDK init
  try {
    const sdk = await import('@telegram-apps/sdk-react');
    sdk.init();
    logDebug('telegram', 'success', 'SDK init() called');
  } catch (error) {
    logDebug('telegram', 'error', 'SDK init() failed', { error: String(error) });
  }

  // 2. Mount back button
  try {
    const sdk = await import('@telegram-apps/sdk-react');
    sdk.mountBackButton?.();
    logDebug('telegram', 'success', 'BackButton mounted');
  } catch (error) {
    logDebug('telegram', 'warn', 'BackButton mount failed', { error: String(error) });
  }

  // 3. Expand app
  const expandResult = expandApp();

  // 4. Request fullscreen
  let fullscreenResult = false;
  if (fullscreen) {
    fullscreenResult = await requestFullscreen();
  }

  // 5. Setup swipe behavior
  if (disableVerticalSwipe) {
    await setupSwipeBehavior(false);
  }

  // 6. Request safe areas
  if (doRequestSafeArea) {
    await requestSafeArea();
  }
  if (doRequestContentSafeArea) {
    await requestContentSafeArea();
  }

  // 7. Mount miniApp и установка цветов
  try {
    const sdk = await import('@telegram-apps/sdk-react');

    if (typeof sdk.miniApp?.mount === 'function') {
      await sdk.miniApp.mount();
      logDebug('telegram', 'success', 'miniApp.mount() called');
    }

    if (typeof sdk.miniApp?.setBackgroundColor === 'function') {
      sdk.miniApp.setBackgroundColor(backgroundColor);
    } else {
      setBackgroundColor(backgroundColor);
    }

    if (typeof sdk.miniApp?.setHeaderColor === 'function') {
      sdk.miniApp.setHeaderColor(headerColor);
    } else {
      setHeaderColor(headerColor);
    }
  } catch (error) {
    setBackgroundColor(backgroundColor);
    setHeaderColor(headerColor);
    logDebug('telegram', 'warn', 'SDK miniApp methods failed, using native', { error: String(error) });
  }

  logDebug('telegram', 'success', 'Telegram initialization complete', {
    version,
    expandResult,
    fullscreenResult,
  });

  return {
    success: true,
    version,
    expandResult,
    fullscreenResult,
  };
}
