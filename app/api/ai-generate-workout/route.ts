/**
 * API Route for AI Workout Generation
 * POST /api/ai-generate-workout
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWorkoutWithLLM, validateGeneratedWorkout } from '@/lib/ai-suggest/llm-generator'
import type { WorkoutGenerationContext, DbExercise, WorkoutHistoryEntry } from '@/lib/ai-suggest/prompt-builder'
import { checkAndIncrementAILimit } from '@/lib/ai-suggest/rate-limiter'

export async function POST(request: Request) {
  console.log('🔵 AI Generate Workout API called')
  
  try {
    console.log('1️⃣ Creating Supabase client...')
    const supabase = await createClient()

    // Check authentication
    console.log('2️⃣ Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('✅ User authenticated:', user.id)

    // Check rate limit
    console.log('3️⃣ Checking AI request rate limit...')
    const rateLimitStatus = await checkAndIncrementAILimit(supabase, user.id)
    
    if (!rateLimitStatus.allowed) {
      console.log('❌ Rate limit exceeded:', rateLimitStatus)
      return NextResponse.json(
        { 
          error: 'Daily AI request limit reached',
          remaining: rateLimitStatus.remaining,
          limit: rateLimitStatus.limit,
          resetAt: rateLimitStatus.resetAt
        },
        { status: 429 }
      )
    }
    
    console.log('✅ Rate limit OK:', `${rateLimitStatus.remaining}/${rateLimitStatus.limit} remaining`)

    // Parse request body
    console.log('4️⃣ Parsing request body...')
    const body = await request.json()
    const { localContext } = body as { localContext: string }
    console.log('Local context:', localContext || '(empty)')

    // 1. Get user preferences
    console.log('5️⃣ Fetching user preferences...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('training_preferences')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('⚠️ Error fetching user preferences:', userError)
    }

    const userPreferences = userData?.training_preferences || null
    console.log('User preferences:', userPreferences ? 'Set' : 'None')

    // 2. Get workout history (last 2 weeks)
    console.log('6️⃣ Fetching workout history...')
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const { data: workouts, error: workoutsError } = await supabase
      .from('workout_sessions')
      .select(`
        id,
        started_at,
        exercises:workout_session_exercises(
          exercise_id,
          exercise:exercises(
            id,
            name
          ),
          sets:workout_session_sets(
            reps,
            weight
          )
        )
      `)
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .gte('started_at', twoWeeksAgo.toISOString())
      .order('started_at', { ascending: false })

    if (workoutsError) {
      console.error('❌ Error fetching workout history:', workoutsError)
      return NextResponse.json(
        { error: 'Failed to fetch workout history' },
        { status: 500 }
      )
    }
    
    console.log(`✅ Found ${workouts?.length || 0} workouts in last 2 weeks`)

    // Transform workout history to the format expected by prompt builder
    const workoutHistory: WorkoutHistoryEntry[] = (workouts || []).map((workout: unknown) => {
      const w = workout as {
        id: string
        started_at: string
        exercises: Array<{
          exercise_id: string
          exercise: { id: string; name: string }
          sets: Array<{ reps: number | null; weight: number | null }>
        }>
      }
      
      const exercises = w.exercises.map(we => ({
        exercise_id: we.exercise_id,
        exercise_name: we.exercise.name,
        sets: we.sets || []
      }))

      return {
        id: w.id,
        started_at: w.started_at,
        exercises
      }
    })

    // 3. Get all available exercises
    console.log('7️⃣ Fetching exercises from database...')
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('id, name, instructions, exercise_type, movement_pattern, muscle_group')
      .order('name')

    if (exercisesError) {
      console.error('❌ Error fetching exercises:', exercisesError)
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      )
    }
    
    console.log(`✅ Found ${exercises?.length || 0} exercises`)

    const availableExercises: DbExercise[] = (exercises || []).map((ex: unknown) => {
      const e = ex as {
        id: string
        name: string
        instructions: string | null
        exercise_type: string
        movement_pattern: string
        muscle_group: string
      }
      
      return {
        id: e.id,
        name: e.name,
        instructions: e.instructions,
        tags: null, // tags field doesn't exist in current schema
        exercise_type: e.exercise_type,
        movement_pattern: e.movement_pattern,
        muscle_group: e.muscle_group
      }
    })

    // 4. Build context and generate workout
    console.log('8️⃣ Building context for LLM...')
    const context: WorkoutGenerationContext = {
      workoutHistory,
      userPreferences,
      localContext: localContext || '',
      availableExercises
    }
    
    console.log('Context summary:', {
      historyCount: workoutHistory.length,
      hasPreferences: !!userPreferences,
      hasLocalContext: !!localContext,
      exercisesCount: availableExercises.length
    })

    console.log('9️⃣ Calling LLM to generate workout...')
    const result = await generateWorkoutWithLLM(context)
    console.log('✅ LLM generation complete!')

    // 5. Validate result
    console.log('🔟 Validating generated workout...')
    const isValid = validateGeneratedWorkout(result, availableExercises)
    
    if (!isValid) {
      console.error('❌ Validation failed: invalid exercise IDs')
      return NextResponse.json(
        { error: 'Generated workout contains invalid exercises' },
        { status: 500 }
      )
    }
    
    console.log('✅ Validation passed!')

    // 6. Return result
    console.log('🎉 Returning successful response')
    return NextResponse.json({
      success: true,
      data: result,
      rateLimit: {
        remaining: rateLimitStatus.remaining,
        limit: rateLimitStatus.limit
      }
    })

  } catch (error) {
    console.error('Error in AI workout generation:', error)
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate workout',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

