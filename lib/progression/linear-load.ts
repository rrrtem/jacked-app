/**
 * Simple Weight Progression
 * Простое увеличение веса от пустого грифа до рабочего веса
 * 
 * Логика:
 * - Подход 1: пустой гриф (20 кг) - разминка
 * - Подходы 2-3: подводка к рабочему весу (шаги +10, +5, +2 кг)
 * - Подход 4: рабочий вес из рекорда
 * - Подход 5+: прогрессия (+2.5 кг к рекорду)
 */

import type { ExerciseRecord } from '@/lib/types/database'
import type { SetSuggestion, LinearLoadProgressionConfig } from '@/lib/types/progression'

/**
 * Конфигурация по умолчанию
 */
export const DEFAULT_LINEAR_LOAD_CONFIG: LinearLoadProgressionConfig = {
  type: 'linear-load',
  emptyBarWeight: 20, // Пустой гриф = 20 кг
  warmupReps: 10, // 10 повторений на разминке
  percentages: [], // Больше не используется, но оставляем для совместимости типов
}

/**
 * Рассчитать оптимальные шаги для подводки к рабочему весу
 * 
 * @param emptyBar - Вес пустого грифа (20 кг)
 * @param workingWeight - Целевой рабочий вес
 * @returns Массив весов для подводящих подходов (БЕЗ рабочего веса)
 * 
 * Логика:
 * - Легкие веса (до 50 кг): 1-2 подводящих шага
 * - Средние веса (50-80 кг): 2-3 подводящих шага  
 * - Тяжелые веса (80+ кг): 3-4 подводящих шага с умеренным увеличением
 */
function calculateWarmupSteps(emptyBar: number, workingWeight: number): number[] {
  const steps: number[] = []
  const totalToAdd = workingWeight - emptyBar
  
  // Если рабочий вес очень близко к пустому грифу (меньше 15 кг разницы)
  if (totalToAdd < 15) {
    // Добавляем один промежуточный шаг если есть место
    if (totalToAdd >= 7.5) {
      steps.push(emptyBar + 5)
    }
    return steps
  }
  
  let currentWeight = emptyBar
  
  // Определяем стратегию в зависимости от веса
  if (workingWeight >= 100) {
    // Очень тяжелый вес (100+ кг): больше шагов для плавной подводки
    // Например 100кг: 20->30->40->50->60->70->80->90->100
    // Идём шагами +10 кг, останавливаемся за 10-15 кг до рабочего
    while (currentWeight + 10 < workingWeight) {
      const remaining = workingWeight - currentWeight
      
      // Останавливаемся если осталось меньше 15 кг
      if (remaining <= 15) break
      
      currentWeight += 10
      steps.push(currentWeight)
    }
  } else if (workingWeight >= 60) {
    // Средний вес (60-100 кг): 2-3 шага по +10, остановка за 10 кг
    // Например 60кг: 20->30->40->50 (stop at 10kg remaining)
    while (currentWeight + 10 <= workingWeight - 10) {
      currentWeight += 10
      steps.push(currentWeight)
      // Ограничиваем максимум 3 подводящими подходами
      if (steps.length >= 3) break
    }
  } else {
    // Легкий вес (до 60 кг): 1-2 шага, быстрее к рабочему
    // Например 40кг: 20->30 (stop at 10kg remaining)
    while (currentWeight < workingWeight - 10) {
      const remaining = workingWeight - currentWeight
      const step = remaining > 15 ? 10 : 5
      currentWeight += step
      if (currentWeight < workingWeight) {
        steps.push(currentWeight)
      }
      // Ограничиваем максимум 2 подводящими подходами
      if (steps.length >= 2) break
    }
  }
  
  return steps
}

/**
 * Рассчитать suggestion для подхода
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
  const emptyBar = config.emptyBarWeight
  const warmupReps = config.warmupReps
  
  // Первый подход всегда с пустым грифом
  if (setNumber === 1) {
    return {
      weight: emptyBar,
      reps: warmupReps,
      note: 'Warm-up (empty bar)',
    }
  }

  // Если нет рекорда, предлагаем консервативные значения
  if (!record || !record.max_weight) {
    const fallbackWeights = [
      emptyBar,      // Подход 1: 20 кг
      30,            // Подход 2: 30 кг
      40,            // Подход 3: 40 кг
      50,            // Подход 4: 50 кг
      55,            // Подход 5: 55 кг
    ]
    
    return {
      weight: fallbackWeights[setNumber - 1] || emptyBar,
      reps: warmupReps,
      note: setNumber <= 3 ? 'Warm-up' : 'Working set',
    }
  }

  const workingWeight = record.max_weight
  const workingReps = record.max_reps || 5
  
  // Рассчитываем подводящие подходы
  const warmupSteps = calculateWarmupSteps(emptyBar, workingWeight)
  
  // Подход 2-3 (или сколько получилось): подводящие подходы
  const warmupIndex = setNumber - 2 // setNumber 2 -> index 0
  if (warmupIndex < warmupSteps.length) {
    return {
      weight: warmupSteps[warmupIndex],
      reps: warmupReps,
      note: 'Warm-up',
    }
  }
  
  // Первый рабочий подход (обычно подход 4): рабочий вес из рекорда
  const firstWorkingSet = 2 + warmupSteps.length
  if (setNumber === firstWorkingSet) {
    return {
      weight: workingWeight,
      reps: workingReps,
      note: 'Working set',
    }
  }
  
  // Подходы после рабочего: прогрессия (+2.5 кг)
  return {
    weight: workingWeight + 2.5,
    reps: workingReps,
    note: 'Progression',
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

