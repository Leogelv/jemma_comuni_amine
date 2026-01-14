'use client';

import React, { useState, useRef, useCallback } from 'react';
import { format, addDays, isSameDay, parseISO, isAfter, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Habit, DayStatus } from '../model/types';
import { DynamicIcon, HABIT_ICONS } from '@/shared/ui';
import { cn } from '@/shared/lib';
import styles from './HabitCard.module.css';

// HabitCard — дизайн как в habitflow-ai

interface HabitCardProps {
  habit: Habit;
  onToggleDate: (habitId: string, date: Date) => void;
  onUpdate?: (habitId: string, data: { title?: string; icon?: string; color?: string }) => void;
  onDelete?: (habitId: string) => void;
  weekStart: Date;
}

// Длительность long press в мс (2 секунды чтобы не срабатывало при скролле)
const LONG_PRESS_DURATION = 2000;
// Порог движения для отмены long press (в пикселях)
const MOVE_THRESHOLD = 10;

// Палитра цветов для выбора
const HABIT_COLORS = [
  '#8B5CF6', // Фиолетовый (по умолчанию)
  '#6366F1', // Индиго
  '#3B82F6', // Синий
  '#06B6D4', // Циан
  '#10B981', // Изумрудный
  '#22C55E', // Зеленый
  '#EAB308', // Желтый
  '#F97316', // Оранжевый
  '#EF4444', // Красный
  '#EC4899', // Розовый
  '#A855F7', // Пурпурный
  '#6B7280', // Серый
];

// Тип анимации при клике
type AnimationType = 'complete' | 'uncomplete' | null;

export function HabitCard({ habit, onToggleDate, onUpdate, onDelete, weekStart }: HabitCardProps) {
  // Храним анимацию для каждого дня: dateStr -> тип анимации
  const [animatingDays, setAnimatingDays] = useState<Record<string, AnimationType>>({});

  // Режим редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(habit.title);
  const [editIcon, setEditIcon] = useState(habit.icon);
  const [editColor, setEditColor] = useState(habit.color);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Long press detection
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const today = startOfDay(new Date());

  // Обработчики long press с отменой при движении (скролле)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      // Вибрация при входе в режим редактирования (если поддерживается)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setIsEditing(true);
      setEditTitle(habit.title);
      setEditIcon(habit.icon);
      setEditColor(habit.color);
      setShowIconPicker(false);
      setShowColorPicker(false);
    }, LONG_PRESS_DURATION);
  }, [habit.title, habit.icon, habit.color]);

  // Отмена long press при движении пальца (скролл)
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;

    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);

    // Если палец сдвинулся больше порога — отменяем long press
    if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      touchStartPos.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
  }, []);

  // Для мыши (десктоп) — без отслеживания движения
  const handleMouseDown = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setIsEditing(true);
      setEditTitle(habit.title);
      setEditIcon(habit.icon);
      setEditColor(habit.color);
      setShowIconPicker(false);
      setShowColorPicker(false);
    }, LONG_PRESS_DURATION);
  }, [habit.title, habit.icon, habit.color]);

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Сохранение изменений
  const handleSave = useCallback(() => {
    const trimmed = editTitle.trim();
    const titleChanged = trimmed && trimmed !== habit.title;
    const iconChanged = editIcon !== habit.icon;
    const colorChanged = editColor !== habit.color;

    if ((titleChanged || iconChanged || colorChanged) && onUpdate) {
      onUpdate(habit.id, {
        ...(titleChanged && { title: trimmed }),
        ...(iconChanged && { icon: editIcon }),
        ...(colorChanged && { color: editColor }),
      });
    }
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setShowIconPicker(false);
    setShowColorPicker(false);
  }, [editTitle, editIcon, editColor, habit.id, habit.title, habit.icon, habit.color, onUpdate]);

  // Отмена редактирования
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditTitle(habit.title);
    setEditIcon(habit.icon);
    setEditColor(habit.color);
    setShowDeleteConfirm(false);
    setShowIconPicker(false);
    setShowColorPicker(false);
  }, [habit.title, habit.icon, habit.color]);

  // Удаление
  const handleDelete = useCallback(() => {
    if (showDeleteConfirm && onDelete) {
      onDelete(habit.id);
      setIsEditing(false);
    } else {
      setShowDeleteConfirm(true);
    }
  }, [showDeleteConfirm, onDelete, habit.id]);

  // Генерируем 7 дней выбранной недели
  const days: DayStatus[] = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(weekStart, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    return {
      date: d,
      dateStr,
      isCompleted: habit.completed_dates.some(cd => isSameDay(parseISO(cd), d)),
      isToday: isSameDay(d, today),
      dayName: format(d, 'EEEEEE', { locale: ru }).charAt(0).toUpperCase() + format(d, 'EEEEEE', { locale: ru }).slice(1),
      dayNumber: format(d, 'd'),
    };
  });

  const handleDayClick = (day: DayStatus) => {
    // Определяем тип анимации (до toggle)
    const animType: AnimationType = day.isCompleted ? 'uncomplete' : 'complete';

    // Запускаем анимацию
    setAnimatingDays(prev => ({ ...prev, [day.dateStr]: animType }));

    // Вызываем toggle
    onToggleDate(habit.id, day.date);

    // Убираем анимацию через 600ms
    setTimeout(() => {
      setAnimatingDays(prev => ({ ...prev, [day.dateStr]: null }));
    }, 600);
  };

  // Streak текст
  const streakText = habit.streak === 1
    ? '1 день подряд'
    : habit.streak > 1
      ? `${habit.streak} ${habit.streak < 5 ? 'дня' : 'дней'} подряд`
      : '';

  // Генерируем CSS переменные на основе цвета привычки
  const cardStyle = {
    '--habit-color': habit.color,
    '--habit-color-bg': `${habit.color}15`,
    '--habit-color-light': `${habit.color}30`,
    '--habit-color-shadow': `${habit.color}40`,
  } as React.CSSProperties;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${styles.card} ${isEditing ? styles.editing : ''}`}
      style={cardStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <AnimatePresence mode="wait">
        {isEditing ? (
          // Режим редактирования
          <motion.div
            key="editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.editMode}
          >
            {/* Строка с иконкой, цветом и названием */}
            <div className={styles.editRow}>
              {/* Кнопка выбора иконки */}
              <button
                type="button"
                onClick={() => { setShowIconPicker(!showIconPicker); setShowColorPicker(false); }}
                className={styles.iconSelector}
                style={{ backgroundColor: `${editColor}20`, color: editColor }}
              >
                <DynamicIcon name={editIcon} size={22} />
              </button>

              {/* Кнопка выбора цвета */}
              <button
                type="button"
                onClick={() => { setShowColorPicker(!showColorPicker); setShowIconPicker(false); }}
                className={styles.colorSelector}
                style={{ backgroundColor: editColor }}
                title="Выбрать цвет"
              />

              {/* Input для редактирования названия */}
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={styles.editInput}
                style={{ color: editColor, borderColor: `${editColor}30` }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                placeholder="Название привычки"
              />
            </div>

            {/* Выбор иконки */}
            <AnimatePresence>
              {showIconPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={styles.iconPicker}
                >
                  <div className={styles.iconGrid}>
                    {HABIT_ICONS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          setEditIcon(item.name);
                          setShowIconPicker(false);
                        }}
                        className={cn(
                          styles.iconOption,
                          editIcon === item.name && styles.iconSelected
                        )}
                        style={editIcon === item.name ? { borderColor: habit.color, color: habit.color } : undefined}
                        title={item.label}
                      >
                        <DynamicIcon name={item.name} size={20} />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Выбор цвета */}
            <AnimatePresence>
              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={styles.colorPicker}
                >
                  <div className={styles.colorGrid}>
                    {HABIT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setEditColor(color);
                          setShowColorPicker(false);
                        }}
                        className={cn(
                          styles.colorOption,
                          editColor === color && styles.colorSelected
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Кнопки действий */}
            <div className={styles.editActions}>
              <button
                onClick={handleDelete}
                className={`${styles.editButton} ${styles.deleteButton} ${showDeleteConfirm ? styles.confirmDelete : ''}`}
              >
                {showDeleteConfirm ? 'Точно удалить?' : 'Удалить'}
              </button>
              <div className={styles.editButtonGroup}>
                <button onClick={handleCancel} className={`${styles.editButton} ${styles.cancelButton}`}>
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className={`${styles.editButton} ${styles.saveButton}`}
                  disabled={!editTitle.trim()}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          // Обычный режим
          <motion.div
            key="normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header: иконка + название слева, streak справа */}
            <div className={styles.header}>
              <div className={styles.titleRow}>
                <div
                  className={styles.habitIcon}
                  style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                >
                  <DynamicIcon name={habit.icon} size={18} />
                </div>
                <h3 className={styles.title} style={{ color: habit.color }}>
                  {habit.title}
                </h3>
              </div>
              {habit.streak > 0 && (
                <span className={styles.streak}>{streakText}</span>
              )}
            </div>

            {/* Days Grid */}
            <div className={styles.daysGrid}>
              {days.map((day) => {
                const isFuture = isAfter(startOfDay(day.date), today);
                const animState = animatingDays[day.dateStr];

                const dayButtonClasses = [
                  styles.dayButton,
                  day.isCompleted && styles.completed,
                  day.isToday && !day.isCompleted && styles.today,
                  isFuture && styles.future,
                  animState === 'complete' && styles.justCompleted,
                  animState === 'uncomplete' && styles.justUncompleted,
                ].filter(Boolean).join(' ');

                return (
                  <div key={day.dateStr} className={styles.dayColumn}>
                    <span className={styles.dayName}>{day.dayName}</span>
                    <button
                      onClick={() => !isFuture && handleDayClick(day)}
                      disabled={isFuture}
                      className={dayButtonClasses}
                    >
                      {day.dayNumber}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
