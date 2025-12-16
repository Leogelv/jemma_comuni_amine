'use client';

import React from 'react';
import styles from './Badge.module.css';

// Badge для статусов, категорий, streak с glassmorphism стилем

type BadgeVariant = 'success' | 'warning' | 'muted' | 'primary' | 'sport' | 'nutrition' | 'regime' | 'other';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({ children, variant = 'muted', icon, className }: BadgeProps) {
  const variantClass = styles[`variant-${variant}`];

  return (
    <span
      className={`${styles.badge} ${variantClass} ${className || ''}`}
    >
      {icon}
      {children}
    </span>
  );
}
