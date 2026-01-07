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
  onUpdate?: (habitId: string, data: { title?: string; icon?: string }) => void;
  onDelete?: (habitId: string) => void;
  weekStart: Date;
}

// Длительность long press в мс
const LONG_PRESS_DURATION = 500;

// Тип анимации при клике
type AnimationType = 'complete' | 'uncomplete' | null;

export function HabitCard({ habit, onToggleDate, onUpdate, onDelete, weekStart }: HabitCardProps) {
  // Храним анимацию для каждого дня: dateStr -> тип анимации
  const [animatingDays, setAnimatingDays] = useState<Record<string, AnimationType>>({});

  // Режим редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(habit.title);
  const [editIcon, setEditIcon] = useState(habit.icon);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Long press detection
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const today = startOfDay(new Date());

  // Обработчики long press
  const handlePressStart = useCallback(() => {
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
      setShowIconPicker(false);
    }, LONG_PRESS_DURATION);
  }, [habit.title, habit.icon]);

  const handlePressEnd = useCallback(() => {
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

    if ((titleChanged || iconChanged) && onUpdate) {
      onUpdate(habit.id, {
        ...(titleChanged && { title: trimmed }),
        ...(iconChanged && { icon: editIcon }),
      });
    }
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setShowIconPicker(false);
  }, [editTitle, editIcon, habit.id, habit.title, habit.icon, onUpdate]);

  // Отмена редактирования
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditTitle(habit.title);
    setEditIcon(habit.icon);
    setShowDeleteConfirm(false);
    setShowIconPicker(false);
  }, [habit.title, habit.icon]);

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
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
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
            {/* Строка с иконкой и названием */}
            <div className={styles.editRow}>
              {/* Кнопка выбора иконки */}
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className={styles.iconSelector}
                style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
              >
                <DynamicIcon name={editIcon} size={22} />
              </button>

              {/* Input для редактирования названия */}
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={styles.editInput}
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
