/**
 * Кеширование AI Suggested Workout
 * Генерируем заново только если была новая тренировка
 */

import type { SuggestedWorkout, WorkoutHistoryEntry } from './types'
import { generateAISuggestedWorkout, type DbExercise } from './generator'

const CACHE_KEY = 'ai-suggested-workout-cache'

interface CachedWorkout {
  workout: SuggestedWorkout
  lastWorkoutIds: string // хеш ID последних тренировок
}

/**
 * Главная функция получения AI Suggested Workout с кешированием
 */
export function getAISuggestedWorkout(
  workoutHistory: WorkoutHistoryEntry[],
  exercisesFromDB: DbExercise[]
): SuggestedWorkout {
  // Создаем хеш из ID последних 5 тренировок
  const workoutIds = workoutHistory
    .slice(0, 5)
    .map(w => w.id)
    .join(',')
  
  // Пытаемся получить из кеша
  const cached = getCachedWorkout()
  
  // Если есть кеш и список тренировок не изменился - возвращаем кеш
  if (cached && cached.lastWorkoutIds === workoutIds) {
    console.log('✅ Using cached AI suggested workout')
    return cached.workout
  }
  
  // Иначе генерируем заново
  console.log('🔄 Generating new AI suggested workout', {
    oldIds: cached?.lastWorkoutIds,
    newIds: workoutIds
  })
  const workout = generateAISuggestedWorkout(workoutHistory, exercisesFromDB)
  
  // Сохраняем в кеш
  saveCachedWorkout(workout, workoutIds)
  
  return workout
}

/**
 * Получить кешированную тренировку из localStorage
 */
function getCachedWorkout(): CachedWorkout | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const parsed = JSON.parse(cached) as CachedWorkout
    
    // Проверяем, что кеш не старше 7 дней
    const cachedDate = new Date(parsed.workout.generatedAt)
    const now = new Date()
    const daysDiff = (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysDiff > 7) {
      console.log('⚠️ Cached workout is older than 7 days, regenerating')
      return null
    }
    
    return parsed
  } catch (error) {
    console.error('Error reading cached workout:', error)
    return null
  }
}

/**
 * Сохранить тренировку в кеш
 */
function saveCachedWorkout(workout: SuggestedWorkout, workoutIds: string): void {
  try {
    const cache: CachedWorkout = {
      workout,
      lastWorkoutIds: workoutIds,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Error saving workout to cache:', error)
  }
}

/**
 * Очистить кеш (для debugging)
 */
export function clearAISuggestedCache(): void {
  localStorage.removeItem(CACHE_KEY)
  console.log('🗑️ AI suggested cache cleared')
}

