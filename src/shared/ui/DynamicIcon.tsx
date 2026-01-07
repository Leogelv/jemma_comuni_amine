'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * DynamicIcon — рендерит иконку по названию из lucide-react
 *
 * Использование:
 * <DynamicIcon name="dumbbell" size={20} color="#F97316" />
 */

interface DynamicIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

// Кэш для маппинга имён (kebab-case -> PascalCase)
const iconCache = new Map<string, React.ComponentType<LucideIcons.LucideProps>>();

// Конвертирует kebab-case в PascalCase
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function DynamicIcon({
  name,
  size = 20,
  color,
  className,
  strokeWidth = 2,
}: DynamicIconProps) {
  // Пробуем получить иконку из кэша
  let IconComponent = iconCache.get(name);

  if (!IconComponent) {
    // Конвертируем имя в PascalCase
    const pascalName = toPascalCase(name);

    // Ищем в lucide-react (приводим через unknown из-за сложных типов Icon)
    IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<LucideIcons.LucideProps>>)[pascalName];

    // Если не нашли — fallback на Circle
    if (!IconComponent) {
      IconComponent = LucideIcons.Circle;
    }

    // Кэшируем
    iconCache.set(name, IconComponent);
  }

  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      strokeWidth={strokeWidth}
    />
  );
}

// Предустановленные иконки для выбора в UI
export const HABIT_ICONS = [
  // Спорт
  { name: 'dumbbell', label: 'Гантеля' },
  { name: 'flame', label: 'Огонь' },
  { name: 'footprints', label: 'Шаги' },
  { name: 'zap', label: 'Молния' },
  { name: 'sparkles', label: 'Блеск' },
  { name: 'flower-2', label: 'Цветок' },
  // Ментальное
  { name: 'brain', label: 'Мозг' },
  { name: 'wind', label: 'Ветер' },
  { name: 'heart', label: 'Сердце' },
  { name: 'pen-tool', label: 'Перо' },
  { name: 'smartphone-off', label: 'Детокс' },
  // Режим
  { name: 'sunrise', label: 'Рассвет' },
  { name: 'moon', label: 'Луна' },
  { name: 'droplets', label: 'Капли' },
  { name: 'bed', label: 'Кровать' },
  // Питание
  { name: 'glass-water', label: 'Вода' },
  { name: 'apple', label: 'Яблоко' },
  { name: 'cookie', label: 'Печенье' },
  { name: 'salad', label: 'Салат' },
  { name: 'ban', label: 'Запрет' },
  // Саморазвитие
  { name: 'book-open', label: 'Книга' },
  { name: 'languages', label: 'Языки' },
  { name: 'lightbulb', label: 'Идея' },
  { name: 'headphones', label: 'Наушники' },
  { name: 'graduation-cap', label: 'Обучение' },
  // Продуктивность
  { name: 'calendar-check', label: 'Календарь' },
  { name: 'target', label: 'Цель' },
  { name: 'timer', label: 'Таймер' },
  { name: 'mail-check', label: 'Почта' },
  // Социальное
  { name: 'phone-call', label: 'Звонок' },
  { name: 'heart-handshake', label: 'Доброта' },
  { name: 'users', label: 'Люди' },
  // Базовые
  { name: 'circle', label: 'Круг' },
  { name: 'star', label: 'Звезда' },
  { name: 'check', label: 'Галочка' },
] as const;

// Предустановленные цвета
export const HABIT_COLORS = [
  '#F97316', // Orange
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#64748B', // Slate
  '#22C55E', // Green
] as const;
