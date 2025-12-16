# Редизайн дизайн-системы Anti Self-Deception

**Дата:** 2025-12-16
**Статус:** Утверждён

## Концепция

Гибрид Apple Health + Stripe/Vercel: чистый белый фон, мягкие карточки с тенями, контрастные чёрные заголовки, цветные акценты только для состояний.

## Цветовая палитра

### Основные цвета
| Роль | Цвет | Код |
|------|------|-----|
| Фон | Белый | `#FFFFFF` |
| Текст основной | Slate-900 | `#0F172A` |
| Текст вторичный | Slate-500 | `#64748B` |
| Границы | Slate-100 | `#F1F5F9` |

### Акцентные цвета (состояния)
| Роль | Цвет | Код |
|------|------|-----|
| Success/выполнено | Emerald | `#10B981` |
| Primary/активный | Indigo | `#6366F1` |

### Категории (приглушённые)
| Категория | Цвет | Код |
|-----------|------|-----|
| Sport | Coral | `#F97316` |
| Nutrition | Mint | `#14B8A6` |
| Regime | Sky | `#0EA5E9` |
| Other | Violet | `#8B5CF6` |

## Типографика

- **Заголовки:** `font-semibold`, text-2xl для H1
- **Body:** `font-normal`, slate-700
- **Мелкий текст:** `font-medium`, slate-500, uppercase tracking-wide

## Скругления

- Карточки: `rounded-2xl` (16px)
- Кнопки/бейджи: `rounded-xl` (12px)
- Круглые элементы: `rounded-full`

## Тени

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);
```

---

## Компоненты

### HabitCard

**Структура:**
- Белый фон, shadow-sm, hover → shadow-md
- Вертикальная полоска 3px слева (цвет категории)
- Заголовок: `text-lg font-semibold text-slate-900`
- Streak badge: bg-orange-50, text-orange-600

**Отметки дней:**
- Не выполнено: кольцо `border-2 border-slate-200`
- Выполнено: `bg-emerald-500` с белой галочкой, shadow
- Сегодня: пульсирующее `ring-2 ring-indigo-300`

**Анимации:**
- Tap: scale-95 → scale-110 → scale-100
- Галочка: fade + scale from center

### StatsPanel

**Stat-карточки (3 в ряд):**
- Большое число: `text-3xl font-bold text-slate-900`
- Подпись: `text-xs font-medium text-slate-400 uppercase`
- Иконка в цветном бейдже сверху

### Календарь-хитмап

- GitHub-стиль, 7 рядов × 4-5 недель
- Градация: slate-100 → emerald-200 → emerald-400 → emerald-600
- Tooltip при тапе

### Area Chart (Recharts)

- Линия: stroke-indigo-500
- Заливка: градиент indigo-400/30 → transparent
- Сетка: stroke-slate-100
- Переключатель: Неделя | Месяц | Год

### BottomNav

- Белый фон, border-t border-slate-100
- Иконки Lucide, stroke-width: 1.5
- Неактивный: text-slate-400
- Активный: text-slate-900 + точка снизу

### AddHabitModal

- Backdrop: bg-black/20
- Sheet: белый, rounded-t-3xl
- Input: border border-slate-200, focus → border-indigo-500
- Кнопка: bg-slate-900 text-white

---

## Структура файлов

```
src/
├── shared/ui/           # Button, Card, Badge, Input, Skeleton
├── shared/config/       # categories.ts (новые цвета)
├── shared/lib/          # animations.ts
├── entities/habit/ui/   # HabitCard.tsx
├── widgets/
│   ├── stats-panel/     # StatsPanel.tsx
│   ├── bottom-nav/      # BottomNav.tsx
│   ├── heatmap-calendar/# HeatmapCalendar.tsx
│   └── charts/          # AreaChart.tsx, WeeklyChart.tsx
├── pages-layer/home/ui/ # HomePage.tsx, ProgressView.tsx
├── features/add-habit/  # AddHabitModal.tsx
└── app/globals.css      # CSS-токены
```

## Зависимости

```bash
npm install recharts
```

## Порядок реализации

1. globals.css — токены
2. shared/ui/* — базовые компоненты
3. categories.ts — новые цвета
4. HabitCard.tsx — с анимациями
5. BottomNav.tsx
6. StatsPanel.tsx
7. HeatmapCalendar.tsx
8. AreaChart.tsx
9. ProgressView.tsx
10. AddHabitModal.tsx
11. HomePage.tsx — интеграция
