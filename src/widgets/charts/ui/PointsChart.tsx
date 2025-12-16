'use client';

import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  eachDayOfInterval,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { Habit } from '@/entities/habit';
import { getCategory } from '@/shared/config';
import styles from './PointsChart.module.css';

// PointsChart — Area Chart для отображения прогресса очков

type Period = 'week' | 'month' | 'year';

interface PointsChartProps {
  habits: Habit[];
  className?: string;
}

export function PointsChart({ habits, className }: PointsChartProps) {
  const [period, setPeriod] = useState<Period>('week');

  const chartData = useMemo(() => {
    const today = new Date();

    if (period === 'week') {
      // Последние 7 дней
      const days = eachDayOfInterval({
        start: subDays(today, 6),
        end: today
      });

      return days.map(day => {
        let points = 0;
        habits.forEach(habit => {
          const category = getCategory(habit.category);
          const completedOnDay = habit.completed_dates.some(d =>
            isSameDay(parseISO(d), day)
          );
          if (completedOnDay) {
            points += category.points;
          }
        });

        return {
          date: format(day, 'EEE', { locale: ru }),
          fullDate: format(day, 'd MMM', { locale: ru }),
          points
        };
      });
    }

    if (period === 'month') {
      // Последние 4 недели
      const weeks = eachWeekOfInterval(
        { start: subWeeks(today, 3), end: today },
        { weekStartsOn: 1 }
      );

      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        let points = 0;

        habits.forEach(habit => {
          const category = getCategory(habit.category);
          habit.completed_dates.forEach(dateStr => {
            const date = parseISO(dateStr);
            if (date >= weekStart && date <= weekEnd) {
              points += category.points;
            }
          });
        });

        return {
          date: format(weekStart, 'd MMM', { locale: ru }),
          fullDate: `${format(weekStart, 'd', { locale: ru })} - ${format(weekEnd, 'd MMM', { locale: ru })}`,
          points
        };
      });
    }

    // Year — последние 12 месяцев (упрощённо по неделям)
    const months = Array.from({ length: 12 }).map((_, i) => {
      const monthDate = subMonths(today, 11 - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      let points = 0;
      habits.forEach(habit => {
        const category = getCategory(habit.category);
        habit.completed_dates.forEach(dateStr => {
          const date = parseISO(dateStr);
          if (date >= monthStart && date <= monthEnd) {
            points += category.points;
          }
        });
      });

      return {
        date: format(monthDate, 'LLL', { locale: ru }),
        fullDate: format(monthDate, 'LLLL yyyy', { locale: ru }),
        points
      };
    });

    return months;
  }, [habits, period]);

  const maxPoints = Math.max(...chartData.map(d => d.points), 10);

  const periods: { id: Period; label: string }[] = [
    { id: 'week', label: 'Неделя' },
    { id: 'month', label: 'Месяц' },
    { id: 'year', label: 'Год' },
  ];

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Очки</h3>
        <div className={styles.periodSwitcher}>
          {periods.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPeriod(id)}
              className={`${styles.periodButton} ${period === id ? styles.active : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              domain={[0, maxPoints]}
              tickCount={5}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className={styles.tooltip}>
                      <div className={styles.tooltipTitle}>{data.fullDate}</div>
                      <div className={styles.tooltipValue}>{data.points} очков</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="points"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#pointsGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#10B981',
                stroke: '#fff',
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
