'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_LIST, type CategoryType } from '@/shared/config';
import { cn } from '@/shared/lib';

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 safe-area-bottom"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Новая привычка</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Название привычки..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                autoFocus
              />

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3">Категория</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_LIST.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-medium transition-all',
                        category === cat.id
                          ? cn(cat.activeColor, 'text-white shadow-md')
                          : cn(cat.bgLight, cat.textColor)
                      )}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!title.trim()}
                className={cn(
                  'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
                  title.trim()
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                <Plus size={20} />
                Добавить привычку
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
