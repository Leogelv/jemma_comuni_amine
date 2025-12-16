# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anti Self-Deception — минималистичный трекер привычек с AI-функциональностью. Фокус на честности и приоритезированном самосовершенствовании.

## Commands

```bash
npm run dev      # Запуск dev-сервера на http://localhost:3000
npm run build    # Сборка для продакшена
npm run preview  # Превью production-билда
```

## Environment

Требуется файл `.env.local` с переменной `GEMINI_API_KEY` для AI-функций.

## Architecture

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS (CDN) + Gemini AI API

**Структура:**
- `App.tsx` — главный компонент с state management (useState), навигацией между табами (home/history/settings)
- `components/` — UI компоненты (HabitCard, AddHabitModal, RecommendationsModal, CalendarView, SettingsView, BottomNav, FloatingActionButton, ReflectionSection, PremiumModal)
- `services/geminiService.ts` — интеграция с Gemini API (@google/genai) для генерации рекомендаций привычек
- `types.ts` — TypeScript типы (Habit, CategoryType, DayStatus, AIHabitSuggestion, PrioritizedHabit)

**Особенности:**
- Tailwind подключен через CDN в index.html (не PostCSS)
- Import maps в index.html для ESM модулей
- Локализация на русский язык (date-fns/locale/ru)
- Категории привычек: sport, nutrition, regime, other — каждая с цветовой темой

**Data flow:**
- State хранится в App.tsx (habits, modals state)
- completedDates хранятся как ISO строки 'YYYY-MM-DD'
- Привычки передаются в компоненты через props
