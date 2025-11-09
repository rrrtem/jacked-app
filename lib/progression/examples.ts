/**
 * Примеры использования системы прогрессии
 * Эти примеры можно использовать для тестирования или как справочник
 */

import { calculateSetSuggestion } from './index'
import { 
  calculateLinearLoadSuggestion, 
  calculateAllLinearLoadSuggestions,
} from './linear-load'
import { 
  calculatePercentageBasedSuggestion,
  calculateAllPercentageBasedSuggestions,
} from './percentage-based'
import { 
  calculateDurationBasedSuggestion,
  calculateAllDurationBasedSuggestions,
} from './duration-based'
import type { ExerciseRecord } from '@/lib/types/database'

/**
 * ПРИМЕР 1: Упражнение с весом (Жим лежа)
 * Рекорд: 100 кг × 8 повторений
 */
export function exampleBenchPress() {
  const record: ExerciseRecord = {
    id: 'record-1',
    user_id: 'user-1',
    exercise_id: 'exercise-bench-press',
    max_weight: 100,
    max_reps: 8,
    max_duration: null,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  console.log('=== ПРИМЕР: Жим лежа (Bench Press) ===')
  console.log('Рекорд: 100 кг × 8 повторений\n')

  // Рассчитываем suggestions для 5 подходов
  const suggestions = calculateAllLinearLoadSuggestions(5, record)
  
  suggestions.forEach((suggestion, index) => {
    console.log(`Подход ${index + 1}: ${suggestion.weight ?? 0} кг × ${suggestion.reps ?? 0} повторений`)
    console.log(`  └─ ${suggestion.note ?? ''}\n`)
  })

  return suggestions
}

/**
 * ПРИМЕР 2: Упражнение без веса (Подтягивания)
 * Рекорд: 20 повторений
 */
export function examplePullUps() {
  const record: ExerciseRecord = {
    id: 'record-2',
    user_id: 'user-1',
    exercise_id: 'exercise-pull-ups',
    max_weight: null,
    max_reps: 20,
    max_duration: null,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  console.log('=== ПРИМЕР: Подтягивания (Pull-ups) ===')
  console.log('Рекорд: 20 повторений\n')

  // Рассчитываем suggestions для 3 подходов
  const suggestions = calculateAllPercentageBasedSuggestions(3, record)
  
  suggestions.forEach((suggestion, index) => {
    console.log(`Подход ${index + 1}: ${suggestion.reps ?? 0} повторений`)
    console.log(`  └─ ${suggestion.note ?? ''}\n`)
  })

  return suggestions
}

/**
 * ПРИМЕР 3: Упражнение на время (Планка)
 * Рекорд: 90 секунд
 */
export function examplePlank() {
  const record: ExerciseRecord = {
    id: 'record-3',
    user_id: 'user-1',
    exercise_id: 'exercise-plank',
    max_weight: null,
    max_reps: null,
    max_duration: 90,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  console.log('=== ПРИМЕР: Планка (Plank) ===')
  console.log('Рекорд: 90 секунд\n')

  // Рассчитываем suggestions для 3 подходов
  const suggestions = calculateAllDurationBasedSuggestions(3, record)
  
  suggestions.forEach((suggestion, index) => {
    console.log(`Подход ${index + 1}: ${suggestion.duration ?? 0} секунд`)
    console.log(`  └─ ${suggestion.note ?? ''}\n`)
  })

  return suggestions
}

/**
 * ПРИМЕР 4: Малый рекорд (меньше веса грифа)
 * Показывает корректировку минимального веса
 */
export function exampleSmallRecord() {
  const record: ExerciseRecord = {
    id: 'record-4',
    user_id: 'user-1',
    exercise_id: 'exercise-small-weight',
    max_weight: 30, // Рекорд всего 30 кг
    max_reps: 10,
    max_duration: null,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  console.log('=== ПРИМЕР: Малый рекорд (30 кг) ===')
  console.log('Рекорд: 30 кг × 10 повторений')
  console.log('Демонстрирует корректировку минимального веса\n')

  // Рассчитываем suggestions для 5 подходов
  const suggestions = calculateAllLinearLoadSuggestions(5, record)
  
  suggestions.forEach((suggestion, index) => {
    const percentage = index === 0 ? 'bar' : `${[40, 60, 80, 100][index - 1]}%`
    const calculated = index === 0 ? 20 : Math.round(30 * [40, 60, 80, 100][index - 1] / 100)
    const weight = suggestion.weight ?? 0
    const correction = weight > calculated ? '' : ` (${calculated} кг → ${weight} кг минимум)`
    
    console.log(`Подход ${index + 1}: ${weight} кг × ${suggestion.reps ?? 0} повторений${correction}`)
    console.log(`  └─ ${suggestion.note ?? ''}\n`)
  })

  return suggestions
}

/**
 * ПРИМЕР 5: Упражнение без рекорда (Новое упражнение)
 * Показывает, как система работает с новичками
 */
export function exampleNoRecord() {
  console.log('=== ПРИМЕР: Новое упражнение (нет рекорда) ===\n')

  // Для упражнения с весом
  console.log('Жим штанги (без рекорда):')
  const weightSuggestions = calculateAllLinearLoadSuggestions(3, null)
  weightSuggestions.forEach((s, i) => {
    console.log(`  Подход ${i + 1}: ${s.weight ?? 0} кг × ${s.reps ?? 0} повторений`)
  })

  console.log('\nОтжимания (без рекорда):')
  const repsSuggestions = calculateAllPercentageBasedSuggestions(3, null)
  repsSuggestions.forEach((s, i) => {
    console.log(`  Подход ${i + 1}: ${s.reps ?? 0} повторений`)
  })

  console.log('\nПланка (без рекорда):')
  const durationSuggestions = calculateAllDurationBasedSuggestions(3, null)
  durationSuggestions.forEach((s, i) => {
    console.log(`  Подход ${i + 1}: ${s.duration ?? 0} секунд`)
  })
}

/**
 * ПРИМЕР 6: Автоматическое определение типа упражнения
 * Система сама определяет, какую логику использовать
 */
export function exampleAutoDetection() {
  const benchPressRecord: ExerciseRecord = {
    id: 'record-bench',
    user_id: 'user-1',
    exercise_id: 'exercise-bench-press',
    max_weight: 100,
    max_reps: 8,
    max_duration: null,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }

  console.log('=== ПРИМЕР: Автоопределение типа упражнения ===\n')

  // Упражнение с весом
  const weightSuggestion = calculateSetSuggestion({
    exerciseId: 'exercise-bench-press',
    exerciseTags: ['weight', 'push', 'chest'],
    setNumber: 3,
    record: benchPressRecord,
  })
  console.log('Жим лежа (теги: weight, push, chest)')
  console.log(`  → Использует Linear Load Progression`)
  console.log(`  → Подход 3: ${weightSuggestion.weight ?? 0} кг × ${weightSuggestion.reps ?? 0} повторений\n`)

  // Упражнение без веса
  const bodyweightRecord: ExerciseRecord = {
    ...benchPressRecord,
    exercise_id: 'exercise-pull-ups',
    max_weight: null,
    max_reps: 20,
  }

  const repsSuggestion = calculateSetSuggestion({
    exerciseId: 'exercise-pull-ups',
    exerciseTags: ['pull', 'back'],
    setNumber: 2,
    record: bodyweightRecord,
  })
  console.log('Подтягивания (теги: pull, back)')
  console.log(`  → Использует Percentage-Based Progression`)
  console.log(`  → Подход 2: ${repsSuggestion.reps ?? 0} повторений\n`)

  // Упражнение на время
  const plankRecord: ExerciseRecord = {
    ...benchPressRecord,
    exercise_id: 'exercise-plank',
    max_weight: null,
    max_reps: null,
    max_duration: 90,
  }

  const durationSuggestion = calculateSetSuggestion({
    exerciseId: 'exercise-plank',
    exerciseTags: ['duration', 'core'],
    setNumber: 2,
    record: plankRecord,
  })
  console.log('Планка (теги: duration, core)')
  console.log(`  → Использует Duration-Based Progression`)
  console.log(`  → Подход 2: ${durationSuggestion.duration ?? 0} секунд\n`)
}

/**
 * Запустить все примеры
 */
export function runAllExamples() {
  console.log('\n' + '='.repeat(60))
  console.log('ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ СИСТЕМЫ ПРОГРЕССИИ')
  console.log('='.repeat(60) + '\n')

  exampleBenchPress()
  console.log('\n')
  
  examplePullUps()
  console.log('\n')
  
  examplePlank()
  console.log('\n')
  
  exampleSmallRecord()
  console.log('\n')
  
  exampleNoRecord()
  console.log('\n')
  
  exampleAutoDetection()
  
  console.log('='.repeat(60) + '\n')
}

