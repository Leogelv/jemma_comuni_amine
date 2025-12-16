import { clsx, type ClassValue } from 'clsx';

/**
 * Утилита для объединения классов
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
