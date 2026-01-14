'use client';

import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useTelegramUser } from '@/entities/user';
import { useHabits, useCreateHabit, useToggleHabitCompletion, useUpdateHabit, useDeleteHabit } from '@/entities/habit';
import { CategoryType } from '@/shared/config';
import { HabitList } from '@/widgets/habit-list';
import { BottomNav, TabType } from '@/widgets/bottom-nav';
import { AddHabitModal } from '@/features/add-habit';
import { SkeletonCard } from '@/shared/ui';
import { AnalyticsView } from './AnalyticsView';
import { ProfileView } from './ProfileView';
import { useViewport } from '@/app/providers/TelegramContext';
import styles from './HomePage.module.css';

/**
 * HomePage — главная страница приложения
 *
 * Layout паттерн (как в SELF-deploy-prod):
 * - fixed inset-0 + tg-safe-page — фиксированный контейнер с Telegram safe area
 * - flex column overflow-hidden — структура для раздельного скролла
 * - flex-1 overflow-y-auto — скролл ТОЛЬКО внутри контента
 *
 * Структура навигации:
 * - home: Трекер привычек с недельной навигацией
 * - analytics: Объединённый раздел аналитики (статистика, прогресс, история)
 *
 * Центральная кнопка в навбаре открывает модальное окно добавления привычки
 */

export function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const { isMobile } = useViewport();

  const { user, isLoading: userLoading } = useTelegramUser();
  const telegramId = user?.telegram_id;

  const { data: habits = [], isLoading: habitsLoading } = useHabits(telegramId);
  const createHabit = useCreateHabit();
  const toggleHabit = useToggleHabitCompletion();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  // Текущая ли неделя
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

  const handleAddHabit = (title: string, category: CategoryType, icon: string, color: string) => {
    if (telegramId) {
      createHabit.mutate({
        telegram_id: telegramId,
        title,
        category,
        icon,
        color,
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

  const handleUpdateHabit = (habitId: string, data: { title?: string; icon?: string; color?: string }) => {
    if (telegramId) {
      updateHabit.mutate({
        habit_id: habitId,
        telegram_id: telegramId,
        ...data,
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
  const photoUrl = user?.photo_url;

  // Показываем профиль как отдельный экран
  if (showProfile) {
    return (
      <div className={`app-screen ${isMobile ? 'with-safe-area' : 'with-safe-area-desktop'}`}>
        <div className="app-screen__scroll">
          <ProfileView onBack={() => setShowProfile(false)} habits={habits} />
        </div>
      </div>
    );
  }

  /*
    СТРУКТУРА LAYOUT:

    <app-screen> — fixed на весь экран + padding-top для safe area
      <app-screen__scroll> — flex:1, overflow-y:auto — ВСЁ скроллится тут
        [Header]
        [WeekNav]
        [Content]
        [Padding снизу 120px для BottomNav]
      </app-screen__scroll>
    </app-screen>
    <BottomNav /> — fixed внизу
  */

  return (
    <>
      {/* APP SCREEN — фиксированный контейнер с safe area */}
      <div className={`app-screen ${isMobile ? 'with-safe-area' : 'with-safe-area-desktop'}`}>

        {/* SCROLL CONTAINER — единственное место где скролл */}
        <div className="app-screen__scroll">

          {/* Home Tab */}
          {activeTab === 'home' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Header */}
              <div className={styles.header}>
                <button
                  onClick={() => setShowProfile(true)}
                  className={styles.avatarButton}
                  aria-label="Открыть профиль"
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="Avatar" className={styles.avatarImage} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      <User size={20} />
                    </div>
                  )}
                </button>
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

              {/* Content */}
              <div className={styles.contentWrapper}>
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
                    onUpdate={handleUpdateHabit}
                    onDelete={handleDeleteHabit}
                    weekStart={selectedWeekStart}
                  />
                )}
              </div>

              {/* Запас хода снизу для BottomNav */}
              <div style={{ height: '120px' }} />
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AnalyticsView
                habits={habits}
                totalPoints={totalPoints}
                user={user}
                onShowProfile={() => setShowProfile(true)}
              />
              {/* Запас хода снизу для BottomNav */}
              <div style={{ height: '120px' }} />
            </motion.div>
          )}

        </div>
      </div>

      {/* Bottom Navigation — position: fixed */}
      <BottomNav
        activeTab={activeTab}
        onChange={setActiveTab}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      {/* Add Habit Modal */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddHabit}
      />
    </>
  );
}
