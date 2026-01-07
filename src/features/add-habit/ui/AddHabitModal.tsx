'use client';

import React, { useState, useMemo } from 'react';
import { X, Plus, ChevronLeft, Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_LIST, type CategoryType } from '@/shared/config';
import { useHabitPresets, type HabitPreset } from '@/entities/habit';
import { DynamicIcon, HABIT_ICONS, HABIT_COLORS } from '@/shared/ui';
import { cn } from '@/shared/lib';
import styles from './AddHabitModal.module.css';

/**
 * AddHabitModal — многошаговое модальное окно для создания привычек
 *
 * Шаги:
 * 1. presets — выбор из готовых привычек
 * 2. custom — создание своей привычки с выбором иконки/цвета
 * 3. icon — выбор иконки
 * 4. color — выбор цвета
 */

type Step = 'presets' | 'custom' | 'icon' | 'color';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, category: CategoryType, icon: string, color: string) => void;
}

export function AddHabitModal({ isOpen, onClose, onAdd }: AddHabitModalProps) {
  const [step, setStep] = useState<Step>('presets');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('other');
  const [icon, setIcon] = useState('circle');
  const [color, setColor] = useState('#6366F1');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: presets = [] } = useHabitPresets();

  // Фильтрация пресетов по поиску
  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) return presets;
    const query = searchQuery.toLowerCase();
    return presets.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }, [presets, searchQuery]);

  // Группировка по категориям
  const groupedPresets = useMemo(() => {
    const groups: Record<string, HabitPreset[]> = {};
    filteredPresets.forEach((preset) => {
      const cat = preset.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(preset);
    });
    return groups;
  }, [filteredPresets]);

  // Популярные пресеты
  const popularPresets = useMemo(
    () => presets.filter((p) => p.is_popular).slice(0, 6),
    [presets]
  );

  const resetForm = () => {
    setStep('presets');
    setTitle('');
    setCategory('other');
    setIcon('circle');
    setColor('#6366F1');
    setSearchQuery('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectPreset = (preset: HabitPreset) => {
    onAdd(preset.title, preset.category as CategoryType, preset.icon, preset.color);
    handleClose();
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), category, icon, color);
      handleClose();
    }
  };

  const handleBack = () => {
    if (step === 'custom') setStep('presets');
    else if (step === 'icon' || step === 'color') setStep('custom');
  };

  const getCategoryInfo = (catId: string) =>
    CATEGORY_LIST.find((c) => c.id === catId) || CATEGORY_LIST[3];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
              {step !== 'presets' && (
                <button onClick={handleBack} className={styles.backButton}>
                  <ChevronLeft size={20} />
                </button>
              )}
              <h2>
                {step === 'presets' && 'Новая привычка'}
                {step === 'custom' && 'Своя привычка'}
                {step === 'icon' && 'Выберите иконку'}
                {step === 'color' && 'Выберите цвет'}
              </h2>
              <button onClick={handleClose} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            {/* Content by step */}
            <div className={styles.content}>
              {/* STEP: Presets */}
              {step === 'presets' && (
                <div className={styles.presetsStep}>
                  {/* Search */}
                  <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Поиск привычки..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>

                  {/* Custom button */}
                  <button
                    onClick={() => setStep('custom')}
                    className={styles.customButton}
                  >
                    <Plus size={20} />
                    <span>Создать свою привычку</span>
                  </button>

                  {/* Popular section */}
                  {!searchQuery && popularPresets.length > 0 && (
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <Sparkles size={16} />
                        <span>Популярные</span>
                      </div>
                      <div className={styles.presetsList}>
                        {popularPresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => handleSelectPreset(preset)}
                            className={styles.presetItem}
                          >
                            <div
                              className={styles.presetIcon}
                              style={{ backgroundColor: `${preset.color}20`, color: preset.color }}
                            >
                              <DynamicIcon name={preset.icon} size={20} />
                            </div>
                            <div className={styles.presetInfo}>
                              <span className={styles.presetTitle}>{preset.title}</span>
                              {preset.description && (
                                <span className={styles.presetDesc}>{preset.description}</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {Object.entries(groupedPresets).map(([catId, items]) => {
                    const catInfo = getCategoryInfo(catId);
                    return (
                      <div key={catId} className={styles.section}>
                        <div className={styles.sectionHeader}>
                          <span>{catInfo.emoji}</span>
                          <span>{catInfo.label}</span>
                        </div>
                        <div className={styles.presetsList}>
                          {items.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => handleSelectPreset(preset)}
                              className={styles.presetItem}
                            >
                              <div
                                className={styles.presetIcon}
                                style={{ backgroundColor: `${preset.color}20`, color: preset.color }}
                              >
                                <DynamicIcon name={preset.icon} size={20} />
                              </div>
                              <div className={styles.presetInfo}>
                                <span className={styles.presetTitle}>{preset.title}</span>
                                {preset.description && (
                                  <span className={styles.presetDesc}>{preset.description}</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {filteredPresets.length === 0 && (
                    <div className={styles.emptyPresets}>
                      <p>Ничего не найдено</p>
                      <button onClick={() => setStep('custom')} className={styles.emptyButton}>
                        Создать свою
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: Custom */}
              {step === 'custom' && (
                <form onSubmit={handleSubmitCustom} className={styles.customStep}>
                  {/* Title Input */}
                  <input
                    type="text"
                    placeholder="Название привычки..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.input}
                    autoFocus
                  />

                  {/* Icon & Color selectors */}
                  <div className={styles.selectorsRow}>
                    <button
                      type="button"
                      onClick={() => setStep('icon')}
                      className={styles.selectorButton}
                    >
                      <div
                        className={styles.selectorPreview}
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        <DynamicIcon name={icon} size={24} />
                      </div>
                      <span>Иконка</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('color')}
                      className={styles.selectorButton}
                    >
                      <div
                        className={styles.colorPreview}
                        style={{ backgroundColor: color }}
                      />
                      <span>Цвет</span>
                    </button>
                  </div>

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
              )}

              {/* STEP: Icon picker */}
              {step === 'icon' && (
                <div className={styles.pickerStep}>
                  <div className={styles.iconsGrid}>
                    {HABIT_ICONS.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          setIcon(item.name);
                          setStep('custom');
                        }}
                        className={cn(
                          styles.iconOption,
                          icon === item.name && styles.iconSelected
                        )}
                        style={icon === item.name ? { borderColor: color, color } : undefined}
                        title={item.label}
                      >
                        <DynamicIcon name={item.name} size={24} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP: Color picker */}
              {step === 'color' && (
                <div className={styles.pickerStep}>
                  <div className={styles.colorsGrid}>
                    {HABIT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setColor(c);
                          setStep('custom');
                        }}
                        className={cn(
                          styles.colorOption,
                          color === c && styles.colorSelected
                        )}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && (
                          <span className={styles.colorCheck}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
