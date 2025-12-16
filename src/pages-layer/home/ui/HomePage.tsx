'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTelegramUser } from '@/entities/user';
import { useHabits, useCreateHabit, useToggleHabitCompletion } from '@/entities/habit';
import { CategoryType } from '@/shared/config';
import { HabitList } from '@/widgets/habit-list';
import { StatsPanel } from '@/widgets/stats-panel';
import { BottomNav, TabType } from '@/widgets/bottom-nav';
import { AddHabitModal } from '@/features/add-habit';
import { SkeletonCard, SkeletonStats } from '@/shared/ui';
import { CalendarView } from './CalendarView';
import { SettingsView } from './SettingsView';
import { ProgressView } from './ProgressView';
import styles from './HomePage.module.css';

// HomePage — главная страница приложения с табами

export function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { user, isLoading: userLoading } = useTelegramUser();
  const telegramId = user?.telegram_id;

  const { data: habits = [], isLoading: habitsLoading } = useHabits(telegramId);
  const createHabit = useCreateHabit();
  const toggleHabit = useToggleHabitCompletion();

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
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <div className={styles.headerText}>
                  <p>
                    {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
                  </p>
                  <h1>Anti Self-Deception</h1>
                </div>
                <div className={styles.pointsBadge}>
                  <Trophy size={16} />
                  <span>{totalPoints}</span>
                </div>
              </div>
            </div>

            {/* Stats Mini Panel */}
            <div className={styles.statsSection}>
              {isLoading ? (
                <SkeletonStats />
              ) : (
                <StatsPanel habits={habits} totalPoints={totalPoints} />
              )}
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
                <HabitList habits={habits} onToggleDate={handleToggleDate} />
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
