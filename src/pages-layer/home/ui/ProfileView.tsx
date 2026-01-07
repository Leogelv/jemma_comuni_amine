'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Bell, BellOff, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTelegramUser, useUpdateProfile, type TgUser, type Gender } from '@/entities/user';
import { Habit, useUpdateHabitReminder } from '@/entities/habit';
import { CATEGORIES, type CategoryType } from '@/shared/config';
import styles from './ProfileView.module.css';

interface ProfileViewProps {
  onBack: () => void;
  habits: Habit[];
}

// Компонент переключателя
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

// Компонент выбора времени
function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={styles.timePicker}
    />
  );
}

export function ProfileView({ onBack, habits }: ProfileViewProps) {
  const { user } = useTelegramUser();
  const updateProfile = useUpdateProfile();
  const updateHabitReminder = useUpdateHabitReminder();

  // Локальное состояние формы
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [defaultReminderTime, setDefaultReminderTime] = useState('20:00');

  // Инициализация из данных пользователя
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setAge(user.age?.toString() || '');
      setGender(user.gender || '');
      setNotificationsEnabled(user.notifications_enabled || false);
      setDefaultReminderTime(user.default_reminder_time || '20:00');

      // Определяем таймзону автоматически при первом входе
      if (!user.timezone || user.timezone === 'Europe/Moscow') {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detectedTimezone && detectedTimezone !== user.timezone) {
          updateProfile.mutate({
            telegram_id: user.telegram_id,
            timezone: detectedTimezone,
          });
        }
      }
    }
  }, [user]);

  const handleSaveProfile = () => {
    if (!user) return;

    updateProfile.mutate({
      telegram_id: user.telegram_id,
      first_name: firstName || undefined,
      age: age ? parseInt(age, 10) : undefined,
      gender: gender || undefined,
      notifications_enabled: notificationsEnabled,
      default_reminder_time: defaultReminderTime,
    });
  };

  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (user) {
      updateProfile.mutate({
        telegram_id: user.telegram_id,
        notifications_enabled: enabled,
      });
    }
  };

  const handleDefaultTimeChange = (time: string) => {
    setDefaultReminderTime(time);
    if (user) {
      updateProfile.mutate({
        telegram_id: user.telegram_id,
        default_reminder_time: time,
      });
    }
  };

  const handleHabitReminderToggle = (habit: Habit, enabled: boolean) => {
    if (!user) return;
    updateHabitReminder.mutate({
      habit_id: habit.id,
      telegram_id: user.telegram_id,
      reminder_enabled: enabled,
      reminder_time: habit.reminder_time,
    });
  };

  const handleHabitReminderTime = (habit: Habit, time: string) => {
    if (!user) return;
    updateHabitReminder.mutate({
      habit_id: habit.id,
      telegram_id: user.telegram_id,
      reminder_enabled: habit.reminder_enabled,
      reminder_time: time || null,
    });
  };

  const photoUrl = user?.photo_url;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={styles.container}
    >
      {/* Header с кнопкой назад */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.title}>Профиль</h1>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scrollContent}>
        {/* Аватар */}
        <div className={styles.avatarSection}>
          {photoUrl ? (
            <img src={photoUrl} alt="Avatar" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <User size={40} />
            </div>
          )}
        </div>

        {/* Персональные данные */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Персональные данные</h2>

          <div className={styles.card}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Имя</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={handleSaveProfile}
                placeholder="Введите имя"
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Возраст</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                onBlur={handleSaveProfile}
                placeholder="Возраст"
                min="1"
                max="120"
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Пол</label>
              <div className={styles.genderButtons}>
                {[
                  { value: 'male' as Gender, label: 'Мужской' },
                  { value: 'female' as Gender, label: 'Женский' },
                  { value: 'other' as Gender, label: 'Другой' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setGender(option.value);
                      if (user) {
                        updateProfile.mutate({
                          telegram_id: user.telegram_id,
                          gender: option.value,
                        });
                      }
                    }}
                    className={`${styles.genderButton} ${gender === option.value ? styles.genderButtonActive : ''}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Настройки уведомлений */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Уведомления</h2>

          <div className={styles.card}>
            {/* Глобальный переключатель */}
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                {notificationsEnabled ? (
                  <Bell size={20} className={styles.settingIcon} />
                ) : (
                  <BellOff size={20} className={styles.settingIconMuted} />
                )}
                <div>
                  <span className={styles.settingLabel}>Напоминания</span>
                  <span className={styles.settingDescription}>
                    {notificationsEnabled ? 'Включены' : 'Выключены'}
                  </span>
                </div>
              </div>
              <Toggle
                checked={notificationsEnabled}
                onChange={handleToggleNotifications}
              />
            </div>

            {/* Время по умолчанию */}
            {notificationsEnabled && (
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <Clock size={20} className={styles.settingIcon} />
                  <div>
                    <span className={styles.settingLabel}>Время по умолчанию</span>
                    <span className={styles.settingDescription}>
                      Для всех привычек без индивидуального времени
                    </span>
                  </div>
                </div>
                <TimePicker
                  value={defaultReminderTime}
                  onChange={handleDefaultTimeChange}
                />
              </div>
            )}
          </div>
        </div>

        {/* Настройки по привычкам */}
        {notificationsEnabled && habits.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Напоминания по привычкам</h2>

            <div className={styles.card}>
              {habits.map((habit) => {
                const category = CATEGORIES[habit.category as CategoryType] || CATEGORIES.other;
                return (
                  <div key={habit.id} className={styles.habitReminderRow}>
                    <div className={styles.habitInfo}>
                      <span className={styles.habitEmoji}>{category.emoji}</span>
                      <span className={styles.habitTitle}>{habit.title}</span>
                    </div>

                    <div className={styles.habitReminderControls}>
                      {habit.reminder_enabled && (
                        <TimePicker
                          value={habit.reminder_time || defaultReminderTime}
                          onChange={(time) => handleHabitReminderTime(habit, time)}
                        />
                      )}
                      <Toggle
                        checked={habit.reminder_enabled}
                        onChange={(enabled) => handleHabitReminderToggle(habit, enabled)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Информация о приложении */}
        <div className={styles.appInfo}>
          <p>Anti Self-Deception v0.2.0</p>
          <p>Таймзона: {user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        </div>
      </div>
    </motion.div>
  );
}
