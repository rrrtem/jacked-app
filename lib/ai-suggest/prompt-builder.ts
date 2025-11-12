/**
 * AI Prompt Builder for Workout Generation
 * Gathers all context and builds prompts for LLM
 */

import type { LLMMessage } from './llm-providers'

export type DbExercise = {
  id: string
  name: string
  instructions: string | null
  tags: string[] | null
  exercise_type: string
  movement_pattern: string
  muscle_group: string
}

export type WorkoutHistoryEntry = {
  id: string
  started_at: string
  exercises: {
    exercise_id: string
    exercise_name: string
    sets: {
      reps: number | null
      weight: number | null
    }[]
  }[]
}

export type WorkoutGenerationContext = {
  workoutHistory: WorkoutHistoryEntry[]
  userPreferences: string | null
  localContext: string
  availableExercises: DbExercise[]
}

export type WorkoutGenerationResult = {
  exercises: {
    exerciseId: string
    name: string
    reasoning: string
    suggestedSets: number
    suggestedReps: string
    suggestedRestSeconds: number
  }[]
  overallReasoning: string
}

/**
 * Build system prompt for workout generation
 */
function buildSystemPrompt(): string {
  return `You are an expert personal trainer and strength coach. Your role is to analyze a user's workout history, preferences, and current context to recommend a personalized workout set (list of exercises).

Key principles:
1. **Progressive Overload**: Recommend exercises that build on recent training
2. **Recovery**: Consider muscle group recovery times (chest/back: 48h, legs: 72h, shoulders/arms: 48h)
3. **Balance**: Ensure balanced development across muscle groups over time
4. **Variety**: Avoid repeating the same exercises too frequently
5. **Personalization**: Respect user preferences and current context

CRITICAL: Your response MUST be ONLY valid JSON. No markdown, no code blocks, no explanation - just pure JSON.

Return this exact structure:
{
  "exercises": [
    {
      "exerciseId": "uuid-from-available-exercises",
      "name": "Exercise Name",
      "reasoning": "Why this exercise is recommended (max 150 chars)",
      "suggestedSets": 3,
      "suggestedReps": "8-10",
      "suggestedRestSeconds": 120
    }
  ],
  "overallReasoning": "Brief, concise summary of today's focus (max 180 chars)"
}

IMPORTANT: Keep overallReasoning SHORT and to the point - just the key message, no fluff.

Example of good overallReasoning:
✅ "Your chest and shoulders have recovered well. Today focuses on building upper body strength with progressive overload."
❌ "Based on your workout history and considering your recovery status, I have carefully analyzed your training patterns and determined that..."

Guidelines for exercise selection:
- Recommend 2-4 exercises (not including warmup)
- Start with compound movements when possible
- Consider the user's recent training split
- Adapt intensity based on workout frequency
- Suggest appropriate sets/reps/rest based on the exercise type and training goal`
}

/**
 * Format workout history for the prompt
 */
function formatWorkoutHistory(history: WorkoutHistoryEntry[]): string {
  if (history.length === 0) {
    return "No workout history available (this is a new user)"
  }

  const formatted = history.map(workout => {
    const date = new Date(workout.started_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    
    const exercises = workout.exercises.map(ex => {
      const totalSets = ex.sets.length
      const avgReps = ex.sets.length > 0
        ? Math.round(ex.sets.reduce((sum, s) => sum + (s.reps || 0), 0) / ex.sets.length)
        : 0
      const avgWeight = ex.sets.length > 0
        ? Math.round(ex.sets.reduce((sum, s) => sum + (s.weight || 0), 0) / ex.sets.length)
        : 0

      return `  - ${ex.exercise_name}: ${totalSets} sets × ${avgReps} reps @ ${avgWeight}kg`
    }).join('\n')

    return `${date}:\n${exercises}`
  }).join('\n\n')

  return `Recent workout history (last 2 weeks, most recent first):\n\n${formatted}`
}

/**
 * Format available exercises for the prompt
 */
function formatAvailableExercises(exercises: DbExercise[]): string {
  const formatted = exercises.map(ex => {
    const tags = ex.tags && ex.tags.length > 0 ? ` [${ex.tags.join(', ')}]` : ''
    const instructions = ex.instructions ? ` - ${ex.instructions.substring(0, 100)}...` : ''
    
    return `- ID: ${ex.id}
  Name: ${ex.name}
  Type: ${ex.exercise_type}, Pattern: ${ex.movement_pattern}, Muscle: ${ex.muscle_group}${tags}${instructions}`
  }).join('\n\n')

  return `Available exercises (${exercises.length} total):\n\n${formatted}`
}

/**
 * Build user prompt with all context
 */
function buildUserPrompt(context: WorkoutGenerationContext): string {
  const historySection = formatWorkoutHistory(context.workoutHistory)
  const exercisesSection = formatAvailableExercises(context.availableExercises)
  
  const preferencesSection = context.userPreferences
    ? `\n\nUser's permanent training preferences:\n${context.userPreferences}`
    : ''

  const localContextSection = context.localContext
    ? `\n\nUser's current context/goals for this session:\n${context.localContext}`
    : ''

  return `${historySection}${preferencesSection}${localContextSection}

${exercisesSection}

Based on the above information, please recommend a personalized workout set (list of exercises) for today. Return ONLY valid JSON matching the specified schema.`
}

/**
 * Build complete messages array for LLM
 */
export function buildWorkoutGenerationMessages(
  context: WorkoutGenerationContext
): LLMMessage[] {
  return [
    {
      role: 'system',
      content: buildSystemPrompt()
    },
    {
      role: 'user',
      content: buildUserPrompt(context)
    }
  ]
}

/**
 * JSON Schema for structured output
 */
export function getWorkoutGenerationSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      exercises: {
        type: "array",
        items: {
          type: "object",
          properties: {
            exerciseId: {
              type: "string",
              description: "UUID of the exercise from available exercises"
            },
            name: {
              type: "string",
              description: "Name of the exercise"
            },
            reasoning: {
              type: "string",
              description: "Explanation of why this exercise is recommended"
            },
            suggestedSets: {
              type: "integer",
              description: "Number of sets to perform"
            },
            suggestedReps: {
              type: "string",
              description: "Number of reps (can be range like '8-10')"
            },
            suggestedRestSeconds: {
              type: "integer",
              description: "Rest time between sets in seconds"
            }
          },
          required: ["exerciseId", "name", "reasoning", "suggestedSets", "suggestedReps", "suggestedRestSeconds"]
        }
      },
      overallReasoning: {
        type: "string",
        description: "Overall explanation of the workout plan"
      }
    },
    required: ["exercises", "overallReasoning"]
  }
}

