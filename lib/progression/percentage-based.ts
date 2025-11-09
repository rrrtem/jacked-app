/**
 * Percentage-Based Progression
 * Процентная прогрессия для упражнений без веса (bodyweight)
 */

import type { ExerciseRecord } from '@/lib/types/database'
import type { SetSuggestion, PercentageBasedProgressionConfig } from '@/lib/types/progression'

/**
 * Конфигурация по умолчанию для Percentage-Based Progression
 */
export const DEFAULT_PERCENTAGE_BASED_CONFIG: PercentageBasedProgressionConfig = {
  type: 'percentage-based',
  percentages: [30, 60, 100], // 30% -> 60% -> 100% от максимального количества повторений
}

/**
 * Рассчитать suggestion для подхода с использованием процентной прогрессии
 * 
 * @param setNumber - Номер текущего подхода (1, 2, 3, ...)
 * @param record - Личный рекорд пользователя по упражнению
 * @param config - Конфигурация прогрессии
 * @returns Suggestion для подхода
 */
export function calculatePercentageBasedSuggestion(
  setNumber: number,
  record: ExerciseRecord | null | undefined,
  config: PercentageBasedProgressionConfig = DEFAULT_PERCENTAGE_BASED_CONFIG
): SetSuggestion {
  // Если нет рекорда, предлагаем консервативные значения
  if (!record || !record.max_reps) {
    const fallbackReps = [5, 10, 15] // Консервативные значения
    
    return {
      reps: fallbackReps[setNumber - 1] || 10,
      note: 'No record - conservative reps',
    }
  }

  const maxReps = record.max_reps

  // Индекс в массиве percentages
  const percentageIndex = setNumber - 1

  // Если вышли за рамки массива percentages, используем последний процент (обычно 100%)
  const percentage = config.percentages[percentageIndex] ?? config.percentages[config.percentages.length - 1]

  const suggestedReps = Math.round((maxReps * percentage) / 100)

  let note = ''
  if (percentage < 50) {
    note = `Warm-up (${percentage}% of max reps)`
  } else if (percentage === 100) {
    note = 'Max effort (100% of max reps)'
  } else {
    note = `Working set (${percentage}% of max reps)`
  }

  return {
    reps: suggestedReps,
    note,
  }
}

/**
 * Рассчитать все suggestions для упражнения (для заданного количества подходов)
 * 
 * @param totalSets - Общее количество подходов
 * @param record - Личный рекорд пользователя
 * @param config - Конфигурация прогрессии
 * @returns Массив suggestions для всех подходов
 */
export function calculateAllPercentageBasedSuggestions(
  totalSets: number,
  record: ExerciseRecord | null | undefined,
  config: PercentageBasedProgressionConfig = DEFAULT_PERCENTAGE_BASED_CONFIG
): SetSuggestion[] {
  const suggestions: SetSuggestion[] = []

  for (let setNumber = 1; setNumber <= totalSets; setNumber++) {
    suggestions.push(calculatePercentageBasedSuggestion(setNumber, record, config))
  }

  return suggestions
}

