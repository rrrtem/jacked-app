"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { X, Mic, Trash2 } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { WorkoutSetWithExercises } from "@/lib/types/database"

type Exercise = {
  id: string
  name: string
  sets: number | null
  warmupTime?: string
}

type Preset = {
  id: string
  label: string
  exercises: Exercise[]
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

  const supabaseClientRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseClientRef.current
    let isMounted = true

    const mapWorkoutSets = (sets: WorkoutSetWithExercises[]): Preset[] => {
      return sets.map((preset) => {
        const exercises = (preset.exercises || [])
          .slice()
          .sort((a, b) => a.order_index - b.order_index)
          .map((item) => {
            const exerciseName = item.exercise?.name ?? "Exercise"
            const normalizedName = exerciseName.toLowerCase()
            const isWarmup =
              normalizedName.includes("warm") || normalizedName.includes("размин")

            return {
              id: item.id,
              name: exerciseName,
              sets: item.target_sets ?? null,
              warmupTime: isWarmup ? "10:00" : undefined,
            }
          })

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
            setError("Чтобы увидеть свои шаблоны, войдите в аккаунт.")
          }
          return
        }

        await loadSetsForUser(session.user.id)
      } catch (err) {
        console.error(err)
        if (isMounted) {
          setError("Не удалось загрузить шаблоны тренировок. Попробуйте позже.")
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
        setError("Чтобы увидеть свои шаблоны, войдите в аккаунт.")
        setLoading(false)
        return
      }

      setLoading(true)
      loadSetsForUser(session.user.id)
        .catch((err) => {
          console.error(err)
          setError("Не удалось загрузить шаблоны тренировок. Попробуйте позже.")
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

    // Only allow left swipe (positive diff), max 80px
    if (diff > 0) {
      setSwipeDistance(Math.min(diff, 80))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, exerciseId: string, isWarmup: boolean) => {
    if (isWarmup || touchStart === null) return

    // If swiped more than 60px (reaching trash icon), delete
    if (swipeDistance > 60) {
      handleDeleteExercise(exerciseId)
    } else {
      // Otherwise reset
      setSwipeDistance(0)
      setSwipedExerciseId(null)
    }

    setTouchStart(null)
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
                ${preset.id === activePreset ? "bg-[#000000] text-[#ffffff]" : "bg-[rgba(0,0,0,0.05)] text-[#000000]"}
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
              Загружаем шаблоны...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-[16px] leading-[140%] text-[#ff2f00]">
              {error}
            </div>
          ) : !activePresetData ? (
            <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.4)]">
              Шаблоны не найдены. Создайте новый сет в приложении.
            </div>
          ) : activePresetData.exercises.length === 0 ? (
            <div className="py-12 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.4)]">
              В этом шаблоне пока нет упражнений.
            </div>
          ) : (
            activePresetData.exercises.map((exercise) => {
              const isWarmup = exercise.warmupTime !== undefined
              return (
                <div
                  key={exercise.id}
                  className="relative overflow-hidden"
                  onTouchStart={(e) => handleTouchStart(e, exercise.id, isWarmup)}
                  onTouchMove={(e) => handleTouchMove(e, exercise.id, isWarmup)}
                  onTouchEnd={(e) => handleTouchEnd(e, exercise.id, isWarmup)}
                >
                  <div
                    className="flex items-center justify-between py-5 border-b border-[rgba(0,0,0,0.1)] bg-[#ffffff] transition-transform"
                    style={{
                      transform: swipedExerciseId === exercise.id ? `translateX(-${swipeDistance}px)` : "translateX(0)",
                    }}
                  >
                    <span className="text-[20px] leading-[120%] text-[#000000]">{exercise.name}</span>
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
                    ) : null}
                  </div>

                  {swipedExerciseId === exercise.id && !isWarmup && (
                    <div
                      className="absolute right-0 top-0 h-full w-20 bg-[#ff2f00] flex items-center justify-center"
                      onClick={() => handleDeleteExercise(exercise.id)}
                    >
                      <Trash2 className="w-6 h-6 text-[#ffffff]" />
                    </div>
                  )}
                </div>
              )
            })
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
                  
                  // Сохраняем данные о новой тренировке в localStorage
                  const warmupExercise = activePresetData?.exercises.find((ex) => ex.warmupTime !== undefined)
                  const warmupMinutes = warmupExercise?.warmupTime
                    ? parseInt(warmupExercise.warmupTime.split(":")[0])
                    : 10
                  localStorage.setItem("workoutWarmupMinutes", warmupMinutes.toString())
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
