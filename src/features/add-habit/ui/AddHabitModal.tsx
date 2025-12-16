'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_LIST, type CategoryType } from '@/shared/config';
import { cn } from '@/shared/lib';
import styles from './AddHabitModal.module.css';

// AddHabitModal — модальное окно для создания новых привычек

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, category: CategoryType) => void;
}

export function AddHabitModal({ isOpen, onClose, onAdd }: AddHabitModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('other');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), category);
      setTitle('');
      setCategory('other');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={styles.overlay}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={styles.modal}
          >
            {/* Handle bar */}
            <div className={styles.handleBar} />

            {/* Header */}
            <div className={styles.header}>
              <h2>Новая привычка</h2>
              <button
                onClick={onClose}
                className={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Input */}
              <input
                type="text"
                placeholder="Название привычки..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.input}
                autoFocus
              />

              {/* Categories */}
              <div className={styles.categoriesGrid}>
                {CATEGORY_LIST.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        styles.categoryButton,
                        isSelected && styles.selected,
                        isSelected && styles[cat.id as CategoryType]
                      )}
                    >
                      <span className={styles.emoji}>{cat.emoji}</span>
                      <span className={styles.label}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!title.trim()}
                className={styles.submitButton}
              >
                <Plus size={20} strokeWidth={2.5} />
                Добавить привычку
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
