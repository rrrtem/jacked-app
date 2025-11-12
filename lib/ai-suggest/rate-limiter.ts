/**
 * AI Request Rate Limiter
 * Manages daily limits for AI workout generation
 */

import { SupabaseClient } from '@supabase/supabase-js'

export type RateLimitStatus = {
  allowed: boolean
  remaining: number
  limit: number
  resetAt: string
}

/**
 * Check if user can make an AI request and update counter
 */
export async function checkAndIncrementAILimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitStatus> {
  // Get user's current limit status
  const { data: user, error } = await supabase
    .from('users')
    .select('ai_daily_limit, ai_requests_count, ai_requests_reset_at')
    .eq('id', userId)
    .single()

  if (error || !user) {
    console.error('Error fetching user AI limit:', error)
    throw new Error('Failed to check AI request limit')
  }

  const limit = user.ai_daily_limit || 3
  const resetAt = new Date(user.ai_requests_reset_at)
  const now = new Date()

  // Check if we need to reset the counter (new day)
  const needsReset = now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000

  let currentCount = user.ai_requests_count || 0
  
  if (needsReset) {
    // Reset counter for new day
    currentCount = 0
    await supabase
      .from('users')
      .update({
        ai_requests_count: 0,
        ai_requests_reset_at: now.toISOString()
      })
      .eq('id', userId)
  }

  // Check if limit exceeded
  if (currentCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt: new Date(resetAt.getTime() + 24 * 60 * 60 * 1000).toISOString()
    }
  }

  // Increment counter
  const newCount = currentCount + 1
  await supabase
    .from('users')
    .update({ ai_requests_count: newCount })
    .eq('id', userId)

  return {
    allowed: true,
    remaining: limit - newCount,
    limit,
    resetAt: new Date(resetAt.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getAILimitStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitStatus> {
  const { data: user, error } = await supabase
    .from('users')
    .select('ai_daily_limit, ai_requests_count, ai_requests_reset_at')
    .eq('id', userId)
    .single()

  if (error || !user) {
    console.error('Error fetching user AI limit:', error)
    return {
      allowed: false,
      remaining: 0,
      limit: 3,
      resetAt: new Date().toISOString()
    }
  }

  const limit = user.ai_daily_limit || 3
  const resetAt = new Date(user.ai_requests_reset_at)
  const now = new Date()

  // Check if we need to reset the counter (new day)
  const needsReset = now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000

  let currentCount = user.ai_requests_count || 0
  
  if (needsReset) {
    currentCount = 0
  }

  const remaining = Math.max(0, limit - currentCount)

  return {
    allowed: remaining > 0,
    remaining,
    limit,
    resetAt: new Date(resetAt.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }
}

