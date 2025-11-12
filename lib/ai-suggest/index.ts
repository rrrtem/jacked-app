/**
 * AI Suggested Workout - Main Export
 */

export * from './types'
export * from './generator'
export * from './utils'

// LLM-based generation (new)
export * from './llm-providers'
export * from './llm-generator'
export * from './prompt-builder'

// Legacy rule-based generation with cache
export { getAISuggestedWorkout, clearAISuggestedCache } from './cache'

