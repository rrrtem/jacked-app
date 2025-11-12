/**
 * AI Workout Generation Storage
 * Manages localStorage for AI-generated workouts
 */

const STORAGE_KEY = 'ai-workout-generation'

export type StoredAIGeneration = {
  exercises: any[]
  reasoning: string
  context: string
  timestamp: number
}

/**
 * Save AI generation to localStorage
 */
export function saveAIGeneration(exercises: any[], reasoning: string, context: string): void {
  try {
    const generation: StoredAIGeneration = {
      exercises,
      reasoning,
      context,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(generation))
  } catch (error) {
    console.error('Error saving AI generation:', error)
  }
}

/**
 * Load AI generation from localStorage
 * Only returns data if it's less than 24 hours old
 */
export function loadAIGeneration(): StoredAIGeneration | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const generation: StoredAIGeneration = JSON.parse(stored)
    
    // Only load if generated within last 24 hours
    const age = Date.now() - generation.timestamp
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    if (age > maxAge) {
      // Expired, clear it
      clearAIGeneration()
      return null
    }
    
    return generation
  } catch (error) {
    console.error('Error loading AI generation:', error)
    return null
  }
}

/**
 * Clear AI generation from localStorage
 * Should only be called after workout completion
 */
export function clearAIGeneration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('✅ AI generation cleared from storage')
  } catch (error) {
    console.error('Error clearing AI generation:', error)
  }
}

/**
 * Check if there's a stored AI generation
 */
export function hasStoredAIGeneration(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== null
  } catch (error) {
    return false
  }
}

