/**
 * Готовые конфигурации логик прогрессии
 * Можно использовать или создавать свои
 */

import type { LinearLoadProgressionConfig, PercentageBasedProgressionConfig } from '@/lib/types/progression'

/**
 * Стандартная линейная прогрессия
 * Для большинства базовых упражнений со штангой
 */
export const STANDARD_LINEAR: LinearLoadProgressionConfig = {
  type: 'linear-load',
  emptyBarWeight: 20,
  warmupReps: 10,
  percentages: [40, 60, 80, 100],
}

/**
 * Агрессивная линейная прогрессия
 * Меньше разминочных подходов, быстрее к рабочему весу
 */
export const AGGRESSIVE_LINEAR: LinearLoadProgressionConfig = {
  type: 'linear-load',
  emptyBarWeight: 20,
  warmupReps: 8,
  percentages: [50, 75, 90, 100],
}

/**
 * Консервативная линейная прогрессия
 * Больше разминочных подходов для безопасности
 */
export const CONSERVATIVE_LINEAR: LinearLoadProgressionConfig = {
  type: 'linear-load',
  emptyBarWeight: 20,
  warmupReps: 12,
  percentages: [30, 50, 70, 85, 95, 100],
}

/**
 * Для упражнений с легким весом (гантели, изоляция)
 */
export const LIGHT_WEIGHT_LINEAR: LinearLoadProgressionConfig = {
  type: 'linear-load',
  emptyBarWeight: 5, // Легкие гантели
  warmupReps: 15,
  percentages: [40, 70, 100],
}

/**
 * Стандартная процентная прогрессия
 * Для большинства упражнений с собственным весом
 */
export const STANDARD_PERCENTAGE: PercentageBasedProgressionConfig = {
  type: 'percentage-based',
  percentages: [30, 60, 100],
}

/**
 * Высокообъемная процентная прогрессия
 * Больше подходов с разными процентами
 */
export const HIGH_VOLUME_PERCENTAGE: PercentageBasedProgressionConfig = {
  type: 'percentage-based',
  percentages: [20, 40, 60, 80, 100],
}

/**
 * Для начинающих (более плавное увеличение нагрузки)
 */
export const BEGINNER_PERCENTAGE: PercentageBasedProgressionConfig = {
  type: 'percentage-based',
  percentages: [25, 50, 75, 90, 100],
}

/**
 * Для продвинутых (быстрее к максимуму)
 */
export const ADVANCED_PERCENTAGE: PercentageBasedProgressionConfig = {
  type: 'percentage-based',
  percentages: [40, 80, 100],
}

/**
 * Получить конфигурацию по названию
 */
export function getProgressionConfig(
  configName: string
): LinearLoadProgressionConfig | PercentageBasedProgressionConfig {
  const configs: Record<string, LinearLoadProgressionConfig | PercentageBasedProgressionConfig> = {
    'standard-linear': STANDARD_LINEAR,
    'aggressive-linear': AGGRESSIVE_LINEAR,
    'conservative-linear': CONSERVATIVE_LINEAR,
    'light-weight-linear': LIGHT_WEIGHT_LINEAR,
    'standard-percentage': STANDARD_PERCENTAGE,
    'high-volume-percentage': HIGH_VOLUME_PERCENTAGE,
    'beginner-percentage': BEGINNER_PERCENTAGE,
    'advanced-percentage': ADVANCED_PERCENTAGE,
  }

  return configs[configName] || STANDARD_LINEAR
}

/**
 * Список доступных конфигураций для UI
 */
export const PROGRESSION_CONFIG_LIST = [
  { id: 'standard-linear', name: 'Standard Linear', description: 'Стандартная прогрессия для штанги' },
  { id: 'aggressive-linear', name: 'Aggressive Linear', description: 'Быстрее к рабочему весу' },
  { id: 'conservative-linear', name: 'Conservative Linear', description: 'Больше разминочных подходов' },
  { id: 'light-weight-linear', name: 'Light Weight Linear', description: 'Для легких весов и гантелей' },
  { id: 'standard-percentage', name: 'Standard Percentage', description: 'Стандартная прогрессия для bodyweight' },
  { id: 'high-volume-percentage', name: 'High Volume', description: 'Больше подходов' },
  { id: 'beginner-percentage', name: 'Beginner Friendly', description: 'Плавное увеличение нагрузки' },
  { id: 'advanced-percentage', name: 'Advanced', description: 'Для опытных спортсменов' },
] as const

