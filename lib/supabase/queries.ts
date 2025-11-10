/**
 * Готовые запросы для работы с базой данных Supabase
 */

import { createClient } from '@/lib/supabase/client'
import type {
  Exercise,
  ExerciseWithRecords,
  WorkoutSet,
  WorkoutSetWithExercises,
  WorkoutSession,
  WorkoutSessionWithDetails,
  CreateWorkoutSessionData,
  SaveWorkoutSessionSetData,
  WorkoutHistoryFilters,
  ExerciseRecordUpdate,
  ExerciseRecordInsert,
} from '@/lib/types/database'

// ============================================
// УПРАЖНЕНИЯ (Exercises)
// ============================================

/**
 * Получить все упражнения
 */
export async function getAllExercises(): Promise<Exercise[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

/**
 * Получить упражнение по ID
 */
export async function getExerciseById(id: string): Promise<Exercise | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Получить упражнения по категориям
 */
export async function getExercisesByCategory(
  category: 'exercise_type' | 'muscle_group' | 'equipment' | 'movement_pattern',
  value: string
): Promise<Exercise[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq(category, value)
    .order('name')

  if (error) throw error
  return data || []
}

/**
 * @deprecated Используйте getExercisesByCategory вместо этой функции
 * Получить упражнения по тегам (устаревшая функция)
 */
export async function getExercisesByTags(tags: string[]): Promise<Exercise[]> {
  console.warn('getExercisesByTags is deprecated. Use getExercisesByCategory instead.')
  // Для обратной совместимости возвращаем все упражнения
  return getAllExercises()
}

/**
 * Получить упражнения с личными рекордами пользователя
 */
export async function getExercisesWithRecords(
  userId: string
): Promise<ExerciseWithRecords[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      record:exercise_records!inner(*)
    `)
    .eq('exercise_records.user_id', userId)
    .order('name')
    .returns<ExerciseWithRecords[]>()

  if (error) throw error
  return data ?? []
}

// ============================================
// ЛИЧНЫЕ РЕКОРДЫ (Exercise Records)
// ============================================

/**
 * Получить личный рекорд пользователя по упражнению
 */
export async function getExerciseRecord(
  userId: string,
  exerciseId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercise_records')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data
}

/**
 * Обновить личный рекорд пользователя
 */
export async function updateExerciseRecord(
  userId: string,
  exerciseId: string,
  record: ExerciseRecordUpdate
) {
  const supabase = createClient()
  
  const upsertData: ExerciseRecordInsert = {
    user_id: userId,
    exercise_id: exerciseId,
    max_weight: record.max_weight ?? null,
    max_reps: record.max_reps ?? null,
    max_duration: record.max_duration ?? null,
    last_updated: new Date().toISOString(),
  }
  
  const { data, error } = await supabase
    .from('exercise_records')
    .upsert(upsertData as any, { onConflict: 'user_id,exercise_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Получить все рекорды пользователя
 */
export async function getAllUserRecords(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercise_records')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('user_id', userId)
    .order('last_updated', { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================
// ШАБЛОНЫ ТРЕНИРОВОК (Workout Sets)
// ============================================

/**
 * Получить все шаблоны пользователя
 */
export async function getWorkoutSets(userId: string): Promise<WorkoutSet[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Получить шаблон с упражнениями
 */
export async function getWorkoutSetWithExercises(
  setId: string
): Promise<WorkoutSetWithExercises | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sets')
    .select(`
      *,
      exercises:workout_set_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .eq('id', setId)
    .single()

  if (error) throw error
  
  const workoutSet = data as unknown as WorkoutSetWithExercises | null
  
  // Сортируем упражнения по order_index
  if (workoutSet?.exercises) {
    workoutSet.exercises.sort((a, b) => a.order_index - b.order_index)
  }
  
  return workoutSet
}

/**
 * Создать новый шаблон тренировки
 */
export async function createWorkoutSet(
  userId: string,
  name: string,
  description?: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sets')
    .insert({
      user_id: userId,
      name,
      description,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Добавить упражнение в шаблон
 */
export async function addExerciseToWorkoutSet(
  workoutSetId: string,
  exerciseId: string,
  orderIndex: number,
  options?: {
    target_sets?: number
    target_reps?: number
    target_weight?: number
    rest_duration?: number
  }
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_set_exercises')
    .insert({
      workout_set_id: workoutSetId,
      exercise_id: exerciseId,
      order_index: orderIndex,
      ...options,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// СЕССИИ ТРЕНИРОВОК (Workout Sessions)
// ============================================

/**
 * Создать новую тренировочную сессию
 */
export async function createWorkoutSession(
  userId: string,
  data: CreateWorkoutSessionData
) {
  const supabase = createClient()
  
  // 1. Создаём сессию
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: userId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (sessionError) throw sessionError

  // 2. Добавляем упражнения
  const { error: exercisesError } = await supabase
    .from('workout_session_exercises')
    .insert(
      data.exercises.map((ex) => ({
        workout_session_id: session.id,
        exercise_id: ex.exercise_id,
        order_index: ex.order_index,
        workout_set_exercise_id: ex.workout_set_exercise_id ?? null,
      }))
    )

  if (exercisesError) throw exercisesError

  return session
}

/**
 * Получить активную тренировочную сессию пользователя
 */
export async function getActiveWorkoutSession(
  userId: string
): Promise<WorkoutSessionWithDetails | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      exercises:workout_session_exercises(
        *,
        exercise:exercises(*),
        sets:workout_session_sets(*)
      )
    `)
    .eq('user_id', userId)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  
  const session = data as unknown as WorkoutSessionWithDetails | null
  
  // Сортируем упражнения и подходы
  if (session?.exercises) {
    session.exercises.sort((a, b) => a.order_index - b.order_index)
    session.exercises.forEach((ex) => {
      if (ex.sets) {
        ex.sets.sort((a, b) => a.set_number - b.set_number)
      }
    })
  }
  
  return session
}

/**
 * Завершить тренировочную сессию
 */
export async function completeWorkoutSession(sessionId: string) {
  const supabase = createClient()
  
  // Получаем время начала для расчета длительности
  const { data: session } = await supabase
    .from('workout_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .single()

  if (!session) throw new Error('Session not found')

  const completedAt = new Date()
  const startedAt = new Date(session.started_at)
  const duration = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000)

  const { data, error } = await supabase
    .from('workout_sessions')
    .update({
      completed_at: completedAt.toISOString(),
      duration,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Сохранить данные подхода
 */
export async function saveWorkoutSessionSet(data: SaveWorkoutSessionSetData) {
  const supabase = createClient()
  const { data: setData, error } = await supabase
    .from('workout_session_sets')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return setData
}

/**
 * Получить историю тренировок
 */
export async function getWorkoutHistory(
  filters: WorkoutHistoryFilters
): Promise<WorkoutSession[]> {
  const supabase = createClient()
  let query = supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', filters.user_id)
    .not('completed_at', 'is', null)
    .order('started_at', { ascending: false })

  if (filters.date_from) {
    query = query.gte('started_at', filters.date_from)
  }

  if (filters.date_to) {
    query = query.lte('started_at', filters.date_to)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Получить детали тренировки по ID
 */
export async function getWorkoutSessionById(
  sessionId: string
): Promise<WorkoutSessionWithDetails | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      exercises:workout_session_exercises(
        *,
        exercise:exercises(*),
        sets:workout_session_sets(*)
      )
    `)
    .eq('id', sessionId)
    .single()

  if (error) throw error
  
  const session = data as unknown as WorkoutSessionWithDetails | null
  
  // Сортируем упражнения и подходы
  if (session?.exercises) {
    session.exercises.sort((a, b) => a.order_index - b.order_index)
    session.exercises.forEach((ex) => {
      if (ex.sets) {
        ex.sets.sort((a, b) => a.set_number - b.set_number)
      }
    })
  }
  
  return session
}

/**
 * Получить тренировки за определенную дату
 */
export async function getWorkoutsByDate(userId: string, date: string) {
  const supabase = createClient()
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', startOfDay.toISOString())
    .lte('started_at', endOfDay.toISOString())
    .order('started_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Получить календарь тренировок (даты с тренировками за месяц)
 */
export async function getWorkoutCalendar(userId: string, year: number, month: number) {
  const supabase = createClient()
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, started_at, completed_at, duration')
    .eq('user_id', userId)
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString())
    .not('completed_at', 'is', null)
    .order('started_at', { ascending: true })

  if (error) throw error
  
  // Группируем по датам
  const calendar = new Map<string, typeof data>()
  data?.forEach((session) => {
    const date = new Date(session.started_at).toISOString().split('T')[0]
    if (!calendar.has(date)) {
      calendar.set(date, [])
    }
    calendar.get(date)!.push(session)
  })
  
  return calendar
}

/**
 * Отметить разминку как завершенную
 */
export async function markWarmupCompleted(workoutSessionExerciseId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_session_exercises')
    .update({ warmup_completed: true })
    .eq('id', workoutSessionExerciseId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// ИСТОРИЯ ЛИЧНЫХ РЕКОРДОВ (Exercise Record History)
// ============================================

/**
 * Добавить запись в историю рекордов
 */
export async function addRecordToHistory(
  userId: string,
  exerciseId: string,
  data: {
    weight?: number | null
    reps?: number | null
    duration?: number | null
    workout_session_id?: string | null
    notes?: string | null
  }
) {
  const supabase = createClient()
  const { data: record, error } = await supabase
    .from('exercise_record_history')
    .insert({
      user_id: userId,
      exercise_id: exerciseId,
      weight: data.weight,
      reps: data.reps,
      duration: data.duration,
      workout_session_id: data.workout_session_id,
      notes: data.notes,
      achieved_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return record
}

/**
 * Получить историю рекордов по упражнению
 */
export async function getExerciseRecordHistory(
  userId: string,
  exerciseId: string,
  limit = 50
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercise_record_history')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('achieved_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Получить все рекорды за период
 */
export async function getRecordHistoryByDateRange(
  userId: string,
  dateFrom: string,
  dateTo: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercise_record_history')
    .select(`
      *,
      exercise:exercises(name, tags)
    `)
    .eq('user_id', userId)
    .gte('achieved_at', dateFrom)
    .lte('achieved_at', dateTo)
    .order('achieved_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Получить данные для графика прогресса
 */
export async function getProgressChartData(
  userId: string,
  exerciseId: string,
  metric: 'weight' | 'reps' | 'duration'
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercise_record_history')
    .select('achieved_at, weight, reps, duration')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .not(metric, 'is', null)
    .order('achieved_at', { ascending: true })

  if (error) throw error
  
  // Форматируем данные для графика
  return data?.map(record => ({
    date: new Date(record.achieved_at).toLocaleDateString(),
    value: record[metric],
  })) || []
}

/**
 * Удалить тренировочную сессию
 */
export async function deleteWorkoutSession(sessionId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) throw error
}

// ============================================
// ОБНОВЛЕНИЕ РЕКОРДОВ
// ============================================

/**
 * Проверить и обновить личные рекорды пользователя на основе выполненных подходов
 * Возвращает список упражнений, где были установлены новые рекорды
 */
export async function updateRecordsFromWorkout(
  userId: string,
  workoutSessionId: string,
  exerciseSets: {
    exerciseId: string
    exerciseType: string
    sets: {
      weight?: number | null
      reps?: number | null
      duration?: number | null
    }[]
  }[]
): Promise<{ exerciseId: string; recordType: string }[]> {
  const supabase = createClient()
  const newRecords: { exerciseId: string; recordType: string }[] = []

  for (const exercise of exerciseSets) {
    if (exercise.sets.length === 0) continue

    const { exerciseId, exerciseType, sets } = exercise

    // Определяем тип упражнения
    const isDuration = exerciseType === 'duration'
    const isWeight = exerciseType === 'weight'

    // Получаем текущий рекорд
    const currentRecord = await getExerciseRecord(userId, exerciseId)

    let newMaxWeight: number | null = null
    let newMaxReps: number | null = null
    let newMaxDuration: number | null = null
    let hasNewRecord = false

    if (isDuration) {
      // Для упражнений на длительность - ищем максимальное время
      const maxDurationInSets = Math.max(
        ...sets
          .map((s) => s.duration)
          .filter((d): d is number => d !== null && d !== undefined)
      )

      if (
        maxDurationInSets > 0 &&
        (!currentRecord?.max_duration || maxDurationInSets > currentRecord.max_duration)
      ) {
        newMaxDuration = maxDurationInSets
        hasNewRecord = true
        newRecords.push({ exerciseId, recordType: 'duration' })

        // Записываем в историю
        await addRecordToHistory(userId, exerciseId, {
          duration: newMaxDuration,
          workout_session_id: workoutSessionId,
          notes: `New duration record: ${newMaxDuration}s`,
        })
      }
    } else if (isWeight) {
      // Для упражнений с весом - ищем максимальный вес и максимальные повторы при этом весе
      const maxWeightSet = sets.reduce<{ weight: number | null; reps: number | null }>((max, set) => {
        const weight = set.weight ?? 0
        const reps = set.reps ?? 0
        const maxWeight = max.weight ?? 0

        if (weight > maxWeight || (weight === maxWeight && reps > (max.reps ?? 0))) {
          return { weight: set.weight ?? null, reps: set.reps ?? null }
        }
        return max
      }, { weight: 0, reps: 0 })

      const maxWeight = maxWeightSet.weight ?? 0
      const repsAtMaxWeight = maxWeightSet.reps ?? 0

      if (
        maxWeight > 0 &&
        (!currentRecord?.max_weight ||
          maxWeight > currentRecord.max_weight ||
          (maxWeight === currentRecord.max_weight &&
            repsAtMaxWeight > (currentRecord.max_reps ?? 0)))
      ) {
        newMaxWeight = maxWeight
        newMaxReps = repsAtMaxWeight
        hasNewRecord = true
        newRecords.push({ exerciseId, recordType: 'weight' })

        // Записываем в историю
        await addRecordToHistory(userId, exerciseId, {
          weight: newMaxWeight,
          reps: newMaxReps,
          workout_session_id: workoutSessionId,
          notes: `New weight record: ${newMaxWeight}kg × ${newMaxReps} reps`,
        })
      }
    } else {
      // Для упражнений без веса (только повторы) - ищем максимальное количество повторений
      const maxRepsInSets = Math.max(
        ...sets.map((s) => s.reps).filter((r): r is number => r !== null && r !== undefined)
      )

      if (
        maxRepsInSets > 0 &&
        (!currentRecord?.max_reps || maxRepsInSets > currentRecord.max_reps)
      ) {
        newMaxReps = maxRepsInSets
        hasNewRecord = true
        newRecords.push({ exerciseId, recordType: 'reps' })

        // Записываем в историю
        await addRecordToHistory(userId, exerciseId, {
          reps: newMaxReps,
          workout_session_id: workoutSessionId,
          notes: `New reps record: ${newMaxReps} reps`,
        })
      }
    }

    // Обновляем рекорд, если есть новые значения
    if (hasNewRecord) {
      await updateExerciseRecord(userId, exerciseId, {
        max_weight: newMaxWeight ?? currentRecord?.max_weight ?? null,
        max_reps: newMaxReps ?? currentRecord?.max_reps ?? null,
        max_duration: newMaxDuration ?? currentRecord?.max_duration ?? null,
      })
    }
  }

  return newRecords
}

/**
 * Получить статистику пользователя
 */
export async function getUserStats(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('total_workouts, total_weight_lifted')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

/**
 * Обновить статистику пользователя после тренировки
 * @param userId - ID пользователя
 * @param totalVolume - Объем тренировки (вес × повторы)
 */
export async function updateUserStatsAfterWorkout(
  userId: string,
  totalVolume: number
) {
  const supabase = createClient()
  
  // Получаем текущую статистику
  const { data: currentUser } = await supabase
    .from('users')
    .select('total_workouts, total_weight_lifted')
    .eq('id', userId)
    .single()

  const currentWorkouts = currentUser?.total_workouts || 0
  const currentWeightLifted = currentUser?.total_weight_lifted || 0

  // Обновляем статистику
  const { data, error } = await supabase
    .from('users')
    .update({
      total_workouts: currentWorkouts + 1,
      total_weight_lifted: currentWeightLifted + totalVolume,
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  
  return {
    total_workouts: currentWorkouts + 1,
    total_weight_lifted: currentWeightLifted + totalVolume,
    volume_added: totalVolume,
  }
}

