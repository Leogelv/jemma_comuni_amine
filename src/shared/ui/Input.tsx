'use client';

import React, { forwardRef } from 'react';
import styles from './Input.module.css';

// Input дизайн-системы с glassmorphism стилем

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    const inputClass = error
      ? `${styles.input} ${styles['input-error']}`
      : styles.input;

    return (
      <div className={styles.wrapper}>
        {label && (
          <label className={styles.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${inputClass} ${className || ''}`}
          {...props}
        />
        {error && (
          <p className={styles['error-message']}>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
