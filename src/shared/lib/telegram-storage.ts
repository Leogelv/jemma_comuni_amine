// Утилиты для работы с Telegram Storage API (Bot API 9.0+)
// DeviceStorage — локальное хранилище на устройстве
// CloudStorage — облачное хранилище Telegram (Bot API 6.9+)
// SecureStorage — защищённое хранилище (iOS Keychain / Android Keystore)

import { logDebug } from './debug-store';
import { getTelegramVersion } from './telegram-sdk';

// ============================================================================
// ТИПЫ
// ============================================================================

export interface StorageResult<T = string> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AppState {
  lastPage?: string;
  scrollPosition?: number;
  timestamp?: number;
  // Расширяемо под нужды приложения
  [key: string]: unknown;
}

type StorageCallback = (error: string | null, value: string | null) => void;

interface TelegramDeviceStorage {
  setItem: (key: string, value: string, callback?: StorageCallback) => void;
  getItem: (key: string, callback: StorageCallback) => void;
  removeItem: (key: string, callback?: StorageCallback) => void;
  clear: (callback?: StorageCallback) => void;
}

interface TelegramCloudStorage {
  setItem: (key: string, value: string, callback?: (error: string | null, success?: boolean) => void) => void;
  getItem: (key: string, callback: (error: string | null, value?: string) => void) => void;
  getItems: (keys: string[], callback: (error: string | null, values?: Record<string, string>) => void) => void;
  removeItem: (key: string, callback?: (error: string | null, success?: boolean) => void) => void;
  removeItems: (keys: string[], callback?: (error: string | null, success?: boolean) => void) => void;
  getKeys: (callback: (error: string | null, keys?: string[]) => void) => void;
}

interface TelegramSecureStorage {
  setItem: (key: string, value: string, callback?: StorageCallback) => void;
  getItem: (key: string, callback: StorageCallback) => void;
  removeItem: (key: string, callback?: StorageCallback) => void;
  clear: (callback?: StorageCallback) => void;
  restoreItem: (key: string, callback: StorageCallback) => void;
}

interface TelegramWebAppWithStorage {
  DeviceStorage?: TelegramDeviceStorage;
  CloudStorage?: TelegramCloudStorage;
  SecureStorage?: TelegramSecureStorage;
}

// ============================================================================
// ПОЛУЧЕНИЕ STORAGE API
// ============================================================================

function getWebApp(): TelegramWebAppWithStorage | null {
  if (typeof window === 'undefined') return null;

  interface WindowWithTelegram extends Window {
    Telegram?: {
      WebApp?: TelegramWebAppWithStorage;
    };
  }

  return (window as WindowWithTelegram).Telegram?.WebApp ?? null;
}

// ============================================================================
// DEVICE STORAGE (Bot API 9.0+)
// Локальное хранилище на устройстве, быстрое, не синхронизируется
// ============================================================================

export function isDeviceStorageAvailable(): boolean {
  const version = getTelegramVersion();
  if (version < 9.0) return false;

  const webApp = getWebApp();
  return !!webApp?.DeviceStorage;
}

export function deviceStorageSet(key: string, value: string): Promise<StorageResult> {
  return new Promise((resolve) => {
    const webApp = getWebApp();

    if (!webApp?.DeviceStorage) {
      logDebug('storage', 'warn', 'DeviceStorage not available');
      resolve({ success: false, error: 'DeviceStorage not available' });
      return;
    }

    try {
      webApp.DeviceStorage.setItem(key, value, (error) => {
        if (error) {
          logDebug('storage', 'error', `DeviceStorage.setItem failed: ${key}`, { error });
          resolve({ success: false, error });
        } else {
          logDebug('storage', 'success', `DeviceStorage.setItem: ${key}`);
          resolve({ success: true });
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logDebug('storage', 'error', 'DeviceStorage.setItem exception', { error: errorMsg });
      resolve({ success: false, error: errorMsg });
    }
  });
}

export function deviceStorageGet(key: string): Promise<StorageResult> {
  return new Promise((resolve) => {
    const webApp = getWebApp();

    if (!webApp?.DeviceStorage) {
      logDebug('storage', 'warn', 'DeviceStorage not available');
      resolve({ success: false, error: 'DeviceStorage not available' });
      return;
    }

    try {
      webApp.DeviceStorage.getItem(key, (error, value) => {
        if (error) {
          logDebug('storage', 'error', `DeviceStorage.getItem failed: ${key}`, { error });
          resolve({ success: false, error });
        } else {
          logDebug('storage', 'success', `DeviceStorage.getItem: ${key}`, { hasValue: !!value });
          resolve({ success: true, data: value ?? undefined });
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logDebug('storage', 'error', 'DeviceStorage.getItem exception', { error: errorMsg });
      resolve({ success: false, error: errorMsg });
    }
  });
}

export function deviceStorageRemove(key: string): Promise<StorageResult> {
  return new Promise((resolve) => {
    const webApp = getWebApp();

    if (!webApp?.DeviceStorage) {
      resolve({ success: false, error: 'DeviceStorage not available' });
      return;
    }

    try {
      webApp.DeviceStorage.removeItem(key, (error) => {
        if (error) {
          resolve({ success: false, error });
        } else {
          logDebug('storage', 'success', `DeviceStorage.removeItem: ${key}`);
          resolve({ success: true });
        }
      });
    } catch (error) {
      resolve({ success: false, error: String(error) });
    }
  });
}

export function deviceStorageClear(): Promise<StorageResult> {
  return new Promise((resolve) => {
    const webApp = getWebApp();

    if (!webApp?.DeviceStorage) {
      resolve({ success: false, error: 'DeviceStorage not available' });
      return;
    }

    try {
      webApp.DeviceStorage.clear((error) => {
        if (error) {
          resolve({ success: false, error });
        } else {
          logDebug('storage', 'success', 'DeviceStorage cleared');
          resolve({ success: true });
        }
      });
    } catch (error) {
      resolve({ success: false, error: String(error) });
    }
  });
}

// ============================================================================
// CLOUD STORAGE (Bot API 6.9+)
// Облачное хранилище Telegram, синхронизируется между устройствами
// До 1024 ключей, каждое значение до 4096 байт
// ============================================================================

export function isCloudStorageAvailable(): boolean {
  const version = getTelegramVersion();
  if (version < 6.9) return false;

  const webApp = getWebApp();
  return !!webApp?.CloudStorage;
}

export function cloudStorageSet(key: string, value: string): Promise<StorageResult> {
  return new Promise((resolve) => {
    const webApp = getWebApp();

    if (!webApp?.CloudStorage) {
      logDebug('storage', 'warn', 'CloudStorage not available');
      resolve({ success: false, error: 'CloudStorage not available' });
      return;
    }

    try {
      webApp.CloudStorage.setItem(key, value, (error, success) => {
        if (error || !success) {
          logDebug('storage', 'error', `CloudStorage.setItem failed: ${key}`, { error });
          resolve({ success: false, error: error ?? 'Unknown error' });
        } else {
          logDebug('storage', 'success', `CloudStorage.setItem: ${key}`);
          resolve({ success: true });
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logDebug('storage', 'error', 'CloudStorage.setItem exception', { error: errorMsg });
      resolve({ success: false, error: errorMsg });
    }
  });
}

export function cloudStorageGet(key: string): Promise<StorageResult> {
  return new Promise((resolve) => {
    const webApp = getWebApp();

    if (!webApp?.CloudStorage) {
      logDebug('storage', 'warn', 'CloudStorage not available');
      resolve({ success: false, error: 'CloudStorage not available' });
      return;
    }

    try {
      webApp.CloudStorage.getItem(key, (error, value) => {
        if (error) {
          logDebug('storage', 'error', `CloudStorage.getItem failed: ${key}`, { error });
          resolve({ success: false, error });
        } else {
          logDebug('storage', 'success', `CloudStorage.getItem: ${key}`, { hasValue: !!value });
          resolve({ success: true, data: value ?? undefined });
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logDebug('storage', 'error', 'CloudStorage.getItem exception', { error: errorMsg });
      resolve({ success: false, error: errorMsg });
    }
  });
}

export function cloudStorageGetMultiple(keys: string[]): Promise<StorageResult<Record<string, string>>> {
  return new Promise((resolve) => {
    const webApp = getWebApp();

    if (!webApp?.CloudStorage) {
      resolve({ success: false, error: 'CloudStorage not available' });
      return;
    }

    try {
      webApp.CloudStorage.getItems(keys, (error, values) => {
        if (error) {
          resolve({ success: false, error });
        } else {
          resolve({ success: true, data: values ?? {} });
        }
      });
    } catch (error) {
      resolve({ success: false, error: String(error) });
    }
  });
}

export function cloudStorageRemove(key: string): Promise<StorageResult> {
  return new Promise((resolve) => {
    const webApp = getWebApp();

    if (!webApp?.CloudStorage) {
      resolve({ success: false, error: 'CloudStorage not available' });
      return;
    }

    try {
      webApp.CloudStorage.removeItem(key, (error, success) => {
        if (error || !success) {
          resolve({ success: false, error: error ?? 'Unknown error' });
        } else {
          logDebug('storage', 'success', `CloudStorage.removeItem: ${key}`);
          resolve({ success: true });
        }
      });
    } catch (error) {
      resolve({ success: false, error: String(error) });
    }
  });
}

export function cloudStorageGetKeys(): Promise<StorageResult<string[]>> {
  return new Promise((resolve) => {
    const webApp = getWebApp();

    if (!webApp?.CloudStorage) {
      resolve({ success: false, error: 'CloudStorage not available' });
      return;
    }

    try {
      webApp.CloudStorage.getKeys((error, keys) => {
        if (error) {
          resolve({ success: false, error });
        } else {
          resolve({ success: true, data: keys ?? [] });
        }
      });
    } catch (error) {
      resolve({ success: false, error: String(error) });
    }
  });
}

// ============================================================================
// SECURE STORAGE (Bot API 9.0+)
// Защищённое хранилище (iOS Keychain / Android Keystore)
// Для чувствительных данных: токены, ключи
// ============================================================================

export function isSecureStorageAvailable(): boolean {
  const version = getTelegramVersion();
  if (version < 9.0) return false;

  const webApp = getWebApp();
  return !!webApp?.SecureStorage;
}

export function secureStorageSet(key: string, value: string): Promise<StorageResult> {
  return new Promise((resolve) => {
    const webApp = getWebApp();

    if (!webApp?.SecureStorage) {
      logDebug('storage', 'warn', 'SecureStorage not available');
      resolve({ success: false, error: 'SecureStorage not available' });
      return;
    }

    try {
      webApp.SecureStorage.setItem(key, value, (error) => {
        if (error) {
          logDebug('storage', 'error', `SecureStorage.setItem failed: ${key}`, { error });
          resolve({ success: false, error });
        } else {
          logDebug('storage', 'success', `SecureStorage.setItem: ${key}`);
          resolve({ success: true });
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      resolve({ success: false, error: errorMsg });
    }
  });
}

export function secureStorageGet(key: string): Promise<StorageResult> {
  return new Promise((resolve) => {
    const webApp = getWebApp();

    if (!webApp?.SecureStorage) {
      resolve({ success: false, error: 'SecureStorage not available' });
      return;
    }

    try {
      webApp.SecureStorage.getItem(key, (error, value) => {
        if (error) {
          resolve({ success: false, error });
        } else {
          resolve({ success: true, data: value ?? undefined });
        }
      });
    } catch (error) {
      resolve({ success: false, error: String(error) });
    }
  });
}

// ============================================================================
// HIGH-LEVEL API: Сохранение состояния приложения
// Автоматически выбирает лучший доступный storage
// ============================================================================

const APP_STATE_KEY = 'app_state';

/**
 * Сохраняет состояние приложения
 * Приоритет: DeviceStorage (быстрый) -> CloudStorage (fallback)
 */
export async function saveAppState(state: AppState): Promise<StorageResult> {
  const stateWithTimestamp: AppState = {
    ...state,
    timestamp: Date.now(),
  };

  const jsonState = JSON.stringify(stateWithTimestamp);
  logDebug('storage', 'info', 'Saving app state', stateWithTimestamp);

  // Пробуем DeviceStorage (быстрее, локальный)
  if (isDeviceStorageAvailable()) {
    const result = await deviceStorageSet(APP_STATE_KEY, jsonState);
    if (result.success) {
      return result;
    }
  }

  // Fallback на CloudStorage
  if (isCloudStorageAvailable()) {
    return cloudStorageSet(APP_STATE_KEY, jsonState);
  }

  // Fallback на localStorage для браузера
  try {
    localStorage.setItem(APP_STATE_KEY, jsonState);
    logDebug('storage', 'success', 'App state saved to localStorage');
    return { success: true };
  } catch (error) {
    logDebug('storage', 'error', 'All storage methods failed');
    return { success: false, error: 'No storage available' };
  }
}

/**
 * Восстанавливает состояние приложения
 * Приоритет: DeviceStorage -> CloudStorage -> localStorage
 */
export async function loadAppState(): Promise<StorageResult<AppState>> {
  logDebug('storage', 'info', 'Loading app state');

  // Пробуем DeviceStorage
  if (isDeviceStorageAvailable()) {
    const result = await deviceStorageGet(APP_STATE_KEY);
    if (result.success && result.data) {
      try {
        const state = JSON.parse(result.data) as AppState;
        logDebug('storage', 'success', 'App state loaded from DeviceStorage', state);
        return { success: true, data: state };
      } catch {
        logDebug('storage', 'warn', 'Failed to parse DeviceStorage state');
      }
    }
  }

  // Пробуем CloudStorage
  if (isCloudStorageAvailable()) {
    const result = await cloudStorageGet(APP_STATE_KEY);
    if (result.success && result.data) {
      try {
        const state = JSON.parse(result.data) as AppState;
        logDebug('storage', 'success', 'App state loaded from CloudStorage', state);
        return { success: true, data: state };
      } catch {
        logDebug('storage', 'warn', 'Failed to parse CloudStorage state');
      }
    }
  }

  // Fallback на localStorage
  try {
    const stored = localStorage.getItem(APP_STATE_KEY);
    if (stored) {
      const state = JSON.parse(stored) as AppState;
      logDebug('storage', 'success', 'App state loaded from localStorage', state);
      return { success: true, data: state };
    }
  } catch {
    logDebug('storage', 'warn', 'Failed to load from localStorage');
  }

  logDebug('storage', 'info', 'No saved app state found');
  return { success: true, data: undefined };
}

/**
 * Очищает сохранённое состояние
 */
export async function clearAppState(): Promise<StorageResult> {
  const results: boolean[] = [];

  if (isDeviceStorageAvailable()) {
    const result = await deviceStorageRemove(APP_STATE_KEY);
    results.push(result.success);
  }

  if (isCloudStorageAvailable()) {
    const result = await cloudStorageRemove(APP_STATE_KEY);
    results.push(result.success);
  }

  try {
    localStorage.removeItem(APP_STATE_KEY);
    results.push(true);
  } catch {
    results.push(false);
  }

  logDebug('storage', 'success', 'App state cleared');
  return { success: results.some(r => r) };
}
