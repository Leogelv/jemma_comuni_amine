'use client';

import React from 'react';
import styles from './Card.module.css';

// Базовая карточка дизайн-системы с glassmorphism стилем

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}: CardProps) {
  const variantClass = variant === 'default' ? styles['variant-default'] : styles['variant-flat'];
  const paddingClass = styles[`padding-${padding}`];

  return (
    <div
      className={`${styles.card} ${variantClass} ${paddingClass} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}
