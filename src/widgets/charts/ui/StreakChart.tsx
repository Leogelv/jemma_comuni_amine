'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Habit } from '@/entities/habit';
import { getCategory } from '@/shared/config';
import styles from './StreakChart.module.css';

// StreakChart — Bar Chart для отображения streak каждой привычки

interface StreakChartProps {
  habits: Habit[];
  className?: string;
}

export function StreakChart({ habits, className }: StreakChartProps) {
  const chartData = habits.map(habit => {
    const category = getCategory(habit.category);
    return {
      name: habit.title.length > 12 ? habit.title.slice(0, 12) + '...' : habit.title,
      fullName: habit.title,
      streak: habit.streak,
      color: category.color, // Hex-значение для recharts
    };
  });

  const maxStreak = Math.max(...chartData.map(d => d.streak), 5);

  if (habits.length === 0) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <h3 className={styles.title}>Стрики</h3>
        <div className={styles.empty}>
          Добавьте привычки для отслеживания стриков
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <h3 className={styles.title}>Стрики</h3>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              domain={[0, maxStreak]}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              width={80}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className={styles.tooltip}>
                      <div className={styles.tooltipTitle}>{data.fullName}</div>
                      <div className={styles.tooltipValue}>{data.streak} дней подряд</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="streak" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
