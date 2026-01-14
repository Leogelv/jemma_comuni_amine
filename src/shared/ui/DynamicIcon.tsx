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

// Предустановленные иконки для выбора в UI (~100 иконок)
export const HABIT_ICONS = [
  // === СПОРТ И ФИТНЕС ===
  { name: 'dumbbell', label: 'Гантеля', keywords: 'спорт фитнес тренировка gym' },
  { name: 'flame', label: 'Огонь', keywords: 'калории сжигание энергия fire' },
  { name: 'footprints', label: 'Шаги', keywords: 'ходьба прогулка walk steps' },
  { name: 'zap', label: 'Молния', keywords: 'энергия сила power energy' },
  { name: 'bike', label: 'Велосипед', keywords: 'велик cycling спорт' },
  { name: 'trophy', label: 'Трофей', keywords: 'победа награда достижение' },
  { name: 'medal', label: 'Медаль', keywords: 'награда спорт достижение' },
  { name: 'swords', label: 'Мечи', keywords: 'бой martial arts единоборства' },
  { name: 'mountain', label: 'Гора', keywords: 'hiking climbing альпинизм' },
  { name: 'waves', label: 'Волны', keywords: 'плавание swimming бассейн море' },
  { name: 'stretch-horizontal', label: 'Растяжка', keywords: 'yoga stretching гибкость' },
  { name: 'heart-pulse', label: 'Пульс', keywords: 'кардио сердце здоровье' },

  // === МЕНТАЛЬНОЕ ЗДОРОВЬЕ ===
  { name: 'brain', label: 'Мозг', keywords: 'ум мышление интеллект mind' },
  { name: 'wind', label: 'Ветер', keywords: 'дыхание медитация breath calm' },
  { name: 'heart', label: 'Сердце', keywords: 'любовь эмоции чувства love' },
  { name: 'sparkles', label: 'Блеск', keywords: 'магия вдохновение magic' },
  { name: 'smile', label: 'Улыбка', keywords: 'радость счастье happy' },
  { name: 'leaf', label: 'Лист', keywords: 'природа спокойствие nature calm' },
  { name: 'flower-2', label: 'Цветок', keywords: 'красота рост growth flower' },
  { name: 'tree-deciduous', label: 'Дерево', keywords: 'природа рост tree nature' },
  { name: 'cloud-sun', label: 'Облако', keywords: 'погода настроение mood' },
  { name: 'rainbow', label: 'Радуга', keywords: 'радость цвета joy colors' },
  { name: 'sun', label: 'Солнце', keywords: 'свет энергия тепло sun' },
  { name: 'eye', label: 'Глаз', keywords: 'осознанность внимание awareness' },
  { name: 'shield', label: 'Щит', keywords: 'защита безопасность protection' },

  // === СОН И РЕЖИМ ===
  { name: 'sunrise', label: 'Рассвет', keywords: 'утро пробуждение morning' },
  { name: 'sunset', label: 'Закат', keywords: 'вечер отдых evening' },
  { name: 'moon', label: 'Луна', keywords: 'ночь сон sleep night' },
  { name: 'bed', label: 'Кровать', keywords: 'сон отдых sleep rest' },
  { name: 'alarm-clock', label: 'Будильник', keywords: 'утро подъём wake alarm' },
  { name: 'clock', label: 'Часы', keywords: 'время режим time schedule' },
  { name: 'hourglass', label: 'Песочные часы', keywords: 'время терпение time' },
  { name: 'coffee', label: 'Кофе', keywords: 'утро энергия coffee morning' },
  { name: 'lamp', label: 'Лампа', keywords: 'свет вечер light evening' },

  // === ПИТАНИЕ И ЗДОРОВЬЕ ===
  { name: 'droplets', label: 'Капли', keywords: 'вода гидратация water hydration' },
  { name: 'glass-water', label: 'Вода', keywords: 'питьё гидратация water drink' },
  { name: 'apple', label: 'Яблоко', keywords: 'фрукт здоровье fruit healthy' },
  { name: 'salad', label: 'Салат', keywords: 'овощи здоровье vegetables healthy' },
  { name: 'carrot', label: 'Морковь', keywords: 'овощи витамины vegetables' },
  { name: 'cherry', label: 'Вишня', keywords: 'ягоды фрукты berries fruit' },
  { name: 'grape', label: 'Виноград', keywords: 'фрукты ягоды grapes fruit' },
  { name: 'banana', label: 'Банан', keywords: 'фрукт калий banana fruit' },
  { name: 'egg', label: 'Яйцо', keywords: 'белок завтрак protein breakfast' },
  { name: 'fish', label: 'Рыба', keywords: 'омега белок fish omega protein' },
  { name: 'beef', label: 'Мясо', keywords: 'белок еда meat protein' },
  { name: 'cookie', label: 'Печенье', keywords: 'сладкое десерт sweet dessert' },
  { name: 'candy', label: 'Конфета', keywords: 'сладкое candy sweet' },
  { name: 'pizza', label: 'Пицца', keywords: 'фастфуд еда pizza food' },
  { name: 'utensils', label: 'Приборы', keywords: 'еда питание food eating' },
  { name: 'pill', label: 'Таблетка', keywords: 'витамины лекарство vitamins medicine' },
  { name: 'syringe', label: 'Шприц', keywords: 'лекарство здоровье medicine' },
  { name: 'thermometer', label: 'Термометр', keywords: 'температура здоровье health' },
  { name: 'ban', label: 'Запрет', keywords: 'отказ stop quit ban' },
  { name: 'cigarette-off', label: 'Без сигарет', keywords: 'курение отказ smoking quit' },
  { name: 'wine-off', label: 'Без алкоголя', keywords: 'алкоголь отказ sober' },

  // === САМОРАЗВИТИЕ ===
  { name: 'book-open', label: 'Книга', keywords: 'чтение обучение reading book' },
  { name: 'book', label: 'Закрытая книга', keywords: 'чтение library библиотека' },
  { name: 'notebook', label: 'Блокнот', keywords: 'записи заметки notes journal' },
  { name: 'pen-tool', label: 'Перо', keywords: 'письмо творчество writing' },
  { name: 'pencil', label: 'Карандаш', keywords: 'рисование writing drawing' },
  { name: 'languages', label: 'Языки', keywords: 'изучение language learning' },
  { name: 'lightbulb', label: 'Идея', keywords: 'креатив мысль idea creative' },
  { name: 'headphones', label: 'Наушники', keywords: 'подкаст музыка podcast music' },
  { name: 'graduation-cap', label: 'Обучение', keywords: 'учёба education study' },
  { name: 'library', label: 'Библиотека', keywords: 'книги чтение books library' },
  { name: 'microscope', label: 'Микроскоп', keywords: 'наука research science' },
  { name: 'flask-conical', label: 'Колба', keywords: 'химия наука science' },
  { name: 'calculator', label: 'Калькулятор', keywords: 'математика math numbers' },
  { name: 'code', label: 'Код', keywords: 'программирование coding dev' },
  { name: 'palette', label: 'Палитра', keywords: 'рисование искусство art painting' },
  { name: 'music', label: 'Музыка', keywords: 'инструмент music playing' },
  { name: 'guitar', label: 'Гитара', keywords: 'музыка инструмент guitar music' },
  { name: 'piano', label: 'Пианино', keywords: 'музыка инструмент piano music' },
  { name: 'mic', label: 'Микрофон', keywords: 'речь пение speaking singing' },
  { name: 'camera', label: 'Камера', keywords: 'фото photography camera' },
  { name: 'video', label: 'Видео', keywords: 'съёмка video recording' },

  // === ПРОДУКТИВНОСТЬ ===
  { name: 'calendar-check', label: 'Календарь', keywords: 'план расписание schedule' },
  { name: 'calendar-days', label: 'Дни', keywords: 'неделя планирование week' },
  { name: 'target', label: 'Цель', keywords: 'фокус goal focus aim' },
  { name: 'crosshair', label: 'Прицел', keywords: 'фокус концентрация focus' },
  { name: 'timer', label: 'Таймер', keywords: 'pomodoro время timer' },
  { name: 'mail-check', label: 'Почта', keywords: 'email inbox письма' },
  { name: 'inbox', label: 'Входящие', keywords: 'email почта inbox' },
  { name: 'check-circle', label: 'Готово', keywords: 'выполнено done complete' },
  { name: 'list-checks', label: 'Список', keywords: 'задачи todo list tasks' },
  { name: 'clipboard-list', label: 'Планер', keywords: 'задачи planning tasks' },
  { name: 'folder', label: 'Папка', keywords: 'организация files folder' },
  { name: 'file-text', label: 'Документ', keywords: 'файл document file' },
  { name: 'briefcase', label: 'Портфель', keywords: 'работа business work' },
  { name: 'laptop', label: 'Ноутбук', keywords: 'работа компьютер work laptop' },
  { name: 'smartphone', label: 'Телефон', keywords: 'мобильный phone mobile' },
  { name: 'smartphone-off', label: 'Детокс', keywords: 'отключение digital detox' },
  { name: 'wifi-off', label: 'Офлайн', keywords: 'отключение disconnect offline' },

  // === СОЦИАЛЬНОЕ ===
  { name: 'phone-call', label: 'Звонок', keywords: 'общение call communication' },
  { name: 'message-circle', label: 'Сообщение', keywords: 'чат message chat' },
  { name: 'heart-handshake', label: 'Доброта', keywords: 'помощь kindness help' },
  { name: 'users', label: 'Люди', keywords: 'друзья семья friends family' },
  { name: 'user', label: 'Человек', keywords: 'персона person self' },
  { name: 'baby', label: 'Ребёнок', keywords: 'дети family kids' },
  { name: 'hand-heart', label: 'Забота', keywords: 'помощь care help' },
  { name: 'gift', label: 'Подарок', keywords: 'праздник gift present' },
  { name: 'party-popper', label: 'Праздник', keywords: 'веселье party celebration' },

  // === ДОМ И БЫТ ===
  { name: 'home', label: 'Дом', keywords: 'уборка home house' },
  { name: 'sofa', label: 'Диван', keywords: 'отдых relax rest' },
  { name: 'bath', label: 'Ванна', keywords: 'гигиена relaxation bath' },
  { name: 'shirt', label: 'Одежда', keywords: 'гардероб clothes wardrobe' },
  { name: 'scissors', label: 'Ножницы', keywords: 'стрижка haircut grooming' },
  { name: 'spray-can', label: 'Спрей', keywords: 'уборка cleaning spray' },
  { name: 'trash-2', label: 'Мусор', keywords: 'уборка declutter trash' },
  { name: 'recycle', label: 'Переработка', keywords: 'экология recycle eco' },
  { name: 'leaf', label: 'Эко', keywords: 'экология природа eco nature' },

  // === ФИНАНСЫ ===
  { name: 'wallet', label: 'Кошелёк', keywords: 'деньги финансы money wallet' },
  { name: 'piggy-bank', label: 'Копилка', keywords: 'сбережения savings money' },
  { name: 'coins', label: 'Монеты', keywords: 'деньги coins money' },
  { name: 'credit-card', label: 'Карта', keywords: 'оплата payment card' },
  { name: 'receipt', label: 'Чек', keywords: 'расходы expenses receipt' },
  { name: 'trending-up', label: 'Рост', keywords: 'инвестиции growth investing' },

  // === БАЗОВЫЕ ===
  { name: 'circle', label: 'Круг', keywords: 'простой basic circle' },
  { name: 'square', label: 'Квадрат', keywords: 'простой basic square' },
  { name: 'triangle', label: 'Треугольник', keywords: 'простой basic triangle' },
  { name: 'star', label: 'Звезда', keywords: 'избранное favorite star' },
  { name: 'check', label: 'Галочка', keywords: 'готово done check' },
  { name: 'plus', label: 'Плюс', keywords: 'добавить add plus' },
  { name: 'rocket', label: 'Ракета', keywords: 'старт launch rocket' },
  { name: 'flag', label: 'Флаг', keywords: 'цель milestone flag' },
  { name: 'bookmark', label: 'Закладка', keywords: 'сохранить bookmark save' },
  { name: 'compass', label: 'Компас', keywords: 'направление direction compass' },
  { name: 'map', label: 'Карта', keywords: 'путь journey map' },
  { name: 'crown', label: 'Корона', keywords: 'достижение achievement crown' },
  { name: 'gem', label: 'Камень', keywords: 'ценность gem valuable' },
  { name: 'infinity', label: 'Бесконечность', keywords: 'вечность infinity forever' },
  { name: 'anchor', label: 'Якорь', keywords: 'стабильность anchor stability' },
  { name: 'key', label: 'Ключ', keywords: 'доступ секрет key secret' },
  { name: 'lock', label: 'Замок', keywords: 'безопасность security lock' },
  { name: 'bell', label: 'Колокол', keywords: 'напоминание reminder bell' },
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
