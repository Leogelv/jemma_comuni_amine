'use client';

import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTelegramUser } from '@/entities/user';
import { useHabits, useCreateHabit, useToggleHabitCompletion, useUpdateHabitTitle, useDeleteHabit } from '@/entities/habit';
import { CategoryType } from '@/shared/config';
import { HabitList } from '@/widgets/habit-list';
import { BottomNav, TabType } from '@/widgets/bottom-nav';
import { AddHabitModal } from '@/features/add-habit';
import { SkeletonCard } from '@/shared/ui';
import { CalendarView } from './CalendarView';
import { SettingsView } from './SettingsView';
import { ProgressView } from './ProgressView';
import styles from './HomePage.module.css';

// HomePage — главная страница с навигацией по неделям

export function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const { user, isLoading: userLoading } = useTelegramUser();
  const telegramId = user?.telegram_id;

  const { data: habits = [], isLoading: habitsLoading } = useHabits(telegramId);
  const createHabit = useCreateHabit();
  const toggleHabit = useToggleHabitCompletion();
  const updateHabitTitle = useUpdateHabitTitle();
  const deleteHabit = useDeleteHabit();

  // Проверка: текущая ли это неделя
  const isCurrentWeek = isSameWeek(selectedWeekStart, new Date(), { weekStartsOn: 1 });

  // Навигация по неделям
  const goToPreviousWeek = () => {
    setSelectedWeekStart(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    if (!isCurrentWeek) {
      setSelectedWeekStart(prev => addWeeks(prev, 1));
    }
  };

  // Форматирование диапазона дат недели
  const weekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 });
  const weekRangeText = `${format(selectedWeekStart, 'd', { locale: ru })} – ${format(weekEnd, 'd MMMM', { locale: ru })}`;

  const handleAddHabit = (title: string, category: CategoryType) => {
    if (telegramId) {
      createHabit.mutate({
        telegram_id: telegramId,
        title,
        category,
      });
    }
  };

  const handleToggleDate = (habitId: string, date: Date) => {
    if (telegramId) {
      toggleHabit.mutate({
        habit_id: habitId,
        date: format(date, 'yyyy-MM-dd'),
        telegram_id: telegramId,
      });
    }
  };

  const handleUpdateTitle = (habitId: string, newTitle: string) => {
    if (telegramId) {
      updateHabitTitle.mutate({
        habit_id: habitId,
        title: newTitle,
        telegram_id: telegramId,
      });
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    if (telegramId) {
      deleteHabit.mutate({
        habit_id: habitId,
        telegram_id: telegramId,
      });
    }
  };

  const isLoading = userLoading || habitsLoading;
  const totalPoints = user?.total_points || 0;

  return (
    <div className={styles.page}>
      {/* Контейнер с max-width для desktop */}
      <div className={styles.container}>
        {/* Home Tab */}
        {activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.tabContent}
          >
            {/* Habitflow-style Header */}
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>Привычки</h1>
              <div className={styles.headerActions}>
                <button
                  onClick={() => setActiveTab('history')}
                  className={styles.headerButton}
                  aria-label="Календарь"
                >
                  <Calendar size={24} />
                </button>
                <button
                  className={styles.headerButton}
                  aria-label="Меню"
                >
                  <ChevronDown size={24} />
                </button>
              </div>
            </div>

            {/* Week Navigation */}
            <div className={styles.weekNav}>
              <button
                onClick={goToPreviousWeek}
                className={styles.navButton}
                aria-label="Предыдущая неделя"
              >
                <ChevronLeft size={20} />
              </button>

              <div className={styles.weekInfo}>
                <span className={styles.weekRange}>{weekRangeText}</span>
                {isCurrentWeek && (
                  <span className={styles.currentWeekBadge}>Текущая</span>
                )}
              </div>

              <button
                onClick={goToNextWeek}
                className={`${styles.navButton} ${isCurrentWeek ? styles.navButtonDisabled : ''}`}
                disabled={isCurrentWeek}
                aria-label="Следующая неделя"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Habits List */}
            <div className={styles.habitsSection}>
              {isLoading ? (
                <div className={styles.skeletonList}>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : habits.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.emptyState}
                >
                  <div className={styles.emptyStateIcon}>
                    <Plus size={32} />
                  </div>
                  <h3>Нет привычек</h3>
                  <p>Добавьте первую привычку для отслеживания</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className={styles.emptyStateButton}
                  >
                    Добавить привычку
                  </button>
                </motion.div>
              ) : (
                <HabitList
                  habits={habits}
                  onToggleDate={handleToggleDate}
                  onUpdateTitle={handleUpdateTitle}
                  onDelete={handleDeleteHabit}
                  weekStart={selectedWeekStart}
                />
              )}
            </div>

            {/* FAB */}
            {habits.length > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
                onClick={() => setIsAddModalOpen(true)}
                className={styles.fab}
              >
                <Plus size={24} strokeWidth={2.5} />
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Progress Tab */}
        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.tabContent}
          >
            <ProgressView habits={habits} totalPoints={totalPoints} />
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.tabContent}
          >
            <CalendarView habits={habits} />
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.tabContent}
          >
            <SettingsView
              habits={habits}
              user={user}
              telegramId={telegramId}
            />
          </motion.div>
        )}

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />

        {/* Add Habit Modal */}
        <AddHabitModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddHabit}
        />
      </div>
    </div>
  );
}
