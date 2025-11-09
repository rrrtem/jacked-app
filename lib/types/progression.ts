/**
 * Типы для системы прогрессии упражнений
 */

import type { ExerciseRecord } from './database'

/**
 * Тип логики прогрессии
 */
export type ProgressionLogicType = 'linear-load' | 'percentage-based'

/**
 * Базовый интерфейс для suggestion подхода
 */
export interface SetSuggestion {
  weight?: number // Вес в кг
  reps?: number // Количество повторений
  duration?: number // Длительность в секундах
  note?: string // Заметка о подходе (например, "Warm-up", "Working set")
}

/**
 * Конфигурация для Linear Load Progression
 * Линейное увеличение веса от пустого грифа до рабочего веса
 */
export interface LinearLoadProgressionConfig {
  type: 'linear-load'
  emptyBarWeight: number // Вес пустого грифа (по умолчанию 20 кг)
  warmupReps: number // Количество повторов для разминки (по умолчанию 8-10)
  percentages: number[] // Проценты от максимального веса [40, 60, 80, 100]
}

/**
 * Конфигурация для процентной прогрессии (для упражнений без веса)
 */
export interface PercentageBasedProgressionConfig {
  type: 'percentage-based'
  percentages: number[] // Проценты от максимального количества повторений [30, 60, 100]
}

/**
 * Объединенный тип конфигурации прогрессии
 */
export type ProgressionConfig = LinearLoadProgressionConfig | PercentageBasedProgressionConfig

/**
 * Результат расчета suggestions для упражнения
 */
export interface ExerciseSuggestions {
  exerciseId: string
  setNumber: number
  suggestions: SetSuggestion[]
  hasRecord: boolean
  record?: ExerciseRecord
}

/**
 * Параметры для расчета suggestions
 */
export interface CalculateSuggestionsParams {
  exerciseId: string
  exerciseTags: string[]
  setNumber: number // Текущий номер подхода
  record?: ExerciseRecord | null
}

