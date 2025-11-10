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
 * Автоматически выбирает подходящую логику прогрессии на основе типа упражнения
 * 
 * @param params - Параметры для расчета
 * @returns Suggestion для подхода
 */
export function calculateSetSuggestion(params: CalculateSuggestionsParams): SetSuggestion {
  const { exerciseType, setNumber, record } = params

  // Определяем тип упражнения
  // Упражнение на длительность (planks, holds и т.д.)
  if (exerciseType === 'duration') {
    return calculateDurationBasedSuggestion(setNumber, record)
  }

  // Упражнение с весом (barbell, dumbbell и т.д.)
  if (exerciseType === 'weight') {
    return calculateLinearLoadSuggestion(setNumber, record, DEFAULT_LINEAR_LOAD_CONFIG)
  }

  // Упражнение без веса (bodyweight) - по умолчанию
  return calculatePercentageBasedSuggestion(setNumber, record, DEFAULT_PERCENTAGE_BASED_CONFIG)
}

/**
 * Вспомогательная функция для получения suggestion по exerciseId
 * (используется в воркауте)
 */
export async function getSuggestionForExercise(
  exerciseId: string,
  exerciseType: string,
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
    exerciseType,
    setNumber,
    record,
  })
}

// Экспортируем все функции прогрессии
export * from './linear-load'
export * from './percentage-based'
export * from './duration-based'
export type * from '@/lib/types/progression'

