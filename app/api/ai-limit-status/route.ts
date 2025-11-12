/**
 * API Route for checking AI request limit status
 * GET /api/ai-limit-status
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAILimitStatus } from '@/lib/ai-suggest/rate-limiter'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get rate limit status
    const status = await getAILimitStatus(supabase, user.id)

    return NextResponse.json(status)

  } catch (error) {
    console.error('Error fetching AI limit status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch limit status' },
      { status: 500 }
    )
  }
}

