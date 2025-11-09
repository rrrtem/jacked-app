/**
 * Linear Load Progression
 * Линейное увеличение веса от пустого грифа до рабочего веса
 */

import type { ExerciseRecord } from '@/lib/types/database'
import type { SetSuggestion, LinearLoadProgressionConfig } from '@/lib/types/progression'

/**
 * Конфигурация по умолчанию для Linear Load Progression
 */
export const DEFAULT_LINEAR_LOAD_CONFIG: LinearLoadProgressionConfig = {
  type: 'linear-load',
  emptyBarWeight: 20, // Пустой гриф = 20 кг
  warmupReps: 10, // 10 повторений на разминке
  percentages: [40, 60, 80, 100], // Проценты от максимального рабочего веса
}

/**
 * Рассчитать suggestion для подхода с использованием Linear Load Progression
 * 
 * @param setNumber - Номер текущего подхода (1, 2, 3, ...)
 * @param record - Личный рекорд пользователя по упражнению
 * @param config - Конфигурация прогрессии
 * @returns Suggestion для подхода
 */
export function calculateLinearLoadSuggestion(
  setNumber: number,
  record: ExerciseRecord | null | undefined,
  config: LinearLoadProgressionConfig = DEFAULT_LINEAR_LOAD_CONFIG
): SetSuggestion {
  // Первый подход всегда с пустым грифом
  if (setNumber === 1) {
    return {
      weight: config.emptyBarWeight,
      reps: config.warmupReps,
      note: 'Warm-up (empty bar)',
    }
  }

  // Если нет рекорда, предлагаем консервативные значения
  if (!record || !record.max_weight) {
    const fallbackWeights = [
      config.emptyBarWeight, // Подход 1
      config.emptyBarWeight + 10, // Подход 2
      config.emptyBarWeight + 20, // Подход 3
      config.emptyBarWeight + 30, // Подход 4
      config.emptyBarWeight + 40, // Подход 5
    ]
    
    return {
      weight: fallbackWeights[setNumber - 1] || config.emptyBarWeight,
      reps: config.warmupReps,
      note: 'No record - conservative weight',
    }
  }

  const maxWeight = record.max_weight
  const maxReps = record.max_reps || config.warmupReps

  // Индекс в массиве percentages (setNumber - 2, так как первый подход - это пустой гриф)
  const percentageIndex = setNumber - 2

  // Если вышли за рамки массива percentages, используем последний процент (обычно 100%)
  const percentage = config.percentages[percentageIndex] ?? config.percentages[config.percentages.length - 1]

  // Рассчитываем вес, но не меньше веса пустого грифа
  const calculatedWeight = Math.round((maxWeight * percentage) / 100)
  const suggestedWeight = Math.max(calculatedWeight, config.emptyBarWeight)
  
  // Для рабочих весов используем количество повторов из рекорда
  // Для разминочных весов - больше повторов
  const suggestedReps = percentage < 80 ? config.warmupReps : maxReps

  let note = ''
  if (percentage < 80) {
    note = `Warm-up (${percentage}% of max)`
  } else if (percentage === 100) {
    note = 'Working set (100% of max)'
  } else {
    note = `Working set (${percentage}% of max)`
  }

  return {
    weight: suggestedWeight,
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
export function calculateAllLinearLoadSuggestions(
  totalSets: number,
  record: ExerciseRecord | null | undefined,
  config: LinearLoadProgressionConfig = DEFAULT_LINEAR_LOAD_CONFIG
): SetSuggestion[] {
  const suggestions: SetSuggestion[] = []

  for (let setNumber = 1; setNumber <= totalSets; setNumber++) {
    suggestions.push(calculateLinearLoadSuggestion(setNumber, record, config))
  }

  return suggestions
}

