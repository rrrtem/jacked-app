/**
 * Вспомогательные функции для AI Suggested
 */

import type { MuscleGroup, LegacyWorkoutHistoryEntry } from './types'

/**
 * Определить мышечные группы на основе метаданных упражнения из БД
 */
export function getMuscleGroupsFromExercise(exercise: {
  exercise_type: string
  movement_pattern: string
  muscle_group: string
}): MuscleGroup[] {
  const muscles: MuscleGroup[] = []
  
  // Основная группа по полю muscle_group
  const muscleGroup = exercise.muscle_group.toLowerCase()
  
  if (muscleGroup === 'chest') {
    muscles.push('chest')
    // Жимы также нагружают плечи и руки
    muscles.push('shoulders')
    muscles.push('arms')
  } else if (muscleGroup === 'back') {
    muscles.push('back')
    // Тяги также нагружают руки
    muscles.push('arms')
  } else if (muscleGroup === 'legs' || muscleGroup === 'full_body') {
    muscles.push('legs')
    // Приседы и становая также нагружают кор и спину
    muscles.push('core')
    if (exercise.exercise_type === 'strength') {
      muscles.push('back')
    }
  } else if (muscleGroup === 'shoulders') {
    muscles.push('shoulders')
    muscles.push('arms')
  } else if (muscleGroup === 'arms') {
    muscles.push('arms')
  } else if (muscleGroup === 'core') {
    muscles.push('core')
  }
  
  // Если ничего не добавилось, добавляем хотя бы core
  if (muscles.length === 0) {
    muscles.push('core')
  }
  
  return muscles
}

/**
 * Преобразовать данные из Supabase в формат для AI
 */
export function mapSupabaseToAIHistory(
  supabaseData: any[]
): LegacyWorkoutHistoryEntry[] {
  return supabaseData.map(session => ({
    id: session.id,
    date: new Date(session.started_at),
    exercises: (session.exercises || []).map((ex: any) => ({
      exerciseId: ex.exercise.id,
      name: ex.exercise.name,
      primaryMuscles: getMuscleGroupsFromExercise(ex.exercise)
    }))
  }))
}

