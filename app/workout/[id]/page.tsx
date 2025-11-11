"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { calculateSetSuggestion } from "@/lib/progression"
import { getExerciseRecord } from "@/lib/supabase/queries"
import type { SetSuggestion } from "@/lib/types/progression"

import { KeepAwake } from "./KeepAwake"
import { 
  fetchWarmupExercises, 
  enrichExercisesWithDbData, 
  saveWorkoutToDatabase,
  loadUserStats,
  fetchAllExercises 
} from "./database"
import { getExerciseKey, hasExerciseType, pickRandomWarmup } from "./utils"
import type { 
  WorkoutStage, 
  ExerciseData, 
  DbExercise, 
  CompletedSet, 
  NewRecord,
  WorkoutState
} from "./types"

import { WarmupStage } from "./WarmupStage"
import { ExerciseStage } from "./ExerciseStage"
import { RestStage } from "./RestStage"
import { AddExerciseStage } from "./AddExerciseStage"
import { FinishedStage } from "./FinishedStage"

export default function WorkoutSession() {
  const router = useRouter()
  const params = useParams()
  const workoutIdFromUrl = params.id as string

  // Load exercises from localStorage
  const loadExercises = (): ExerciseData[] => {
    if (typeof window === "undefined") return []
    const saved = localStorage.getItem("workoutExercises")
    if (!saved) return []
    try {
      return JSON.parse(saved)
    } catch {
      return []
    }
  }

  // Read warmup time from localStorage
  const getInitialWarmupTime = () => {
    if (typeof window === "undefined") return 599
    const savedMinutes = localStorage.getItem("workoutWarmupMinutes")
    return savedMinutes ? parseInt(savedMinutes) * 60 - 1 : 599
  }

  // Load saved workout state
  const loadWorkoutState = (): WorkoutState | null => {
    if (typeof window === "undefined") return null
    const saved = localStorage.getItem("workoutState")
    if (!saved) return null

    try {
      const state = JSON.parse(saved)
      const savedWorkoutId = localStorage.getItem("currentWorkoutId")
      if (savedWorkoutId !== workoutIdFromUrl) {
        console.log("Workout ID mismatch, ignoring saved state")
        return null
      }
      return state
    } catch {
      return null
    }
  }

  const [isMounted, setIsMounted] = useState(false)
  const [exercises, setExercises] = useState<ExerciseData[]>([])
  const [warmupExercise, setWarmupExercise] = useState<ExerciseData | null>(null)
  const [warmupExercisesPool, setWarmupExercisesPool] = useState<ExerciseData[]>([])
  const [stage, setStage] = useState<WorkoutStage>("warmup")
  const [currentExercise, setCurrentExercise] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [totalTime, setTotalTime] = useState(0)
  const [warmupTime, setWarmupTime] = useState(599)
  const [restTime, setRestTime] = useState(119)
  const [isWorkoutActive, setIsWorkoutActive] = useState(true)

  const [weight, setWeight] = useState("30")
  const [reps, setReps] = useState("10")
  const [duration, setDuration] = useState("30")
  const [isEditingWeight, setIsEditingWeight] = useState(false)
  const [isEditingReps, setIsEditingReps] = useState(false)
  const [isEditingDuration, setIsEditingDuration] = useState(false)
  const [isWarmupShuffleLoading, setIsWarmupShuffleLoading] = useState(false)
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<DbExercise[]>([])
  const [isLoadingExercises, setIsLoadingExercises] = useState(false)
  const [showExerciseList, setShowExerciseList] = useState(false)

  const [completedSets, setCompletedSets] = useState<Record<string, CompletedSet[]>>({})
  const [startTime, setStartTime] = useState<number>(0)
  const [totalWorkouts, setTotalWorkouts] = useState<number | null>(null)
  const [sessionWeight, setSessionWeight] = useState<number>(0)
  const [newRecords, setNewRecords] = useState<NewRecord[]>([])

  /**
   * Load suggestion for current exercise and set
   */
  const loadSuggestionForCurrentSet = async (
    exercise: ExerciseData,
    setNumber: number
  ) => {
    if (isLoadingSuggestion) return

    try {
      setIsLoadingSuggestion(true)

      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        console.log("No user session, using default values")
        return
      }

      const exerciseId = exercise.exerciseId || exercise.id
      const exerciseType = exercise.exercise_type || "weight"

      // Get user's record
      let record = null
      try {
        record = await getExerciseRecord(session.user.id, exerciseId)
      } catch (error) {
        console.log("No record found for exercise:", exerciseId)
      }

      // Calculate suggestion
      const suggestion: SetSuggestion = calculateSetSuggestion({
        exerciseId,
        exerciseType,
        setNumber,
        record,
      })

      // Apply suggestion to inputs
      if (suggestion.weight !== undefined) {
        setWeight(String(suggestion.weight))
      }
      if (suggestion.reps !== undefined) {
        setReps(String(suggestion.reps))
      }
      if (suggestion.duration !== undefined) {
        setDuration(String(suggestion.duration))
      }

      console.log(`Suggestion for set ${setNumber}:`, suggestion)
    } catch (error) {
      console.error("Error loading suggestion:", error)
    } finally {
      setIsLoadingSuggestion(false)
    }
  }

  const handleShuffleWarmup = async () => {
    if (isWarmupShuffleLoading) return

    setIsWarmupShuffleLoading(true)
    try {
      let pool = warmupExercisesPool

      if (pool.length <= 1) {
        const freshPool = await fetchWarmupExercises()
        setWarmupExercisesPool(freshPool)
        pool = freshPool
      }

      const nextWarmup = pickRandomWarmup(pool, warmupExercise?.id)
      if (nextWarmup) {
        setWarmupExercise(nextWarmup)
      }
    } finally {
      setIsWarmupShuffleLoading(false)
    }
  }

  const handleFetchAllExercises = async () => {
    if (isLoadingExercises) return

    setIsLoadingExercises(true)
    try {
      const data = await fetchAllExercises()
      setAvailableExercises(data)
      setShowExerciseList(true)
    } finally {
      setIsLoadingExercises(false)
    }
  }

  const addExerciseToWorkout = (exercise: DbExercise) => {
    const newExercise: ExerciseData = {
      id: exercise.id,
      exerciseId: exercise.id,
      workoutEntryId: null,
      name: exercise.name,
      sets: null,
      instructions: exercise.instructions || undefined,
      exercise_type: exercise.exercise_type,
      movement_pattern: exercise.movement_pattern,
      muscle_group: exercise.muscle_group,
    }

    setExercises([...exercises, newExercise])
    setCurrentExercise(exercises.length)
    setCurrentSet(1)
    setShowExerciseList(false)
    setStage("exercise-warmup")
  }

  // Load saved state after mounting (avoid hydration mismatch)
  useEffect(() => {
    const loadData = async () => {
      const savedWorkoutId = localStorage.getItem("currentWorkoutId")

      if (!savedWorkoutId || savedWorkoutId !== workoutIdFromUrl) {
        const hasExercises = localStorage.getItem("workoutExercises")
        if (!hasExercises) {
          console.log("No workout data found, redirecting to home")
          router.push("/")
          return
        }
        localStorage.setItem("currentWorkoutId", workoutIdFromUrl)
      }

      const savedState = loadWorkoutState()
      const loadedExerciseIds = savedState?.exercises || loadExercises()
      
      let normalizedExercises: ExerciseData[] = loadedExerciseIds.map((ex: ExerciseData) => {
        const hasStoredExerciseId = Boolean(ex.exerciseId)
        const workoutEntryId = ex.workoutEntryId ?? (!hasStoredExerciseId ? ex.id ?? null : null)
        const resolvedExerciseId = ex.exerciseId ?? null

        return {
          ...ex,
          workoutEntryId: workoutEntryId ?? null,
          exerciseId: resolvedExerciseId,
          exercise_type: ex.exercise_type || "weight",
          movement_pattern: ex.movement_pattern,
          muscle_group: ex.muscle_group,
        }
      })

      // Load warmup exercise from DB
      try {
        const warmupPool = await fetchWarmupExercises()
        setWarmupExercisesPool(warmupPool)
        if (warmupPool.length > 0) {
          const randomWarmup = pickRandomWarmup(warmupPool)
          if (randomWarmup) {
            setWarmupExercise(randomWarmup)
          }
        }
      } catch (error) {
        console.error("Error preparing warmup exercises:", error)
      }

      // Enrich exercises with DB data
      if (normalizedExercises.length > 0) {
        normalizedExercises = await enrichExercisesWithDbData(normalizedExercises)
      }

      setExercises(normalizedExercises)

      if (savedState) {
        setStage(savedState.stage || "warmup")
        setCurrentExercise(savedState.currentExercise || 0)
        setCurrentSet(savedState.currentSet || 1)
        setTotalTime(savedState.totalTime || 0)
        setWarmupTime(savedState.warmupTime || getInitialWarmupTime())
        setRestTime(savedState.restTime || 119)
        setIsWorkoutActive(savedState.isWorkoutActive ?? true)
        setWeight(savedState.weight || "30")
        setReps(savedState.reps || "10")
        setDuration(savedState.duration || "30")
        setCompletedSets(savedState.completedSets || {})
        setStartTime(savedState.startTime || Date.now())
        setShowExerciseList(savedState.showExerciseList || false)
        setAvailableExercises(savedState.availableExercises || [])
      } else {
        setWarmupTime(getInitialWarmupTime())
        setStartTime(Date.now())
      }

      setIsMounted(true)
    }

    loadData()
  }, [workoutIdFromUrl, router])

  // Save workout state on every change
  useEffect(() => {
    if (!isMounted) return

    const workoutState: WorkoutState = {
      workoutId: workoutIdFromUrl,
      stage,
      currentExercise,
      currentSet,
      totalTime,
      warmupTime,
      restTime,
      isWorkoutActive,
      weight,
      reps,
      duration,
      completedSets,
      exercises,
      startTime,
      showExerciseList,
      availableExercises,
    }
    localStorage.setItem("workoutState", JSON.stringify(workoutState))
  }, [
    isMounted,
    workoutIdFromUrl,
    stage,
    currentExercise,
    currentSet,
    totalTime,
    warmupTime,
    restTime,
    isWorkoutActive,
    weight,
    reps,
    duration,
    completedSets,
    exercises,
    startTime,
    showExerciseList,
    availableExercises,
  ])

  // Total time timer
  useEffect(() => {
    if (!isWorkoutActive) return

    const interval = setInterval(() => {
      setTotalTime((prev: number) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isWorkoutActive])

  // Warmup and rest timers
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (stage === "warmup" && warmupTime > 0) {
      interval = setInterval(() => {
        setWarmupTime((prev: number) => prev - 1)
      }, 1000)
    }

    if (stage === "rest" && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev: number) => prev - 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [stage, warmupTime, restTime])

  // Reset editing states when exercise type doesn't support them
  useEffect(() => {
    const exercise = exercises[currentExercise]
    if (!exercise) return

    const exerciseType = exercise.exercise_type || "weight"

    if (exerciseType !== "weight" && isEditingWeight) {
      setIsEditingWeight(false)
    }

    if (exerciseType === "duration") {
      if (isEditingReps) {
        setIsEditingReps(false)
      }
    } else if (isEditingDuration) {
      setIsEditingDuration(false)
    }
  }, [currentExercise, exercises, isEditingWeight, isEditingReps, isEditingDuration])

  // Load suggestions when exercise or set changes
  useEffect(() => {
    const exercise = exercises[currentExercise]
    if (!exercise) return

    if (stage === "exercise-warmup" || stage === "working-set") {
      loadSuggestionForCurrentSet(exercise, currentSet)
    }
  }, [currentExercise, currentSet, stage, exercises])

  // Load stats on finished stage
  useEffect(() => {
    if (stage !== "finished" || !isMounted) return

    const loadStats = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const workouts = await loadUserStats(session.user.id)
          setTotalWorkouts(workouts)
        }

        const weight = Object.values(completedSets).reduce((total, sets) => {
          return (
            total +
            sets.reduce((sum, set) => {
              const w = set.weight ? parseFloat(set.weight) || 0 : 0
              const r = set.reps ? parseInt(set.reps, 10) || 0 : 0
              return sum + w * r
            }, 0)
          )
        }, 0)

        setSessionWeight(weight)
      } catch (error) {
        console.error("Error loading stats:", error)
      }
    }

    loadStats()
  }, [stage, completedSets, isMounted])

  const recordCompletedSet = (exerciseOverride?: ExerciseData | null) => {
    const exerciseData = exerciseOverride ?? exercises[currentExercise]
    if (!exerciseData) return

    const exerciseKey = getExerciseKey(exerciseData)
    if (!exerciseKey) return

    const isDurationExercise = hasExerciseType(exerciseData, "duration")
    const isWeightExercise = hasExerciseType(exerciseData, "weight")

    if (isDurationExercise) {
      const durationValue = parseInt(duration || "0", 10)
      if (!durationValue) return

      const durationSet: CompletedSet = {
        set: currentSet,
        duration,
      }

      setCompletedSets((prev) => ({
        ...prev,
        [exerciseKey]: [...(prev[exerciseKey] || []), durationSet],
      }))

      setIsEditingDuration(false)
      setIsEditingWeight(false)
      setIsEditingReps(false)

      return
    }

    const repsValue = parseInt(reps || "0", 10)
    const weightValue = isWeightExercise ? parseFloat(weight || "0") : 0

    if (!repsValue && (!isWeightExercise || !weightValue)) {
      return
    }

    const nextSet: CompletedSet = {
      set: currentSet,
      reps,
    }

    if (isWeightExercise) {
      nextSet.weight = weight
    }

    setCompletedSets((prev) => ({
      ...prev,
      [exerciseKey]: [...(prev[exerciseKey] || []), nextSet],
    }))

    setIsEditingDuration(false)
    setIsEditingWeight(false)
    setIsEditingReps(false)
  }

  const finishWorkout = async () => {
    // Save current values if non-zero
    if (stage === "exercise-warmup" || stage === "working-set") {
      const currentExerciseData = exercises[currentExercise]
      const isDurationExercise = hasExerciseType(currentExerciseData, "duration")
      const isWeightExercise = hasExerciseType(currentExerciseData, "weight")
      const hasDuration = parseInt(duration || "0", 10) > 0
      const hasReps = parseInt(reps || "0", 10) > 0
      const hasWeight = isWeightExercise ? parseFloat(weight || "0") > 0 : false

      if ((isDurationExercise && hasDuration) || (!isDurationExercise && (hasReps || hasWeight))) {
        recordCompletedSet(currentExerciseData)
      }
    }

    setIsWorkoutActive(false)
    setStage("finished")

    // Save workout to DB
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      const result = await saveWorkoutToDatabase(
        session.user.id,
        exercises,
        completedSets,
        startTime,
        totalTime
      )

      if (result.success) {
        setNewRecords(result.newRecords)

        // Reload stats
        const workouts = await loadUserStats(session.user.id)
        setTotalWorkouts(workouts)
      }
    }

    // Clear saved state
    localStorage.removeItem("workoutState")
    localStorage.removeItem("currentWorkoutId")
  }

  const cancelWorkout = () => {
    setIsWorkoutActive(false)
    setIsMounted(false)

    if (typeof window !== "undefined") {
      localStorage.removeItem("workoutState")
      localStorage.removeItem("currentWorkoutId")
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  const handleCompleteSet = () => {
    recordCompletedSet()
    setCurrentSet(currentSet + 1)
    setStage("rest")
  }

  const handleNextExercise = () => {
    recordCompletedSet()

    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1)
      setCurrentSet(1)
      setStage("exercise-warmup")
    } else {
      setStage("add-exercise-prompt")
    }
  }

  const handleSkipRest = () => {
    setStage("working-set")
    setRestTime(119)
  }

  // Show loading until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="text-[20px] text-[rgba(0,0,0,0.3)]">Loading...</div>
      </div>
    )
  }

  // Component to keep screen awake during workout
  const keepAwakeComponent = <KeepAwake enabled={isWorkoutActive} />

  // Warmup Stage
  if (stage === "warmup") {
    const canShuffleWarmup = warmupExercisesPool.length > (warmupExercise ? 1 : 0)

    return (
      <>
        {keepAwakeComponent}
        <WarmupStage
          totalTime={totalTime}
          warmupTime={warmupTime}
          warmupExercise={warmupExercise}
          canShuffle={canShuffleWarmup}
          isShuffleLoading={isWarmupShuffleLoading}
          onCancel={cancelWorkout}
          onFinish={finishWorkout}
          onShuffle={handleShuffleWarmup}
          onNext={() => setStage("exercise-warmup")}
        />
      </>
    )
  }

  // Exercise Warmup Stage
  if (stage === "exercise-warmup") {
    const currentExerciseData = exercises[currentExercise]

    if (!currentExerciseData) {
      finishWorkout()
      return null
    }

    return (
      <>
        {keepAwakeComponent}
        <ExerciseStage
        totalTime={totalTime}
        exercise={currentExerciseData}
        currentSet={currentSet}
        weight={weight}
        reps={reps}
        duration={duration}
        isEditingWeight={isEditingWeight}
        isEditingReps={isEditingReps}
        isEditingDuration={isEditingDuration}
        onCancel={cancelWorkout}
        onFinish={finishWorkout}
        onWeightChange={setWeight}
        onRepsChange={setReps}
        onDurationChange={setDuration}
        onEditingWeightChange={setIsEditingWeight}
        onEditingRepsChange={setIsEditingReps}
        onEditingDurationChange={setIsEditingDuration}
        onCompleteSet={handleCompleteSet}
        onSkipSet={() => {}}
        onNextExercise={handleNextExercise}
      />
      </>
    )
  }

  // Rest Stage
  if (stage === "rest") {
    return (
      <>
        {keepAwakeComponent}
        <RestStage totalTime={totalTime} restTime={restTime} onSkip={handleSkipRest} />
      </>
    )
  }

  // Working Set Stage
  if (stage === "working-set") {
    const currentExerciseData = exercises[currentExercise]

    if (!currentExerciseData) {
      finishWorkout()
      return null
    }

    return (
      <>
        {keepAwakeComponent}
        <ExerciseStage
        totalTime={totalTime}
        exercise={currentExerciseData}
        currentSet={currentSet}
        weight={weight}
        reps={reps}
        duration={duration}
        isEditingWeight={isEditingWeight}
        isEditingReps={isEditingReps}
        isEditingDuration={isEditingDuration}
        onCancel={cancelWorkout}
        onFinish={finishWorkout}
        onWeightChange={setWeight}
        onRepsChange={setReps}
        onDurationChange={setDuration}
        onEditingWeightChange={setIsEditingWeight}
        onEditingRepsChange={setIsEditingReps}
        onEditingDurationChange={setIsEditingDuration}
        onCompleteSet={handleCompleteSet}
        onSkipSet={() => {}}
        onNextExercise={handleNextExercise}
      />
      </>
    )
  }

  // Add Exercise Prompt Stage
  if (stage === "add-exercise-prompt") {
    return (
      <>
        {keepAwakeComponent}
        <AddExerciseStage
        totalTime={totalTime}
        availableExercises={availableExercises}
        isLoadingExercises={isLoadingExercises}
        showExerciseList={showExerciseList}
        onCancel={cancelWorkout}
        onBack={() => setShowExerciseList(false)}
        onLoadExercises={handleFetchAllExercises}
        onSelectExercise={addExerciseToWorkout}
        onFinish={finishWorkout}
      />
      </>
    )
  }

  // Finished Stage
  if (stage === "finished") {
    return (
      <FinishedStage
        totalTime={totalTime}
        totalWorkouts={totalWorkouts}
        sessionWeight={sessionWeight}
        newRecords={newRecords}
      />
    )
  }

  return null
}

