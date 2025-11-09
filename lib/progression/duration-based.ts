/**
 * Duration-Based Progression
 * Прогрессия для упражнений на время/длительность (planks, holds и т.д.)
 */

import type { ExerciseRecord } from '@/lib/types/database'
import type { SetSuggestion } from '@/lib/types/progression'

/**
 * Рассчитать suggestion для подхода с использованием прогрессии по длительности
 * 
 * @param setNumber - Номер текущего подхода (1, 2, 3, ...)
 * @param record - Личный рекорд пользователя по упражнению
 * @returns Suggestion для подхода
 */
export function calculateDurationBasedSuggestion(
  setNumber: number,
  record: ExerciseRecord | null | undefined
): SetSuggestion {
  // Если нет рекорда, предлагаем консервативные значения
  if (!record || !record.max_duration) {
    const fallbackDurations = [15, 30, 45] // Секунды
    
    return {
      duration: fallbackDurations[setNumber - 1] || 30,
      note: 'No record - conservative duration',
    }
  }

  const maxDuration = record.max_duration

  // Для упражнений на длительность используем процентную прогрессию
  const percentages = [50, 75, 100] // 50% -> 75% -> 100% от максимального времени
  const percentageIndex = setNumber - 1
  const percentage = percentages[percentageIndex] ?? 100

  const suggestedDuration = Math.round((maxDuration * percentage) / 100)

  let note = ''
  if (percentage < 75) {
    note = `Warm-up (${percentage}% of max duration)`
  } else if (percentage === 100) {
    note = 'Max effort (100% of max duration)'
  } else {
    note = `Working set (${percentage}% of max duration)`
  }

  return {
    duration: suggestedDuration,
    note,
  }
}

/**
 * Рассчитать все suggestions для упражнения на длительность
 * 
 * @param totalSets - Общее количество подходов
 * @param record - Личный рекорд пользователя
 * @returns Массив suggestions для всех подходов
 */
export function calculateAllDurationBasedSuggestions(
  totalSets: number,
  record: ExerciseRecord | null | undefined
): SetSuggestion[] {
  const suggestions: SetSuggestion[] = []

  for (let setNumber = 1; setNumber <= totalSets; setNumber++) {
    suggestions.push(calculateDurationBasedSuggestion(setNumber, record))
  }

  return suggestions
}

