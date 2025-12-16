// Категории привычек

export type CategoryType = 'sport' | 'nutrition' | 'regime' | 'other';

export interface CategoryConfig {
  id: CategoryType;
  label: string;
  emoji: string;
  bgLight: string;
  bgDark: string;
  textColor: string;
  activeColor: string;
  points: number; // Базовые баллы за выполнение
}

export const CATEGORIES: Record<CategoryType, CategoryConfig> = {
  sport: {
    id: 'sport',
    label: 'Спорт',
    emoji: '💪',
    bgLight: 'bg-yellow-50',
    bgDark: 'bg-yellow-900/20',
    textColor: 'text-yellow-600',
    activeColor: 'bg-yellow-400',
    points: 10,
  },
  nutrition: {
    id: 'nutrition',
    label: 'Питание',
    emoji: '🥗',
    bgLight: 'bg-green-50',
    bgDark: 'bg-green-900/20',
    textColor: 'text-green-600',
    activeColor: 'bg-green-500',
    points: 8,
  },
  regime: {
    id: 'regime',
    label: 'Режим',
    emoji: '⏰',
    bgLight: 'bg-sky-50',
    bgDark: 'bg-sky-900/20',
    textColor: 'text-sky-600',
    activeColor: 'bg-sky-400',
    points: 12,
  },
  other: {
    id: 'other',
    label: 'Другое',
    emoji: '✨',
    bgLight: 'bg-purple-50',
    bgDark: 'bg-purple-900/20',
    textColor: 'text-purple-600',
    activeColor: 'bg-purple-400',
    points: 5,
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);
