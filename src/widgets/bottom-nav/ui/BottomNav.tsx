'use client';

import React from 'react';
import { Home, BarChart3, Calendar, Settings } from 'lucide-react';
import styles from './BottomNav.module.css';

// BottomNav — фиксированная навигация с glassmorphism

export type TabType = 'home' | 'stats' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

const tabs: { id: TabType; icon: React.ElementType; label: string }[] = [
  { id: 'home', icon: Home, label: 'Главная' },
  { id: 'stats', icon: BarChart3, label: 'Прогресс' },
  { id: 'history', icon: Calendar, label: 'История' },
  { id: 'settings', icon: Settings, label: 'Настройки' },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`${styles.button} ${isActive ? styles.active : ''}`}
            >
              <div className={`${styles.iconWrapper} ${isActive ? styles.active : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={`${styles.label} ${isActive ? styles.active : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
