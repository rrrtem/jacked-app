import type { ExerciseData } from "./types"

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export const getExerciseKey = (exercise?: ExerciseData | null): string => {
  if (!exercise) return ""
  return exercise.workoutEntryId || exercise.id
}

export const hasExerciseType = (
  exercise: ExerciseData | null | undefined,
  type: string
): boolean => {
  if (!exercise?.exercise_type) return false

  // For "weight" type check multiple variants
  if (type === "weight") {
    return ["weight", "strength", "dumbbell", "barbell"].includes(exercise.exercise_type)
  }

  return exercise.exercise_type === type
}

export const pickRandomWarmup = <T extends { id: string }>(
  pool: T[],
  excludeId?: string
): T | null => {
  if (pool.length === 0) return null
  const available = excludeId ? pool.filter((exercise) => exercise.id !== excludeId) : pool
  if (available.length === 0) {
    const fallback = pool.find((exercise) => exercise.id === excludeId)
    return fallback ?? pool[0]
  }
  const randomIndex = Math.floor(Math.random() * available.length)
  return available[randomIndex]
}

