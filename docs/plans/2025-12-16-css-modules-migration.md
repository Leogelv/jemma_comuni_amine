# План миграции: Tailwind → CSS Modules

**Дата:** 2025-12-16
**Цель:** Удалить Tailwind CSS, перейти на CSS Modules + CSS Variables

## Решения

- **CSS Modules** — scoped стили, встроены в Next.js
- **CSS Variables** — единый источник токенов
- **Mobile-first** — max-width 480px, центрирование на десктопе

## Структура стилей

```
src/shared/styles/
├── tokens.css       # CSS Variables (цвета, размеры, glassmorphism)
├── globals.css      # Reset, базовые стили, импорт tokens
└── animations.css   # Keyframes
```

## Компоненты для переписывания (24 шт)

### Shared UI (5)
- Card.tsx
- Badge.tsx
- Button.tsx
- Input.tsx
- Skeleton.tsx

### Widgets (6)
- BottomNav.tsx
- StatsPanel.tsx
- HabitList.tsx
- StreakChart.tsx
- PointsChart.tsx
- HeatmapCalendar.tsx

### Pages/Features (5)
- HomePage.tsx
- ProgressView.tsx
- CalendarView.tsx
- SettingsView.tsx
- AddHabitModal.tsx

### Entities (1)
- HabitCard.tsx

### App Layer (4)
- layout.tsx
- page.tsx
- providers (оставляем логику, убираем tailwind классы)

## Порядок выполнения

1. **Инфраструктура** — удалить tailwind, создать tokens.css, обновить globals.css
2. **Shared UI** — базовые компоненты с CSS Modules
3. **Entities** — HabitCard
4. **Widgets** — композитные компоненты
5. **Pages** — финальная сборка

## CSS Variables (tokens.css)

```css
:root {
  /* Background */
  --color-bg: #090B13;
  --color-bg-gradient-start: #090B13;
  --color-bg-gradient-mid: #141727;
  --color-bg-gradient-end: #1E2240;

  /* Text */
  --color-text: #ededed;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #475569;

  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-bg-hover: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-border-hover: rgba(255, 255, 255, 0.2);
  --glass-blur: 24px;

  /* Categories */
  --color-sport: #F97316;
  --color-sport-bg: rgba(249, 115, 22, 0.2);
  --color-nutrition: #14B8A6;
  --color-nutrition-bg: rgba(20, 184, 166, 0.2);
  --color-regime: #8B5CF6;
  --color-regime-bg: rgba(139, 92, 246, 0.2);
  --color-other: #64748B;
  --color-other-bg: rgba(100, 116, 139, 0.2);

  /* Accent */
  --color-accent: #10B981;
  --color-danger: #EF4444;

  /* Layout */
  --content-max-width: 480px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.3);

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}
```

## Glassmorphism миксин (паттерн)

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.glass:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
}
```

## Layout контейнер

```css
.container {
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--spacing-md);
}
```
