// Категории привычек — обновлённая дизайн-система

export type CategoryType = 'sport' | 'nutrition' | 'regime' | 'other';

export interface CategoryConfig {
  id: CategoryType;
  label: string;
  emoji: string;
  // Цвета для нового дизайна (приглушённые)
  color: string;        // Основной цвет (для индикатора)
  colorLight: string;   // Светлый фон
  colorClass: string;   // Tailwind класс для текста
  bgClass: string;      // Tailwind класс для светлого фона
  points: number;
}

export const CATEGORIES: Record<CategoryType, CategoryConfig> = {
  sport: {
    id: 'sport',
    label: 'Спорт',
    emoji: '💪',
    color: '#F97316',      // orange-500
    colorLight: '#FFF7ED', // orange-50
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-50',
    points: 10,
  },
  nutrition: {
    id: 'nutrition',
    label: 'Питание',
    emoji: '🥗',
    color: '#14B8A6',      // teal-500
    colorLight: '#F0FDFA', // teal-50
    colorClass: 'text-teal-500',
    bgClass: 'bg-teal-50',
    points: 8,
  },
  regime: {
    id: 'regime',
    label: 'Режим',
    emoji: '⏰',
    color: '#0EA5E9',      // sky-500
    colorLight: '#F0F9FF', // sky-50
    colorClass: 'text-sky-500',
    bgClass: 'bg-sky-50',
    points: 12,
  },
  other: {
    id: 'other',
    label: 'Другое',
    emoji: '✨',
    color: '#8B5CF6',      // violet-500
    colorLight: '#F5F3FF', // violet-50
    colorClass: 'text-violet-500',
    bgClass: 'bg-violet-50',
    points: 5,
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

// Хелпер для получения категории с fallback
export function getCategory(categoryId: string): CategoryConfig {
  return CATEGORIES[categoryId as CategoryType] || CATEGORIES.other;
}
