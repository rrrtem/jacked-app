/**
 * Progression Logic System
 * Система логики прогрессии для упражнений
 */

import type { ExerciseRecord } from '@/lib/types/database'
import type { SetSuggestion, CalculateSuggestionsParams } from '@/lib/types/progression'
import { calculateLinearLoadSuggestion, DEFAULT_LINEAR_LOAD_CONFIG } from './linear-load'
import { calculatePercentageBasedSuggestion, DEFAULT_PERCENTAGE_BASED_CONFIG } from './percentage-based'
import { calculateDurationBasedSuggestion } from './duration-based'

/**
 * Главная функция для расчета suggestion для текущего подхода
 * Автоматически выбирает подходящую логику прогрессии на основе тегов упражнения
 * 
 * @param params - Параметры для расчета
 * @returns Suggestion для подхода
 */
export function calculateSetSuggestion(params: CalculateSuggestionsParams): SetSuggestion {
  const { exerciseTags, setNumber, record } = params

  // Определяем тип упражнения по тегам
  const hasDurationTag = exerciseTags.includes('duration')
  const hasWeightTag = exerciseTags.includes('weight')

  // Упражнение на длительность (planks, holds и т.д.)
  if (hasDurationTag) {
    return calculateDurationBasedSuggestion(setNumber, record)
  }

  // Упражнение с весом (barbell, dumbbell и т.д.)
  if (hasWeightTag) {
    return calculateLinearLoadSuggestion(setNumber, record, DEFAULT_LINEAR_LOAD_CONFIG)
  }

  // Упражнение без веса (bodyweight)
  return calculatePercentageBasedSuggestion(setNumber, record, DEFAULT_PERCENTAGE_BASED_CONFIG)
}

/**
 * Вспомогательная функция для получения suggestion по exerciseId
 * (используется в воркауте)
 */
export async function getSuggestionForExercise(
  exerciseId: string,
  exerciseTags: string[],
  setNumber: number,
  userId: string
): Promise<SetSuggestion> {
  // Импортируем функцию для получения рекорда
  const { getExerciseRecord } = await import('@/lib/supabase/queries')
  
  // Получаем рекорд пользователя
  let record: ExerciseRecord | null = null
  try {
    record = await getExerciseRecord(userId, exerciseId)
  } catch (error) {
    console.error('Error fetching exercise record:', error)
  }

  // Рассчитываем suggestion
  return calculateSetSuggestion({
    exerciseId,
    exerciseTags,
    setNumber,
    record,
  })
}

// Экспортируем все функции прогрессии
export * from './linear-load'
export * from './percentage-based'
export * from './duration-based'
export type * from '@/lib/types/progression'

