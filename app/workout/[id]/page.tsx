"use client"

import { useState, useEffect, ChangeEvent, useRef, FocusEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { calculateSetSuggestion } from "@/lib/progression"
import { getExerciseRecord } from "@/lib/supabase/queries"
import type { SetSuggestion } from "@/lib/types/progression"

type SupabaseClientType = ReturnType<typeof createClient>

type WorkoutStage = "warmup" | "exercise-warmup" | "working-set" | "rest" | "add-exercise-prompt" | "finished"

type ExerciseData = {
  id: string
  exerciseId?: string | null
  workoutEntryId?: string | null
  name: string
  sets: number | null
  instructions?: string
  tags?: string[] | null
}

type DbExercise = {
  id: string
  name: string
  instructions: string | null
  tags: string[] | null
}

type CompletedSet = {
  set: number
  weight?: string | null
  reps?: string | null
  duration?: string | null
}

export default function WorkoutSession() {
  const router = useRouter()

  // Загружаем упражнения из localStorage
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

  // Читаем время разминки из localStorage
  const getInitialWarmupTime = () => {
    if (typeof window === "undefined") return 599
    const savedMinutes = localStorage.getItem("workoutWarmupMinutes")
    return savedMinutes ? parseInt(savedMinutes) * 60 - 1 : 599
  }

  // Загружаем сохраненное состояние тренировки
  const loadWorkoutState = () => {
    if (typeof window === "undefined") return null
    const saved = localStorage.getItem("workoutState")
    return saved ? JSON.parse(saved) : null
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
  
  // История выполненных подходов: { exerciseId: [{ set: 1, weight: "30", reps: "10" }, ...] }
  const [completedSets, setCompletedSets] = useState<Record<string, CompletedSet[]>>({})
  
  // Время начала тренировки
  const [startTime, setStartTime] = useState<number>(0)
  
  // Статистика для финального экрана
  const [totalWorkouts, setTotalWorkouts] = useState<number | null>(null)
  const [sessionWeight, setSessionWeight] = useState<number>(0)

  const weightInputRef = useRef<HTMLInputElement | null>(null)
  const repsInputRef = useRef<HTMLInputElement | null>(null)
  const durationInputRef = useRef<HTMLInputElement | null>(null)
  const lastScrollYRef = useRef<number | null>(null)

  const getExerciseKey = (exercise?: ExerciseData | null) => {
    if (!exercise) return ""
    return exercise.workoutEntryId || exercise.id
  }

  const hasTag = (exercise: ExerciseData | null | undefined, tag: string) => {
    if (!exercise?.tags || exercise.tags.length === 0) return false
    return exercise.tags.includes(tag)
  }

  /**
   * Загрузить suggestion для текущего упражнения и подхода
   */
  const loadSuggestionForCurrentSet = async (
    exercise: ExerciseData,
    setNumber: number
  ) => {
    if (isLoadingSuggestion) return
    
    try {
      setIsLoadingSuggestion(true)
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        console.log('No user session, using default values')
        return
      }

      const exerciseId = exercise.exerciseId || exercise.id
      const exerciseTags = Array.isArray(exercise.tags) ? exercise.tags : []
      
      // Получаем рекорд пользователя
      let record = null
      try {
        record = await getExerciseRecord(session.user.id, exerciseId)
      } catch (error) {
        console.log('No record found for exercise:', exerciseId)
      }

      // Рассчитываем suggestion
      const suggestion: SetSuggestion = calculateSetSuggestion({
        exerciseId,
        exerciseTags,
        setNumber,
        record,
      })

      // Применяем suggestion к инпутам
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
      console.error('Error loading suggestion:', error)
    } finally {
      setIsLoadingSuggestion(false)
    }
  }

  const pickRandomWarmup = (pool: ExerciseData[], excludeId?: string) => {
    if (pool.length === 0) return null
    const available = excludeId ? pool.filter((exercise) => exercise.id !== excludeId) : pool
    if (available.length === 0) {
      const fallback = pool.find((exercise) => exercise.id === excludeId)
      return fallback ?? pool[0]
    }
    const randomIndex = Math.floor(Math.random() * available.length)
    return available[randomIndex]
  }

  const fetchWarmupExercises = async (client?: SupabaseClientType) => {
    try {
      const supabase = client ?? createClient()
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, instructions, tags")
        .contains("tags", ["warm"])

      if (error) throw error

      return (data || []).map((exercise) => ({
        id: exercise.id,
        exerciseId: exercise.id,
        name: exercise.name,
        instructions: exercise.instructions || undefined,
        sets: null,
        tags: Array.isArray(exercise.tags) ? exercise.tags : [],
      }))
    } catch (error) {
      console.error("Error loading warmup exercises:", error)
      return []
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

  const fetchAllExercises = async () => {
    if (isLoadingExercises) return
    
    setIsLoadingExercises(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, instructions, tags")
        .order("name")

      if (error) throw error

      setAvailableExercises(data || [])
      setShowExerciseList(true)
    } catch (error) {
      console.error("Error loading exercises:", error)
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
      tags: Array.isArray(exercise.tags) ? exercise.tags : [],
    }

    setExercises([...exercises, newExercise])
    setCurrentExercise(exercises.length)
    setCurrentSet(1)
    setShowExerciseList(false)
    setStage("exercise-warmup")
  }

  // Загружаем сохраненное состояние после монтирования (избегаем hydration mismatch)
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const savedState = loadWorkoutState()
      const loadedExerciseIds = savedState?.exercises || loadExercises()
      let normalizedExercises: ExerciseData[] = loadedExerciseIds.map((ex: ExerciseData) => {
        const hasStoredExerciseId = Boolean(ex.exerciseId)
        const workoutEntryId = ex.workoutEntryId ?? (!hasStoredExerciseId ? ex.id ?? null : null)
        const resolvedExerciseId = ex.exerciseId ?? null
        const tags = Array.isArray(ex.tags) ? ex.tags : []

        return {
          ...ex,
          workoutEntryId: workoutEntryId ?? null,
          exerciseId: resolvedExerciseId,
          tags,
        }
      })
      
      // Загружаем warmup упражнение из БД
      try {
        const warmupPool = await fetchWarmupExercises(supabase)
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

      // Загружаем полные данные упражнений из БД
      if (normalizedExercises.length > 0) {
        try {
          const knownExerciseIds = normalizedExercises
            .map((ex: ExerciseData) => ex.exerciseId)
            .filter((id): id is string => Boolean(id))

          const exercisesDataMap = new Map<string, DbExercise>()

          if (knownExerciseIds.length > 0) {
            const { data: exercisesData } = await supabase
              .from("exercises")
              .select("id, name, instructions, tags")
              .in("id", knownExerciseIds)

            exercisesData?.forEach((exercise) => {
              exercisesDataMap.set(exercise.id, exercise)
            })
          }

          const missingEntryIds = normalizedExercises
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
                  .select("id, name, instructions, tags")
                  .in("id", fallbackExerciseIds)

                fallbackExercises?.forEach((exercise) => {
                  exercisesDataMap.set(exercise.id, exercise)
                })

                normalizedExercises = normalizedExercises.map((ex) => {
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

          const enrichedExercises = normalizedExercises.map((ex) => {
            const lookupId = ex.exerciseId ?? ex.id
            const dbExercise = lookupId ? exercisesDataMap.get(lookupId) : undefined

            return {
              ...ex,
              id: lookupId ?? ex.id,
              exerciseId: lookupId ?? ex.exerciseId ?? ex.id,
              instructions: dbExercise?.instructions || ex.instructions || undefined,
              tags: Array.isArray(dbExercise?.tags)
                ? dbExercise?.tags
                : Array.isArray(ex.tags)
                  ? ex.tags
                  : [],
            }
          })

          setExercises(enrichedExercises)
        } catch (error) {
          console.error("Error loading exercises:", error)
          setExercises(normalizedExercises)
        }
      } else {
        setExercises([])
      }
      
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
        // Новая тренировка
        setWarmupTime(getInitialWarmupTime())
        setStartTime(Date.now())
      }
      
      setIsMounted(true)
    }
    
    loadData()
  }, [])

  // Сохраняем состояние тренировки при каждом изменении
  useEffect(() => {
    if (!isMounted) return // Не сохраняем до полной загрузки
    
    const workoutState = {
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
  }, [isMounted, stage, currentExercise, currentSet, totalTime, warmupTime, restTime, isWorkoutActive, weight, reps, duration, completedSets, exercises, startTime, showExerciseList, availableExercises])

  useEffect(() => {
    if (!isWorkoutActive) return

    const interval = setInterval(() => {
      setTotalTime((prev: number) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isWorkoutActive])

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleNumericInput =
    (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
      const cleanedValue = event.target.value.replace(/\D/g, "")
      setter(cleanedValue)
    }

  const ensureInputVisible = (input: HTMLInputElement | null) => {
    if (!input || typeof window === "undefined") return

    const visualViewport = window.visualViewport
    const viewportHeight = visualViewport?.height ?? window.innerHeight
    const viewportOffsetTop = visualViewport?.offsetTop ?? 0
    const keyboardPadding = 96
    const topPadding = 24

    const prefersCenteredScroll = Boolean(
      visualViewport && typeof visualViewport.height === "number" && visualViewport.height < window.innerHeight,
    )

    const rect = input.getBoundingClientRect()

    if (prefersCenteredScroll) {
      input.scrollIntoView({
        block: "center",
        behavior: "smooth",
      })
    } else if (rect.bottom > viewportHeight - keyboardPadding) {
      const offset = rect.bottom - (viewportHeight - keyboardPadding)
      window.scrollTo({
        top: window.scrollY + offset,
        behavior: "smooth",
      })
    } else if (rect.top < viewportOffsetTop + topPadding) {
      const offset = rect.top - (viewportOffsetTop + topPadding)
      window.scrollTo({
        top: window.scrollY + offset,
        behavior: "smooth",
      })
    }

    if (visualViewport) {
      const handleViewportChange = () => {
        input.scrollIntoView({
          block: "center",
          behavior: "smooth",
        })
      }

      visualViewport.addEventListener("resize", handleViewportChange, { once: true })
    }
  }

  const focusEditableInput = (input: HTMLInputElement | null) => {
    if (!input) return
    if (typeof window !== "undefined") {
      lastScrollYRef.current = window.scrollY
    }

    try {
      input.focus({ preventScroll: true })
    } catch {
      input.focus()
    }

    requestAnimationFrame(() => {
      input.select()
    })

    window.setTimeout(() => {
      ensureInputVisible(input)
    }, 50)
  }

  useEffect(() => {
    if (isEditingWeight) {
      focusEditableInput(weightInputRef.current)
    }
  }, [isEditingWeight])

  useEffect(() => {
    if (isEditingReps) {
      focusEditableInput(repsInputRef.current)
    }
  }, [isEditingReps])

  useEffect(() => {
    if (isEditingDuration) {
      focusEditableInput(durationInputRef.current)
    }
  }, [isEditingDuration])

  useEffect(() => {
    const exercise = exercises[currentExercise]
    if (!exercise) return

    const tags = Array.isArray(exercise.tags) ? exercise.tags : []

    if (!tags.includes("weight") && isEditingWeight) {
      setIsEditingWeight(false)
    }

    if (tags.includes("duration")) {
      if (isEditingReps) {
        setIsEditingReps(false)
      }
    } else if (isEditingDuration) {
      setIsEditingDuration(false)
    }
  }, [currentExercise, exercises, isEditingWeight, isEditingReps, isEditingDuration])

  // Загружаем suggestions при смене упражнения или подхода
  useEffect(() => {
    const exercise = exercises[currentExercise]
    if (!exercise) return
    
    // Загружаем suggestion только когда находимся на стадии упражнения
    if (stage === "exercise-warmup" || stage === "working-set") {
      loadSuggestionForCurrentSet(exercise, currentSet)
    }
  }, [currentExercise, currentSet, stage, exercises])

  // Статистика для общего веса за все время
  const [totalLifetimeWeight, setTotalLifetimeWeight] = useState<number | null>(null)
  
  // Загружаем статистику при переходе на финальный экран
  useEffect(() => {
    if (stage !== "finished" || !isMounted) return

    const loadStats = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Получаем статистику пользователя из таблицы users
          const { data: userData } = await supabase
            .from("users")
            .select("total_workouts, total_weight_lifted")
            .eq("id", session.user.id)
            .single()

          if (userData) {
            setTotalWorkouts(userData.total_workouts || 0)
            setTotalLifetimeWeight(userData.total_weight_lifted || 0)
          }
        }

        // Подсчитываем вес текущей тренировки
        const weight = Object.values(completedSets).reduce((total, sets) => {
          return total + sets.reduce((sum, set) => {
            const w = set.weight ? parseFloat(set.weight) || 0 : 0
            const r = set.reps ? parseInt(set.reps, 10) || 0 : 0
            return sum + w * r
          }, 0)
        }, 0)

        setSessionWeight(weight)
      } catch (error) {
        console.error("Error loading stats:", error)
      }
    }

    loadStats()
  }, [stage, completedSets, isMounted])

  const handleInputFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (typeof window !== "undefined") {
      lastScrollYRef.current = window.scrollY
    }

    requestAnimationFrame(() => {
      event.target.select()
    })

    window.setTimeout(() => {
      ensureInputVisible(event.target)
    }, 50)
  }

  const handleInputBlur = (setter: (value: boolean) => void) => () => {
    setter(false)

    window.setTimeout(() => {
      if (typeof window === "undefined") return
      if (
        typeof document !== "undefined" &&
        (document.activeElement === weightInputRef.current ||
          document.activeElement === repsInputRef.current ||
          document.activeElement === durationInputRef.current)
      ) {
        return
      }
      if (lastScrollYRef.current === null) return

      window.scrollTo({
        top: lastScrollYRef.current,
        behavior: "smooth",
      })

      lastScrollYRef.current = null
    }, 180)
  }

  const isEditingValues = isEditingWeight || isEditingReps || isEditingDuration
  const bottomWrapperClasses = `${
    isEditingValues ? "relative" : "fixed bottom-[10px]"
  } left-0 right-0 flex justify-center pointer-events-none z-50`
  const canShuffleWarmup = warmupExercisesPool.length > (warmupExercise ? 1 : 0)
  const warmupDetailsText = warmupExercise
    ? `${warmupExercise.name}${warmupExercise.instructions ? `\n${warmupExercise.instructions}` : ""}`
    : "Warm-up exercise not found"

  const resetInputsToZero = () => {
    setWeight("0")
    setReps("0")
    setDuration("0")
    setIsEditingWeight(false)
    setIsEditingReps(false)
    setIsEditingDuration(false)

    if (weightInputRef.current) {
      weightInputRef.current.blur()
    }
    if (repsInputRef.current) {
      repsInputRef.current.blur()
    }
    if (durationInputRef.current) {
      durationInputRef.current.blur()
    }
  }

  const recordCompletedSet = (exerciseOverride?: ExerciseData | null) => {
    const exerciseData = exerciseOverride ?? exercises[currentExercise]
    if (!exerciseData) return

    const exerciseKey = getExerciseKey(exerciseData)
    if (!exerciseKey) return

    const isDurationExercise = hasTag(exerciseData, "duration")
    const isWeightExercise = hasTag(exerciseData, "weight")

    if (isDurationExercise) {
      const durationValue = parseInt(duration || "0", 10)
      if (!durationValue) {
        return
      }

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

  const renderExerciseControls = (exerciseData: ExerciseData) => {
    const isDurationExercise = hasTag(exerciseData, "duration")
    const isWeightExercise = hasTag(exerciseData, "weight")

    return (
      <div className={bottomWrapperClasses}>
        <div className="w-full max-w-md px-[10px] pointer-events-auto relative">
          <div
            className="absolute inset-x-0 bottom-0 h-[250px] -z-10 pointer-events-none"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
            }}
          />

          {isDurationExercise ? (
            <div className="mb-3">
              {isEditingDuration ? (
                <input
                  type="text"
                  value={duration}
                  onChange={handleNumericInput(setDuration)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur(setIsEditingDuration)}
                  ref={durationInputRef}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full bg-[#ffffff] text-[#000000] py-5 px-6 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] outline-none text-center"
                />
              ) : (
                <button
                  onClick={() => setIsEditingDuration(true)}
                  className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)]"
                >
                  {duration} sec
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-[5px] mb-3">
              {isWeightExercise && (
                <div className="flex-1">
                  {isEditingWeight ? (
                    <input
                      type="text"
                      value={weight}
                      onChange={handleNumericInput(setWeight)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur(setIsEditingWeight)}
                      ref={weightInputRef}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full bg-[#ffffff] text-[#000000] py-5 px-6 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] outline-none text-center"
                    />
                  ) : (
                    <button
                      onClick={() => setIsEditingWeight(true)}
                      className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)]"
                    >
                      {weight} kg
                    </button>
                  )}
                </div>
              )}

              <div className="flex-1">
                {isEditingReps ? (
                  <input
                    type="text"
                    value={reps}
                    onChange={handleNumericInput(setReps)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur(setIsEditingReps)}
                    ref={repsInputRef}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-full bg-[#ffffff] text-[#000000] py-5 px-6 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] outline-none text-center"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingReps(true)}
                    className="w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)]"
                  >
                    {reps} times
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-[5px]">
            <button
              onClick={resetInputsToZero}
              className="w-[64px] h-[64px] rounded-full bg-[#ffffff] border border-[rgba(0,0,0,0.1)] text-[#000000] flex items-center justify-center hover:bg-[rgba(0,0,0,0.02)]"
              aria-label="Skip set"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={() => {
                recordCompletedSet(exerciseData)

                setCurrentSet(currentSet + 1)
                setStage("rest")
              }}
              className="flex-1 bg-[#ff2f00] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90"
            >
              one more
            </button>
            <button
              onClick={() => {
                recordCompletedSet(exerciseData)

                // Проверяем, есть ли еще упражнения
                if (currentExercise < exercises.length - 1) {
                  setCurrentExercise(currentExercise + 1)
                  setCurrentSet(1)
                  setStage("exercise-warmup")
                } else {
                  // Если это последнее упражнение, показываем экран добавления упражнения
                  setStage("add-exercise-prompt")
                }
              }}
              className="w-[64px] h-[64px] rounded-full bg-[#000000] text-[#ffffff] flex items-center justify-center hover:opacity-90"
              aria-label="Next exercise"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Функция для перезагрузки статистики после сохранения
  const reloadUserStats = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Получаем обновленную статистику пользователя из таблицы users
        const { data: userData } = await supabase
          .from("users")
          .select("total_workouts, total_weight_lifted")
          .eq("id", session.user.id)
          .single()

        if (userData) {
          setTotalWorkouts(userData.total_workouts || 0)
          setTotalLifetimeWeight(userData.total_weight_lifted || 0)
          console.log("Stats reloaded:", userData)
        }
      }
    } catch (error) {
      console.error("Error reloading stats:", error)
    }
  }

  // Функция сохранения тренировки в БД
  const saveWorkoutToDatabase = async () => {
    try {
      const supabase = createClient()
      
      // Получаем текущего пользователя
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        console.error("User not logged in")
        return
      }

      // Подсчитываем общий объем (вес × повторы для всех подходов)
      const totalVolume = Object.values(completedSets).reduce((total, sets) => {
        return total + sets.reduce((sum, set) => {
          const w = set.weight ? parseFloat(set.weight) || 0 : 0
          const r = set.reps ? parseInt(set.reps, 10) || 0 : 0
          return sum + w * r
        }, 0)
      }, 0)

      // Создаем workout session
      const { data: workoutSession, error: sessionError } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: session.user.id,
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          duration: totalTime,
          total_volume: totalVolume,
          notes: `Total volume: ${totalVolume.toFixed(0)} kg`,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Подготавливаем данные для обновления рекордов
      const exerciseSetsForRecords: {
        exerciseId: string
        exerciseTags: string[]
        sets: {
          weight?: number | null
          reps?: number | null
          duration?: number | null
        }[]
      }[] = []

      // Добавляем упражнения и их подходы
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i]
        const exerciseKey = getExerciseKey(exercise)
        const sets = completedSets[exerciseKey] || []
        const exerciseIdForDb = exercise?.exerciseId || exercise?.id || exerciseKey
        
        // Пропускаем упражнения без выполненных подходов
        if (sets.length === 0) continue

        // Создаем запись упражнения в сессии
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

        // Добавляем подходы для этого упражнения
        const setsData = sets.map(set => {
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

        // Добавляем данные для обновления рекордов
        exerciseSetsForRecords.push({
          exerciseId: exerciseIdForDb,
          exerciseTags: exercise.tags || [],
          sets: setsData.map(s => ({
            weight: s.weight,
            reps: s.reps,
            duration: s.duration,
          }))
        })
      }

      // Обновляем личные рекорды
      try {
        const { updateRecordsFromWorkout } = await import("@/lib/supabase/queries")
        const newRecords = await updateRecordsFromWorkout(
          session.user.id,
          workoutSession.id,
          exerciseSetsForRecords
        )
        
        if (newRecords.length > 0) {
          console.log("New records set:", newRecords)
        }
      } catch (recordError) {
        console.error("Error updating records:", recordError)
        // Не прерываем выполнение, даже если не удалось обновить рекорды
      }

      // Обновляем статистику пользователя (total_workouts и total_weight_lifted)
      try {
        const { updateUserStatsAfterWorkout } = await import("@/lib/supabase/queries")
        const updatedStats = await updateUserStatsAfterWorkout(session.user.id, totalVolume)
        console.log("User stats updated:", updatedStats)
        
        // Перезагружаем статистику на UI
        await reloadUserStats()
      } catch (statsError) {
        console.error("Error updating user stats:", statsError)
      }

      console.log("Workout saved successfully! Total volume:", totalVolume.toFixed(0), "kg")
    } catch (error) {
      console.error("Error saving workout:", error)
    }
  }

  const finishWorkout = async () => {
    // Если есть текущие введенные значения (не нулевые), сохраняем их
    if (stage === "exercise-warmup" || stage === "working-set") {
      const currentExerciseData = exercises[currentExercise]
      const isDurationExercise = hasTag(currentExerciseData, "duration")
      const isWeightExercise = hasTag(currentExerciseData, "weight")
      const hasDuration = parseInt(duration || "0", 10) > 0
      const hasReps = parseInt(reps || "0", 10) > 0
      const hasWeight = isWeightExercise ? parseFloat(weight || "0") > 0 : false

      if ((isDurationExercise && hasDuration) || (!isDurationExercise && (hasReps || hasWeight))) {
        recordCompletedSet(currentExerciseData)
      }
    }

    setIsWorkoutActive(false)
    setStage("finished")
    
    // Сохраняем тренировку в БД
    await saveWorkoutToDatabase()
    
    // Очищаем сохраненное состояние тренировки
    localStorage.removeItem("workoutState")
  }

  const skipRest = () => {
    setStage("working-set")
    setRestTime(119)
  }

  const cancelWorkout = () => {
    setIsWorkoutActive(false)
    setIsMounted(false)

    if (typeof window !== "undefined") {
      localStorage.removeItem("workoutState")
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  // Показываем загрузку до монтирования компонента
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="text-[20px] text-[rgba(0,0,0,0.3)]">Loading...</div>
      </div>
    )
  }

  // Warmup Stage
  if (stage === "warmup") {
    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
            <span className="text-[#000000]">{formatTime(totalTime)}</span>
            <div className="flex items-center gap-3">
              <button onClick={cancelWorkout} className="text-[#000000]">
                cancel
              </button>
              <button onClick={finishWorkout} className="text-[#000000]">
                finish
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-[60px] leading-[110%] font-normal text-[#000000]">
              Warm Up
            </h1>
            <p className="text-[60px] leading-[110%] font-normal text-[#ff2f00]">{formatTime(warmupTime)}</p>
          </div>

          <div className="mb-8">
            <p className="text-[20px] leading-[120%] text-[#000000] whitespace-pre-line">
              {warmupDetailsText}
            </p>
          </div>

          <div className="flex-1"></div>

          <div className="fixed bottom-[10px] left-0 right-0 flex justify-center z-50">
            <div className="w-full max-w-md px-[10px]">
              <div
                className="absolute inset-x-0 bottom-0 h-[200px] -z-10"
                style={{
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                }}
              />

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleShuffleWarmup}
                  disabled={isWarmupShuffleLoading || !canShuffleWarmup}
                  className={`w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.02)] ${
                    isWarmupShuffleLoading || !canShuffleWarmup ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  shuffle
                </button>
                <button
                  onClick={() => setStage("exercise-warmup")}
                  className="w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90"
                >
                  next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Exercise Warmup Stage
  if (stage === "exercise-warmup") {
    const currentExerciseData = exercises[currentExercise]
    
    // Если нет упражнений, переходим к finished
    if (!currentExerciseData) {
      finishWorkout()
      return null
    }

    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
            <span className="text-[#000000]">{formatTime(totalTime)}</span>
            <div className="flex items-center gap-3">
              <button onClick={cancelWorkout} className="text-[#000000]">
                cancel
              </button>
              <button onClick={finishWorkout} className="text-[#000000]">
                finish
              </button>
            </div>
          </div>

          <div className="mb-8 exercise-title-group">
            <h1 className="text-[60px] font-normal text-[#000000]">
              {currentExerciseData.name}
            </h1>
            <p className="text-[60px] font-normal text-[#ff2f00]">×{currentSet}</p>
          </div>

          {currentExerciseData.instructions && (
            <div className="mb-8">
              <p className="text-[20px] leading-[120%] text-[#000000] whitespace-pre-line">
                {currentExerciseData.instructions}
              </p>
            </div>
          )}

          <div className="flex-1"></div>

          {renderExerciseControls(currentExerciseData)}
        </div>
      </div>
    )
  }

  // Rest Stage
  if (stage === "rest") {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col p-[10px]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
            <span className="text-[rgba(255,255,255,0.3)]">{formatTime(totalTime)}</span>
            <button onClick={skipRest} className="text-[#ffffff]">
              skip
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-[60px] leading-[110%] font-normal text-[#ffffff]">rest</h1>
            <p className="text-[60px] leading-[110%] font-normal text-[#ff2f00]">{formatTime(restTime)}</p>
          </div>

          <div className="flex-1"></div>
        </div>
      </div>
    )
  }

  // Working Set Stage
  if (stage === "working-set") {
    const currentExerciseData = exercises[currentExercise]
    
    // Если нет упражнений, переходим к finished
    if (!currentExerciseData) {
      finishWorkout()
      return null
    }

    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
            <span className="text-[#000000]">{formatTime(totalTime)}</span>
            <div className="flex items-center gap-3">
              <button onClick={cancelWorkout} className="text-[#000000]">
                cancel
              </button>
              <button onClick={finishWorkout} className="text-[#000000]">
                finish
              </button>
            </div>
          </div>

          <div className="mb-8 exercise-title-group">
            <h1 className="text-[60px] font-normal text-[#000000]">
              {currentExerciseData.name}
            </h1>
            <p className="text-[60px] font-normal text-[#ff2f00]">×{currentSet}</p>
          </div>

          {currentExerciseData.instructions && (
            <div className="mb-8">
              <p className="text-[20px] leading-[120%] text-[#000000] whitespace-pre-line">
                {currentExerciseData.instructions}
              </p>
            </div>
          )}

          <div className="flex-1"></div>

          {renderExerciseControls(currentExerciseData)}
        </div>
      </div>
    )
  }

  // Add Exercise Prompt Stage
  if (stage === "add-exercise-prompt") {
    if (showExerciseList) {
      return (
        <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
          <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
              <span className="text-[#000000]">{formatTime(totalTime)}</span>
              <button 
                onClick={() => setShowExerciseList(false)} 
                className="text-[#000000]"
              >
                back
              </button>
            </div>

            <div className="mb-8">
              <h1 className="text-[60px] leading-[110%] font-normal text-[#000000]">
                Exercises
              </h1>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              {isLoadingExercises ? (
                <div className="text-center text-[20px] text-[rgba(0,0,0,0.3)]">
                  Loading...
                </div>
              ) : (
                <div className="space-y-2">
                  {availableExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => addExerciseToWorkout(exercise)}
                      className="w-full bg-[#ffffff] text-left py-4 px-6 rounded-[20px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.02)]"
                    >
                      <div className="font-normal text-[#000000]">{exercise.name}</div>
                      {exercise.instructions && (
                        <div className="text-[16px] text-[rgba(0,0,0,0.5)] mt-1 line-clamp-2">
                          {exercise.instructions}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 text-[16px] leading-[120%]">
            <span className="text-[#000000]">{formatTime(totalTime)}</span>
            <button onClick={cancelWorkout} className="text-[#000000]">
              cancel
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-[60px] leading-[110%] font-normal text-[#000000]">
              What's next?
            </h1>
          </div>

          <div className="flex-1"></div>

          <div className="fixed bottom-[10px] left-0 right-0 flex justify-center z-50">
            <div className="w-full max-w-md px-[10px]">
              <div
                className="absolute inset-x-0 bottom-0 h-[200px] -z-10"
                style={{
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                }}
              />

              <div className="space-y-3">
                <button
                  onClick={fetchAllExercises}
                  disabled={isLoadingExercises}
                  className={`w-full bg-[#ffffff] text-[#000000] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.02)] ${
                    isLoadingExercises ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoadingExercises ? "Loading..." : "add exercise"}
                </button>
                <button
                  onClick={finishWorkout}
                  className="w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90"
                >
                  finish workout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (stage === "finished") {
    return (
      <div className="min-h-screen bg-[#ffffff] flex flex-col p-[10px] relative">
        <div className="fixed top-0 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div
            className="w-full max-w-md px-[10px] flex justify-end pointer-events-auto"
            style={{ paddingTop: "calc(10px + env(safe-area-inset-top, 0px))" }}
          >
            <Link href="/">
              <button className="p-2" aria-label="Close">
                <X className="w-6 h-6 text-[#000000]" />
              </button>
            </Link>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto flex-1 flex flex-col pt-[80px]">
          <div
            className="flex-1 flex flex-col justify-end"
            style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="mb-8">
              <h1 className="text-[60px] leading-[110%] font-normal text-[#000000]">{formatTime(totalTime)}</h1>
            </div>

            <div className="mb-8 space-y-2">
              {totalWorkouts !== null && (
                <div className="flex items-center justify-between py-4 border-b border-[rgba(0,0,0,0.1)]">
                  <span className="text-[20px] leading-[120%] text-[#000000]">total workouts</span>
                  <span className="text-[20px] leading-[120%] text-[#000000]">{totalWorkouts}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-4 border-b border-[rgba(0,0,0,0.1)]">
                <span className="text-[20px] leading-[120%] text-[#000000]">session volume</span>
                <span className="text-[20px] leading-[120%] text-[#000000]">{sessionWeight.toFixed(0)} kg</span>
              </div>
              {totalLifetimeWeight !== null && (
                <div className="flex items-center justify-between py-4 border-b border-[rgba(0,0,0,0.1)]">
                  <span className="text-[20px] leading-[120%] text-[#000000]">lifetime volume</span>
                  <span className="text-[20px] leading-[120%] text-[#000000]">{totalLifetimeWeight.toFixed(0)} kg</span>
                </div>
              )}
              <div className="flex items-center justify-between py-4 border-[rgba(0,0,0,0.1)]">
                <span className="text-[20px] leading-[120%] text-[#000000]">exercises completed</span>
                <span className="text-[20px] leading-[120%] text-[#000000]">{Object.keys(completedSets).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
