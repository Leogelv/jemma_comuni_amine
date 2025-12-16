// Zustand store для управления дебаг-логами
// Централизованное хранилище логов для отображения в DebugPanel

import { create } from 'zustand';

const MAX_LOGS = 500;

export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface DebugLog {
  id: string;
  timestamp: Date;
  namespace: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

interface DebugStoreState {
  logs: DebugLog[];
  isOpen: boolean;
  addLog: (namespace: string, level: LogLevel, message: string, data?: unknown) => void;
  clearLogs: () => void;
  togglePanel: () => void;
}

function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useDebugStore = create<DebugStoreState>((set) => ({
  logs: [],
  isOpen: false,

  addLog: (namespace, level, message, data) => {
    const log: DebugLog = {
      id: generateLogId(),
      timestamp: new Date(),
      namespace,
      level,
      message,
      data,
    };

    set((state) => ({
      logs: [...state.logs, log].slice(-MAX_LOGS),
    }));
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  togglePanel: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },
}));

/**
 * Утилита для логирования вне React компонентов
 */
export function logDebug(
  namespace: string,
  level: LogLevel,
  message: string,
  data?: unknown
): void {
  queueMicrotask(() => {
    useDebugStore.getState().addLog(namespace, level, message, data);
  });
}
