"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { X, Mic, Trash2 } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { WorkoutSetWithExercises } from "@/lib/types/database"
import { ExerciseSelector } from "@/components/ExerciseSelector"

type Exercise = {
  id: string
  exerciseId: string | null
  name: string
  sets: number | null
  warmupTime?: string
  exercise_type?: string
  movement_pattern?: string
  muscle_group?: string
}

type Preset = {
  id: string
  label: string
  exercises: Exercise[]
}

type DbExercise = {
  id: string
  name: string
  instructions: string | null
  exercise_type: string
  movement_pattern: string
  muscle_group: string
}

export default function StartWorkout() {
  const [showAdjustOverlay, setShowAdjustOverlay] = useState(false)
  const [inputText, setInputText] = useState("")
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [swipedExerciseId, setSwipedExerciseId] = useState<string | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [editingWarmupId, setEditingWarmupId] = useState<string | null>(null)
  const [warmupInputValue, setWarmupInputValue] = useState<string>("")
  const warmupInputRef = useRef<HTMLInputElement | null>(null)
  
  // Состояния для добавления упражнений
  const [showExerciseList, setShowExerciseList] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<DbExercise[]>([])
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [modalTouchStart, setModalTouchStart] = useState<number | null>(null)
  const [modalSwipeDistance, setModalSwipeDistance] = useState(0)

  const supabaseClientRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseClientRef.current
    let isMounted = true

    const mapWorkoutSets = (sets: WorkoutSetWithExercises[]): Preset[] => {
      return sets.map((preset) => {
        const sortedExercises = (preset.exercises || [])
          .slice()
          .sort((a, b) => a.order_index - b.order_index)
          .map((item) => {
            const exerciseName = item.exercise?.name ?? "Exercise"
            const normalizedName = exerciseName.trim().toLowerCase()
            const isWarmup =
              normalizedName === "workout" ||
              normalizedName.includes("warm")
            const displayName = normalizedName === "workout" ? "warm up" : exerciseName

            return {
              id: item.id,
              exerciseId: item.exercise?.id ?? null,
              name: displayName,
              sets: item.target_sets ?? null,
              warmupTime: isWarmup ? "10:00" : undefined,
              exercise_type: item.exercise?.exercise_type,
              movement_pattern: item.exercise?.movement_pattern,
              muscle_group: item.exercise?.muscle_group,
            }
          })

        const hasWarmupRow = sortedExercises.some((exercise) => exercise.warmupTime !== undefined)

        const exercises = hasWarmupRow
          ? sortedExercises
          : [
              {
                id: `warmup-${preset.id}`,
                exerciseId: null,
                name: "warm up",
                sets: null,
                warmupTime: "10:00",
                exercise_type: 'warmup',
                movement_pattern: 'complex',
                muscle_group: 'full_body',
              },
              ...sortedExercises,
            ]

        return {
          id: preset.id,
          label: preset.name,
          exercises,
        }
      })
    }

    const loadSetsForUser = async (userId: string) => {
      const { data, error: setsError } = await supabase
        .from("workout_sets")
        .select(
          `
            *,
            exercises:workout_set_exercises(
              *,
              exercise:exercises(*)
            )
          `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true })

      if (setsError) {
        throw setsError
      }

      const typedData = (data ?? []) as unknown as WorkoutSetWithExercises[]
      const mappedPresets = mapWorkoutSets(typedData)

      if (isMounted) {
        setPresets(mappedPresets)
        setActivePreset((prev) => {
          if (prev && mappedPresets.some((preset) => preset.id === prev)) {
            return prev
          }
          return mappedPresets.length > 0 ? mappedPresets[0].id : null
        })
        setError(null)
      }
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session?.user) {
          if (isMounted) {
            setPresets([])
            setActivePreset(null)
            setError("Please sign in to see your templates.")
          }
          return
        }

        await loadSetsForUser(session.user.id)
      } catch (err) {
        console.error(err)
        if (isMounted) {
          setError("Failed to load workout templates. Please try again later.")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    const {
      data: authSubscription,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return

      if (!session?.user) {
        setPresets([])
        setActivePreset(null)
        setError("Please sign in to see your templates.")
        setLoading(false)
        return
      }

      setLoading(true)
      loadSetsForUser(session.user.id)
        .catch((err) => {
          console.error(err)
          setError("Failed to load workout templates. Please try again later.")
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false)
          }
        })
    })

    return () => {
      isMounted = false
      authSubscription?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    setEditingWarmupId(null)
    setWarmupInputValue("")
    setSwipedExerciseId(null)
    setSwipeDistance(0)
  }, [activePreset])

  const activePresetData = activePreset ? presets.find((p) => p.id === activePreset) : undefined
  const isStartDisabled = !activePresetData || activePresetData.exercises.length === 0

  const handleDeleteExercise = (exerciseId: string) => {
    if (!activePreset) return

    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === activePreset
          ? {
              ...preset,
              exercises: preset.exercises.filter((ex) => ex.id !== exerciseId),
            }
          : preset,
      ),
    )
    setSwipedExerciseId(null)
    setSwipeDistance(0)
  }

  const handleTouchStart = (e: React.TouchEvent, exerciseId: string, isWarmup: boolean) => {
    if (isWarmup) return // Не даем свайпать warm up
    setTouchStart(e.touches[0].clientX)
    setSwipedExerciseId(exerciseId)
  }

  const handleTouchMove = (e: React.TouchEvent, exerciseId: string, isWarmup: boolean) => {
    if (isWarmup || touchStart === null) return

    const touchCurrent = e.touches[0].clientX
    const diff = touchStart - touchCurrent

    // Only allow left swipe (positive diff), max 100px
    if (diff > 0) {
      setSwipeDistance(Math.min(diff, 100))
    } else if (diff < 0) {
      // Allow swipe back to close
      setSwipeDistance(Math.max(0, swipeDistance + diff * 0.5))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, exerciseId: string, isWarmup: boolean) => {
    if (isWarmup || touchStart === null) return

    // If swiped more than 80px (fully revealed), delete
    if (swipeDistance >= 80) {
      handleDeleteExercise(exerciseId)
    } else {
      // Otherwise reset with animation
      setSwipeDistance(0)
      setSwipedExerciseId(null)
    }

    setTouchStart(null)
  }
  
  // Загрузка списка всех упражнений
  const loadAvailableExercises = async () => {
    if (loadingExercises) return
    
    setLoadingExercises(true)
    try {
      const supabase = supabaseClientRef.current
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, instructions, exercise_type, movement_pattern, muscle_group")
        .order("name")
      
      if (error) throw error
      
      setAvailableExercises((data || []) as DbExercise[])
      setShowExerciseList(true)
    } catch (err) {
      console.error("Error loading exercises:", err)
    } finally {
      setLoadingExercises(false)
    }
  }
  
  // Добавление упражнения в текущий preset
  const handleAddExercise = (exercise: DbExercise) => {
    if (!activePreset) return
    
    const newExercise: Exercise = {
      id: `temp-${Date.now()}`, // Временный ID для UI
      exerciseId: exercise.id,
      name: exercise.name,
      sets: null,
      exercise_type: exercise.exercise_type,
      movement_pattern: exercise.movement_pattern,
      muscle_group: exercise.muscle_group,
    }
    
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === activePreset
          ? {
              ...preset,
              exercises: [...preset.exercises, newExercise],
            }
          : preset,
      ),
    )
    
    setShowExerciseList(false)
    setModalSwipeDistance(0)
    setModalTouchStart(null)
  }

  const handleWarmupFocus = (exerciseId: string, currentTime: string) => {
    setEditingWarmupId(exerciseId)
    // Извлекаем минуты из формата MM:SS
    const minutes = currentTime.split(":")[0]
    setWarmupInputValue(minutes)
    // Select all при фокусе
    setTimeout(() => {
      warmupInputRef.current?.select()
    }, 0)
  }

  const handleWarmupBlur = (exerciseId: string) => {
    setEditingWarmupId(null)
    // Форматируем введенное значение в MM:SS
    const minutes = warmupInputValue || "10"
    const formattedTime = `${minutes.padStart(2, "0")}:00`
    
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === activePreset
          ? {
              ...preset,
              exercises: preset.exercises.map((ex) =>
                ex.id === exerciseId ? { ...ex, warmupTime: formattedTime } : ex,
              ),
            }
          : preset,
      ),
    )
    setWarmupInputValue("")
  }

  const handleWarmupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Только цифры
    const value = e.target.value.replace(/\D/g, "")
    setWarmupInputValue(value)
  }

  const handleModalTouchStart = (e: React.TouchEvent) => {
    setModalTouchStart(e.touches[0].clientY)
  }

  const handleModalTouchMove = (e: React.TouchEvent) => {
    if (modalTouchStart === null) return

    const touchCurrent = e.touches[0].clientY
    const diff = touchCurrent - modalTouchStart

    // Only allow downward swipe (positive diff)
    if (diff > 0) {
      setModalSwipeDistance(diff)
    }
  }

  const handleModalTouchEnd = () => {
    if (modalTouchStart === null) return

    // If swiped more than 150px, close modal
    if (modalSwipeDistance > 150) {
      setShowExerciseList(false)
      setModalSwipeDistance(0)
    } else {
      // Otherwise reset with animation
      setModalSwipeDistance(0)
    }

    setModalTouchStart(null)
  }


  return (
    <div className="min-h-screen bg-[#ffffff] flex justify-center p-[10px] relative">
      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000]">new workout</h1>
          <Link href="/">
            <button className="p-2" aria-label="Close">
              <X className="w-6 h-6 text-[#000000]" />
            </button>
          </Link>
        </div>

        {/* Preset Icons */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setActivePreset(preset.id)}
              className={`
                flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center
                ${preset.id === activePreset ? "bg-[#000000] text-[#ffffff]" : "bg-[#f7f7f7] text-[#000000]"}
                hover:opacity-80 transition-opacity
              `}
            >
              <span className="text-[20px] leading-[120%]">
                {preset.label ? preset.label.toUpperCase() : ""}
              </span>
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="space-y-0 mb-[200px] border-t border-[rgba(0,0,0,0.1)]">
          {loading ? (
            <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.4)]">
              Loading templates...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-[16px] leading-[140%] text-[#ff2f00]">
              {error}
            </div>
          ) : !activePresetData ? (
            <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.4)]">
              No templates found. Create a new set in the app.
            </div>
          ) : activePresetData.exercises.length === 0 ? (
            <>
              <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.4)]">
                No exercises in this template yet.
              </div>
              
              {/* Кнопка добавления упражнения */}
              <button
                onClick={loadAvailableExercises}
                disabled={loadingExercises}
                className="flex items-center justify-between py-5 border-b border-[rgba(0,0,0,0.1)] bg-[#ffffff] w-full text-left hover:bg-[#f7f7f7] transition-colors disabled:opacity-50"
              >
                <span className="text-[20px] leading-[120%] text-[rgba(0,0,0,0.5)]">
                  {loadingExercises ? "Loading..." : "+ add exercise"}
                </span>
              </button>
            </>
          ) : (
            <>
              {activePresetData.exercises.map((exercise) => {
                const isWarmup = exercise.warmupTime !== undefined
                const currentSwipe = swipedExerciseId === exercise.id ? swipeDistance : 0
                
                return (
                  <div
                    key={exercise.id}
                    className="relative overflow-hidden border-b border-[rgba(0,0,0,0.1)] group"
                    onTouchStart={(e) => handleTouchStart(e, exercise.id, isWarmup)}
                    onTouchMove={(e) => handleTouchMove(e, exercise.id, isWarmup)}
                    onTouchEnd={(e) => handleTouchEnd(e, exercise.id, isWarmup)}
                  >
                    {/* Красная кнопка удаления позади (swipe на мобиле) */}
                    {!isWarmup && (
                      <div 
                        className="absolute right-0 top-0 h-full bg-[#ff2f00] flex items-center justify-center transition-all"
                        style={{
                          width: `${currentSwipe}px`,
                          opacity: Math.min(currentSwipe / 80, 1),
                        }}
                      >
                        <Trash2 
                          className="w-6 h-6 text-[#ffffff]"
                          style={{
                            opacity: Math.min(currentSwipe / 60, 1),
                            transform: `scale(${Math.min(currentSwipe / 80, 1)})`,
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Строка упражнения */}
                    <div
                      className="flex items-center justify-between py-5 bg-[#ffffff] relative z-10"
                      style={{
                        transform: `translateX(-${currentSwipe}px)`,
                        transition: touchStart === null ? 'transform 0.3s ease-out' : 'none',
                      }}
                    >
                      <span className="text-[20px] leading-[120%] text-[#000000]">{exercise.name}</span>
                      
                      <div className="flex items-center gap-3">
                        {isWarmup ? (
                          <input
                            ref={warmupInputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editingWarmupId === exercise.id ? warmupInputValue : exercise.warmupTime || "10:00"}
                            onChange={handleWarmupChange}
                            onFocus={() => handleWarmupFocus(exercise.id, exercise.warmupTime || "10:00")}
                            onBlur={() => handleWarmupBlur(exercise.id)}
                            className="text-[20px] leading-[120%] text-[#000000] bg-transparent outline-none text-right w-[80px]"
                          />
                        ) : (
                          /* Иконка удаления по hover на десктопе */
                          <button
                            onClick={() => handleDeleteExercise(exercise.id)}
                            className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-[rgba(255,47,0,0.1)] rounded-lg"
                            aria-label="Delete exercise"
                          >
                            <Trash2 className="w-5 h-5 text-[#ff2f00]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Кнопка добавления упражнения */}
              <button
                onClick={loadAvailableExercises}
                disabled={loadingExercises}
                className="flex items-center justify-between py-5 border-b border-[rgba(0,0,0,0.1)] bg-[#ffffff] w-full text-left hover:bg-[#f7f7f7] transition-colors disabled:opacity-50"
              >
                <span className="text-[20px] leading-[120%] text-[rgba(0,0,0,0.5)]">
                  {loadingExercises ? "Loading..." : "+ add exercise"}
                </span>
              </button>
            </>
          )}
        </div>

        <div className="fixed bottom-[10px] left-0 right-0 flex justify-center pointer-events-none z-50">
          <div className="w-full max-w-md px-[10px] pointer-events-auto">
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
                onClick={() => {
                  if (isStartDisabled) return
                  // Очищаем предыдущее состояние тренировки
                  localStorage.removeItem("workoutState")
                  
                  // Подготавливаем данные для тренировки
                  const warmupExercise = activePresetData?.exercises.find((ex) => ex.warmupTime !== undefined)
                  const warmupMinutes = warmupExercise?.warmupTime
                    ? parseInt(warmupExercise.warmupTime.split(":")[0])
                    : 10
                  localStorage.setItem("workoutWarmupMinutes", warmupMinutes.toString())
                  
                  // Сохраняем выбранные упражнения (без warm up)
                  const selectedExercises = activePresetData.exercises
                    .filter((ex) => ex.warmupTime === undefined)
                    .map((ex) => ({
                      id: ex.exerciseId ?? ex.id,
                      exerciseId: ex.exerciseId ?? null,
                      workoutEntryId: ex.id,
                      name: ex.name,
                      sets: ex.sets,
                      exercise_type: ex.exercise_type,
                      movement_pattern: ex.movement_pattern,
                      muscle_group: ex.muscle_group,
                    }))
                  
                  localStorage.setItem("workoutExercises", JSON.stringify(selectedExercises))
                  localStorage.setItem("workoutSetId", activePreset || "")
                  
                  window.location.href = "/workout/1"
                }}
                disabled={isStartDisabled}
                className={`w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal transition-opacity ${
                  isStartDisabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
                }`}
              >
                start
              </button>
            </div>
          </div>
        </div>

        {/* Модальное окно со списком упражнений */}
        {showExerciseList && (
          <>
            <div 
              className="fixed inset-0 bg-[rgba(0,0,0,0.3)] z-[60]" 
              onClick={() => {
                setShowExerciseList(false)
                setModalSwipeDistance(0)
              }} 
            />
            <div 
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[#ffffff] rounded-t-[30px] shadow-2xl animate-slide-up max-h-[80vh] flex flex-col overflow-hidden"
              style={{
                transform: `translateY(${modalSwipeDistance}px)`,
                transition: modalTouchStart === null ? 'transform 0.3s ease-out' : 'none',
              }}
              onTouchStart={handleModalTouchStart}
              onTouchMove={handleModalTouchMove}
              onTouchEnd={handleModalTouchEnd}
            >
              <div className="w-full max-w-md mx-auto flex-1 flex flex-col overflow-hidden">
                <ExerciseSelector
                  exercises={availableExercises}
                  isLoading={loadingExercises}
                  onSelectExercise={handleAddExercise}
                />
              </div>
            </div>
          </>
        )}

        {showAdjustOverlay && (
          <>
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.3)] z-[60]" onClick={() => setShowAdjustOverlay(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-[70] bg-[#ffffff] rounded-t-[30px] shadow-2xl animate-slide-up">
              <div className="w-full max-w-md mx-auto p-6">
                <div className="flex items-center gap-2 mb-6 bg-[#f7f7f7] rounded-[20px] px-4 py-3">
                  <span className="text-[#000000] text-[16px]">+</span>
                  <input
                    type="text"
                    placeholder="adjust workout"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent outline-none text-[16px] leading-[120%] text-[#000000] placeholder:text-[rgba(0,0,0,0.3)]"
                  />
                  <button className="p-1">
                    <Mic className="w-5 h-5 text-[rgba(0,0,0,0.5)]" />
                  </button>
                </div>

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setShowAdjustOverlay(false)}
                    className="px-6 py-3 bg-[#000000] text-[#ffffff] rounded-[60px] text-[16px] leading-[120%]"
                  >
                    done
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
