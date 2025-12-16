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
import { CalendarView } from './CalendarView';
import { SettingsView } from './SettingsView';
import { ProgressView } from './ProgressView';

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
    <div className="min-h-screen bg-[var(--background)] relative pb-24">
      {/* Home Tab */}
      {activeTab === 'home' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="animate-fade-in"
        >
          {/* Header */}
          <div className="px-6 pt-12 pb-4 safe-area-top">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h1 className="text-3xl font-light text-gray-800 tracking-tight">
                  Anti Self-Deception
                </h1>
                <p className="text-sm text-gray-400 font-medium mt-1">
                  {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-xl">
                <Trophy size={18} className="text-yellow-500" />
                <span className="text-lg font-bold text-yellow-600">
                  {totalPoints}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Mini Panel */}
          <div className="px-4 mb-4">
            <StatsPanel habits={habits} totalPoints={totalPoints} />
          </div>

          {/* Habits List */}
          <div className="px-4">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
              </div>
            ) : (
              <HabitList habits={habits} onToggleDate={handleToggleDate} />
            )}
          </div>

          {/* FAB */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-600 transition-all hover:scale-110 z-40"
          >
            <Plus size={28} />
          </button>
        </motion.div>
      )}

      {/* Progress Tab */}
      {activeTab === 'stats' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="animate-fade-in"
        >
          <ProgressView habits={habits} totalPoints={totalPoints} />
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="animate-fade-in"
        >
          <CalendarView habits={habits} />
        </motion.div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="animate-fade-in"
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
  );
}
