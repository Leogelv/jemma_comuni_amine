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

// ============================================================================
// HIGH-LEVEL API: Кэширование данных (привычки, пользователь)
// Для мгновенного отображения при повторном входе
// ============================================================================

const HABITS_CACHE_KEY = 'habits_cache';
const USER_CACHE_KEY = 'user_cache';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 часа

interface CachedData<T> {
  data: T;
  timestamp: number;
  telegramId: number;
}

/**
 * Сохраняет привычки в кэш для мгновенного отображения
 */
export async function cacheHabits<T>(telegramId: number, habits: T): Promise<StorageResult> {
  const cached: CachedData<T> = {
    data: habits,
    timestamp: Date.now(),
    telegramId,
  };

  const jsonData = JSON.stringify(cached);
  logDebug('storage', 'info', `Caching habits for user ${telegramId}`);

  // Пробуем DeviceStorage (быстрее)
  if (isDeviceStorageAvailable()) {
    const result = await deviceStorageSet(HABITS_CACHE_KEY, jsonData);
    if (result.success) {
      return result;
    }
  }

  // Fallback на CloudStorage
  if (isCloudStorageAvailable()) {
    return cloudStorageSet(HABITS_CACHE_KEY, jsonData);
  }

  // Fallback на localStorage
  try {
    localStorage.setItem(HABITS_CACHE_KEY, jsonData);
    logDebug('storage', 'success', 'Habits cached to localStorage');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'No storage available' };
  }
}

/**
 * Загружает привычки из кэша
 * Возвращает данные только если они принадлежат тому же пользователю и не истекли
 */
export async function loadCachedHabits<T>(telegramId: number): Promise<StorageResult<T>> {
  logDebug('storage', 'info', `Loading cached habits for user ${telegramId}`);

  const parseAndValidate = (jsonData: string): T | null => {
    try {
      const cached = JSON.parse(jsonData) as CachedData<T>;

      // Проверяем что это тот же пользователь
      if (cached.telegramId !== telegramId) {
        logDebug('storage', 'info', 'Cache belongs to different user');
        return null;
      }

      // Проверяем TTL
      if (Date.now() - cached.timestamp > CACHE_TTL) {
        logDebug('storage', 'info', 'Cache expired');
        return null;
      }

      return cached.data;
    } catch {
      return null;
    }
  };

  // Пробуем DeviceStorage
  if (isDeviceStorageAvailable()) {
    const result = await deviceStorageGet(HABITS_CACHE_KEY);
    if (result.success && result.data) {
      const data = parseAndValidate(result.data);
      if (data) {
        logDebug('storage', 'success', 'Habits loaded from DeviceStorage cache');
        return { success: true, data };
      }
    }
  }

  // Пробуем CloudStorage
  if (isCloudStorageAvailable()) {
    const result = await cloudStorageGet(HABITS_CACHE_KEY);
    if (result.success && result.data) {
      const data = parseAndValidate(result.data);
      if (data) {
        logDebug('storage', 'success', 'Habits loaded from CloudStorage cache');
        return { success: true, data };
      }
    }
  }

  // Пробуем localStorage
  try {
    const stored = localStorage.getItem(HABITS_CACHE_KEY);
    if (stored) {
      const data = parseAndValidate(stored);
      if (data) {
        logDebug('storage', 'success', 'Habits loaded from localStorage cache');
        return { success: true, data };
      }
    }
  } catch {
    // Ignore
  }

  logDebug('storage', 'info', 'No valid habits cache found');
  return { success: true, data: undefined };
}

/**
 * Сохраняет данные пользователя в кэш
 */
export async function cacheUser<T>(telegramId: number, user: T): Promise<StorageResult> {
  const cached: CachedData<T> = {
    data: user,
    timestamp: Date.now(),
    telegramId,
  };

  const jsonData = JSON.stringify(cached);

  if (isDeviceStorageAvailable()) {
    const result = await deviceStorageSet(USER_CACHE_KEY, jsonData);
    if (result.success) return result;
  }

  if (isCloudStorageAvailable()) {
    return cloudStorageSet(USER_CACHE_KEY, jsonData);
  }

  try {
    localStorage.setItem(USER_CACHE_KEY, jsonData);
    return { success: true };
  } catch {
    return { success: false, error: 'No storage available' };
  }
}

/**
 * Загружает данные пользователя из кэша
 */
export async function loadCachedUser<T>(telegramId: number): Promise<StorageResult<T>> {
  const parseAndValidate = (jsonData: string): T | null => {
    try {
      const cached = JSON.parse(jsonData) as CachedData<T>;
      if (cached.telegramId !== telegramId) return null;
      if (Date.now() - cached.timestamp > CACHE_TTL) return null;
      return cached.data;
    } catch {
      return null;
    }
  };

  if (isDeviceStorageAvailable()) {
    const result = await deviceStorageGet(USER_CACHE_KEY);
    if (result.success && result.data) {
      const data = parseAndValidate(result.data);
      if (data) return { success: true, data };
    }
  }

  if (isCloudStorageAvailable()) {
    const result = await cloudStorageGet(USER_CACHE_KEY);
    if (result.success && result.data) {
      const data = parseAndValidate(result.data);
      if (data) return { success: true, data };
    }
  }

  try {
    const stored = localStorage.getItem(USER_CACHE_KEY);
    if (stored) {
      const data = parseAndValidate(stored);
      if (data) return { success: true, data };
    }
  } catch {
    // Ignore
  }

  return { success: true, data: undefined };
}
