/**
 * LLM-based Workout Generator
 * Uses LLM to generate personalized workout recommendations
 */

import { getDefaultLLMClient } from './llm-providers'
import {
  buildWorkoutGenerationMessages,
  getWorkoutGenerationSchema,
  type WorkoutGenerationContext,
  type WorkoutGenerationResult,
} from './prompt-builder'

/**
 * Generate workout using LLM
 */
export async function generateWorkoutWithLLM(
  context: WorkoutGenerationContext
): Promise<WorkoutGenerationResult> {
  try {
    const client = getDefaultLLMClient()
    const messages = buildWorkoutGenerationMessages(context)
    const schema = getWorkoutGenerationSchema()

    const result = await client.generateStructured<WorkoutGenerationResult>(
      messages,
      schema
    )

    return result
  } catch (error) {
    console.error('Error generating workout with LLM:', error)
    throw new Error('Failed to generate workout. Please try again.')
  }
}

/**
 * Validate that exercise IDs exist in available exercises
 */
export function validateGeneratedWorkout(
  result: WorkoutGenerationResult,
  availableExercises: { id: string; name: string }[]
): boolean {
  const availableIds = new Set(availableExercises.map(ex => ex.id))
  
  for (const exercise of result.exercises) {
    if (!availableIds.has(exercise.exerciseId)) {
      console.error(`Invalid exercise ID: ${exercise.exerciseId}`)
      return false
    }
  }
  
  return true
}

