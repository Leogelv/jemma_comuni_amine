'use client';

import React from 'react';
import { Home, Plus, BarChart3 } from 'lucide-react';
import styles from './BottomNav.module.css';

/**
 * BottomNav — нижняя навигация с тремя элементами
 *
 * Структура:
 * - home: Трекер (главная страница с привычками)
 * - add: Добавить новую привычку (центральная кнопка)
 * - analytics: Аналитика (объединённый раздел статистики)
 */

export type TabType = 'home' | 'analytics';

interface BottomNavProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
  onAddClick: () => void;
}

export function BottomNav({ activeTab, onChange, onAddClick }: BottomNavProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {/* Трекер */}
        <button
          onClick={() => onChange('home')}
          className={`${styles.button} ${activeTab === 'home' ? styles.active : ''}`}
        >
          <div className={`${styles.iconWrapper} ${activeTab === 'home' ? styles.active : ''}`}>
            <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 1.5} />
          </div>
          <span className={`${styles.label} ${activeTab === 'home' ? styles.active : ''}`}>
            Трекер
          </span>
        </button>

        {/* Центральная кнопка — Добавить */}
        <button
          onClick={onAddClick}
          className={styles.addButton}
          aria-label="Добавить привычку"
        >
          <div className={styles.addButtonInner}>
            <Plus size={26} strokeWidth={2.5} />
          </div>
        </button>

        {/* Аналитика */}
        <button
          onClick={() => onChange('analytics')}
          className={`${styles.button} ${activeTab === 'analytics' ? styles.active : ''}`}
        >
          <div className={`${styles.iconWrapper} ${activeTab === 'analytics' ? styles.active : ''}`}>
            <BarChart3 size={22} strokeWidth={activeTab === 'analytics' ? 2.5 : 1.5} />
          </div>
          <span className={`${styles.label} ${activeTab === 'analytics' ? styles.active : ''}`}>
            Аналитика
          </span>
        </button>
      </div>
    </nav>
  );
}
