'use client';

import React from 'react';
import { Home, Calendar, Settings, Trophy } from 'lucide-react';
import { cn } from '@/shared/lib';

export type TabType = 'home' | 'stats' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

const tabs: { id: TabType; icon: React.ElementType; label: string }[] = [
  { id: 'home', icon: Home, label: 'Главная' },
  { id: 'stats', icon: Trophy, label: 'Прогресс' },
  { id: 'history', icon: Calendar, label: 'История' },
  { id: 'settings', icon: Settings, label: 'Настройки' },
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                'text-xs font-medium',
                isActive && 'font-semibold'
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
