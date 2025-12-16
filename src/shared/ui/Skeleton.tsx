'use client';

import React from 'react';
import styles from './Skeleton.module.css';

// Skeleton для загрузки с glassmorphism стилем

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const variantClass = styles[`variant-${variant}`];

  return (
    <div
      className={`${styles.skeleton} ${variantClass} ${className || ''}`}
      style={{
        width: width,
        height: height,
      }}
    />
  );
}

// Готовые варианты для частых кейсов
export function SkeletonCard() {
  return (
    <div className={styles['card-skeleton']}>
      <div className={styles['card-header']}>
        <div className={styles['card-header-left']}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width={120} height={20} />
        </div>
        <Skeleton variant="rectangular" width={60} height={24} />
      </div>
      <div className={styles['card-days']}>
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} variant="circular" width={40} height={40} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className={styles['stats-skeleton']}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={styles['stat-card']}>
          <Skeleton variant="circular" width={32} height={32} className={styles['stat-icon']} />
          <Skeleton variant="text" width="60%" height={28} className={styles['stat-value']} />
          <Skeleton variant="text" width="40%" height={14} />
        </div>
      ))}
    </div>
  );
}
