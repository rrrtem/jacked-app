/**
 * Типы для AI Suggested Workout Logic
 */

export type MuscleGroup = 
  | 'chest'
  | 'back' 
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'full_body'

export type MovementPattern = 
  | 'push'
  | 'pull'
  | 'squat'
  | 'hinge'
  | 'carry'
  | 'core'

export type WorkoutType = 
  | 'push'
  | 'pull'
  | 'legs'
  | 'upper'
  | 'lower'
  | 'full_body'

export type ExerciseType = 
  | 'compound_barbell'  // Комплексное со штангой
  | 'compound_other'    // Комплексное без штанги
  | 'isolation'         // Изоляция
  | 'bodyweight'        // Собственный вес

export interface ExerciseMetadata {
  id: string
  name: string
  type: ExerciseType
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  movementPattern: MovementPattern
  equipment: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface LegacyWorkoutHistoryEntry {
  id: string
  date: Date
  exercises: {
    exerciseId: string
    name: string
    primaryMuscles: MuscleGroup[]
  }[]
}

export interface SuggestedExercise {
  exerciseId: string
  name: string
  type: ExerciseType
  suggestedSets: number
  suggestedReps: string
  suggestedRest: number // секунды
}

export interface SuggestedWorkout {
  exercises: SuggestedExercise[]
  generatedAt: Date
  basedOnWorkoutCount: number // количество тренировок в истории
}

export interface RecoveryStatus {
  muscleGroup: MuscleGroup
  daysSinceLastWorkout: number
  isRecovered: boolean
  recoveryTime: number // сколько дней нужно
}

