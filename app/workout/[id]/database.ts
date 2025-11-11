import { createClient } from "@/lib/supabase/client"
import { getExerciseRecord, updateRecordsFromWorkout, updateUserStatsAfterWorkout } from "@/lib/supabase/queries"
import type { ExerciseData, DbExercise, CompletedSet, NewRecord } from "./types"
import { getExerciseKey } from "./utils"

export async function fetchWarmupExercises(): Promise<ExerciseData[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("exercises")
      .select("id, name, instructions, exercise_type, movement_pattern, muscle_group")
      .eq("exercise_type", "warmup")

    if (error) throw error

    return (data || []).map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.id,
      name: exercise.name,
      instructions: exercise.instructions || undefined,
      sets: null,
      exercise_type: exercise.exercise_type,
      movement_pattern: exercise.movement_pattern,
      muscle_group: exercise.muscle_group,
    }))
  } catch (error) {
    console.error("Error loading warmup exercises:", error)
    return []
  }
}

export async function fetchAllExercises(): Promise<DbExercise[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("exercises")
      .select("id, name, instructions, exercise_type, movement_pattern, muscle_group")
      .order("name")

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error loading exercises:", error)
    return []
  }
}

export async function enrichExercisesWithDbData(
  exercises: ExerciseData[]
): Promise<ExerciseData[]> {
  if (exercises.length === 0) return []

  try {
    const supabase = createClient()

    const knownExerciseIds = exercises
      .map((ex: ExerciseData) => ex.exerciseId)
      .filter((id): id is string => Boolean(id))

    const exercisesDataMap = new Map<string, DbExercise>()

    if (knownExerciseIds.length > 0) {
      const { data: exercisesData } = await supabase
        .from("exercises")
        .select("id, name, instructions, exercise_type, movement_pattern, muscle_group")
        .in("id", knownExerciseIds)

      exercisesData?.forEach((exercise) => {
        exercisesDataMap.set(exercise.id, exercise)
      })
    }

    const missingEntryIds = exercises
      .filter((ex) => !ex.exerciseId && ex.workoutEntryId)
      .map((ex) => ex.workoutEntryId!)

    if (missingEntryIds.length > 0) {
      const { data: workoutEntries } = await supabase
        .from("workout_set_exercises")
        .select("id, exercise_id")
        .in("id", missingEntryIds)

      if (workoutEntries && workoutEntries.length > 0) {
        const entryToExerciseId = new Map<string, string>()
        workoutEntries.forEach((entry) => {
          if (entry.exercise_id) {
            entryToExerciseId.set(entry.id, entry.exercise_id)
          }
        })

        const fallbackExerciseIds = Array.from(entryToExerciseId.values())

        if (fallbackExerciseIds.length > 0) {
          const { data: fallbackExercises } = await supabase
            .from("exercises")
            .select("id, name, instructions, exercise_type, movement_pattern, muscle_group")
            .in("id", fallbackExerciseIds)

          fallbackExercises?.forEach((exercise) => {
            exercisesDataMap.set(exercise.id, exercise)
          })

          exercises = exercises.map((ex) => {
            if (ex.exerciseId || !ex.workoutEntryId) {
              return ex
            }

            const resolvedId = entryToExerciseId.get(ex.workoutEntryId)
            if (!resolvedId) {
              return ex
            }

            return {
              ...ex,
              exerciseId: resolvedId,
            }
          })
        }
      }
    }

    return exercises.map((ex) => {
      const lookupId = ex.exerciseId ?? ex.id
      const dbExercise = lookupId ? exercisesDataMap.get(lookupId) : undefined

      return {
        ...ex,
        name: dbExercise?.name || ex.name,
        id: lookupId ?? ex.id,
        exerciseId: lookupId ?? ex.exerciseId ?? ex.id,
        instructions: dbExercise?.instructions || ex.instructions || undefined,
        exercise_type: dbExercise?.exercise_type || ex.exercise_type || "weight",
        movement_pattern: dbExercise?.movement_pattern || ex.movement_pattern,
        muscle_group: dbExercise?.muscle_group || ex.muscle_group,
      }
    })
  } catch (error) {
    console.error("Error loading exercises:", error)
    return exercises
  }
}

export async function saveWorkoutToDatabase(
  userId: string,
  exercises: ExerciseData[],
  completedSets: Record<string, CompletedSet[]>,
  startTime: number,
  totalTime: number
): Promise<{ success: boolean; newRecords: NewRecord[] }> {
  try {
    const supabase = createClient()

    // Calculate total volume
    const totalVolume = Object.values(completedSets).reduce((total, sets) => {
      return total + sets.reduce((sum, set) => {
        const w = set.weight ? parseFloat(set.weight) || 0 : 0
        const r = set.reps ? parseInt(set.reps, 10) || 0 : 0
        return sum + w * r
      }, 0)
    }, 0)

    // Create workout session
    const { data: workoutSession, error: sessionError } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: userId,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration: totalTime,
        total_volume: totalVolume,
        notes: `Total volume: ${totalVolume.toFixed(0)} kg`,
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Prepare data for updating records
    const exerciseSetsForRecords: {
      exerciseId: string
      exerciseType: string
      sets: {
        weight?: number | null
        reps?: number | null
        duration?: number | null
      }[]
    }[] = []

    // Add exercises and their sets
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i]
      const exerciseKey = getExerciseKey(exercise)
      const sets = completedSets[exerciseKey] || []
      const exerciseIdForDb = exercise?.exerciseId || exercise?.id || exerciseKey

      // Skip exercises without completed sets
      if (sets.length === 0) continue

      // Create exercise record in session
      const { data: sessionExercise, error: exerciseError } = await supabase
        .from("workout_session_exercises")
        .insert({
          workout_session_id: workoutSession.id,
          exercise_id: exerciseIdForDb,
          order_index: i,
        })
        .select()
        .single()

      if (exerciseError) throw exerciseError

      // Add sets for this exercise
      const setsData = sets.map((set) => {
        const weightValue =
          set.weight !== undefined && set.weight !== null ? parseFloat(set.weight) || null : null
        const repsValue =
          set.reps !== undefined && set.reps !== null ? parseInt(set.reps, 10) || null : null
        const durationValue =
          set.duration !== undefined && set.duration !== null ? parseInt(set.duration, 10) || null : null

        return {
          workout_session_exercise_id: sessionExercise.id,
          set_number: set.set,
          weight: weightValue,
          reps: repsValue,
          duration: durationValue,
          completed: true,
        }
      })

      const { error: setsError } = await supabase
        .from("workout_session_sets")
        .insert(setsData)

      if (setsError) throw setsError

      // Add data for updating records
      exerciseSetsForRecords.push({
        exerciseId: exerciseIdForDb,
        exerciseType: exercise.exercise_type || "weight",
        sets: setsData.map((s) => ({
          weight: s.weight,
          reps: s.reps,
          duration: s.duration,
        })),
      })
    }

    // Update personal records
    const newRecordsDisplay: NewRecord[] = []
    try {
      const recordsResult = await updateRecordsFromWorkout(
        userId,
        workoutSession.id,
        exerciseSetsForRecords
      )

      if (recordsResult.length > 0) {
        console.log("New records set:", recordsResult)

        // Format new records for display
        for (const record of recordsResult) {
          const exercise = exercises.find((ex) => (ex.exerciseId || ex.id) === record.exerciseId)

          if (!exercise) continue

          // Get updated record from DB
          const updatedRecord = await getExerciseRecord(userId, record.exerciseId)

          if (!updatedRecord) continue

          let value = ""
          if (record.recordType === "weight" && updatedRecord.max_weight && updatedRecord.max_reps) {
            value = `${updatedRecord.max_weight}kg×${updatedRecord.max_reps}`
          } else if (record.recordType === "duration" && updatedRecord.max_duration) {
            value = `${updatedRecord.max_duration}s`
          } else if (record.recordType === "reps" && updatedRecord.max_reps) {
            value = `${updatedRecord.max_reps} reps`
          }

          if (value) {
            newRecordsDisplay.push({
              exerciseId: record.exerciseId,
              exerciseName: exercise.name,
              recordType: record.recordType,
              value,
            })
          }
        }
      }
    } catch (recordError) {
      console.error("Error updating records:", recordError)
    }

    // Update user stats
    try {
      const updatedStats = await updateUserStatsAfterWorkout(userId, totalVolume)
      console.log("User stats updated:", updatedStats)
    } catch (statsError) {
      console.error("Error updating user stats:", statsError)
    }

    console.log("Workout saved successfully! Total volume:", totalVolume.toFixed(0), "kg")

    return { success: true, newRecords: newRecordsDisplay }
  } catch (error) {
    console.error("Error saving workout:", error)
    return { success: false, newRecords: [] }
  }
}

export async function loadUserStats(userId: string) {
  try {
    const supabase = createClient()
    const { data: userData } = await supabase
      .from("users")
      .select("total_workouts")
      .eq("id", userId)
      .single()

    return userData?.total_workouts || 0
  } catch (error) {
    console.error("Error loading user stats:", error)
    return 0
  }
}

