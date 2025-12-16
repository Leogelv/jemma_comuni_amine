# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anti Self-Deception — Telegram Mini App для отслеживания привычек с геймификацией (система очков). Минималистичный интерфейс, фокус на честности и приоритезированном самосовершенствовании.

## Commands

```bash
npm run dev      # Dev-сервер с Turbopack (http://localhost:3000)
npm run build    # Production-сборка
npm run start    # Запуск production-сервера
npm run lint     # ESLint проверка
```

## Environment Variables

Файл `.env.local` обязателен:
```
NEXT_PUBLIC_SUPABASE_URL         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Public anon key для браузера
SUPABASE_URL                     # Для API routes (fallback)
SUPABASE_SERVICE_ROLE_KEY        # Admin key для сервера
NEXT_PUBLIC_ALLOW_BROWSER_ACCESS # "true" для доступа вне Telegram
```

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + Supabase + React Query + Zustand

### FSD Structure (Feature Sliced Design)

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (habits, user)
│   └── providers/         # Context providers (Query, Telegram, User)
├── pages-layer/home/      # Page components (HomePage, views)
├── widgets/               # Composite UI (HabitList, StatsPanel, BottomNav)
├── features/              # Feature modules (add-habit modal)
├── entities/              # Domain models
│   ├── habit/            # Habit CRUD, types, HabitCard
│   └── user/             # Telegram user context, upsert
└── shared/               # Shared utilities
    ├── api/supabase/     # Supabase client + generated types
    ├── config/           # Categories config (sport, nutrition, regime, other)
    └── lib/              # Utils (cn, telegram-sdk, debug-store)
```

**Import Rule:** Слои импортируют только вниз. Feature ← Entities ← Shared.

### Data Flow

1. **React Query** (`@tanstack/react-query`) — fetching и кеширование с invalidation
2. **API Routes** (`app/api/`) — CRUD операции с Supabase
3. **Zustand** — минимальный state management

**Query Keys:**
- `['habits', telegramId]` — список привычек пользователя
- `['user', telegramId]` — данные пользователя

### Key Business Logic

**Streak Calculation** ([route.ts:91](src/app/api/habits/route.ts#L91)):
- Требует последовательные дни
- Сбрасывается при пропуске > 1 дня
- Учитывает "сегодня или вчера" как стартовую точку

**Points System** ([categories.ts](src/shared/config/categories.ts)):
- sport: 10, nutrition: 8, regime: 12, other: 5
- Начисляются/списываются при toggle completion

### Telegram Integration

- SDK: `@telegram-apps/sdk-react`
- Fullscreen + safe areas для notches
- Цветовая тема: #f3f4f6
- Fallback для браузера через `NEXT_PUBLIC_ALLOW_BROWSER_ACCESS=true`

### Database (Supabase)

**Tables:**
- `habits`: id, telegram_id, title, category, streak, completed_dates[], total_completions, created_at
- `tg_users`: telegram_id, username, first_name, last_name, photo_url, total_points, current_streak

Types сгенерированы в [database.types.ts](src/shared/api/supabase/database.types.ts).

## Path Aliases

`@/*` → `./src/*` (настроено в tsconfig.json)
