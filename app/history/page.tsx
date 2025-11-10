"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { deleteWorkoutSession } from "@/lib/supabase/queries"

type WorkoutSet = {
  id: string
  set_number: number
  weight: number | null
  reps: number | null
  duration: number | null
  completed: boolean
}

type WorkoutExercise = {
  id: string
  order_index: number
  exercise: {
    id: string
    name: string
  }
  sets: WorkoutSet[]
}

type WorkoutWithDetails = {
  id: string
  user_id: string
  started_at: string | null
  completed_at: string | null
  duration: number | null
  notes: string | null
  created_at: string
  updated_at: string
  exercises: WorkoutExercise[]
}

export default function HistoryPage() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<WorkoutWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [swipedWorkoutId, setSwipedWorkoutId] = useState<string | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const workoutRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        const userId = session?.user?.id
        if (!userId) {
          router.replace("/login")
          return
        }

        // Получаем все завершенные тренировки с упражнениями и подходами
        const { data, error: fetchError } = await supabase
          .from("workout_sessions")
          .select(
            `
            *,
            exercises:workout_session_exercises(
              *,
              exercise:exercises(id, name),
              sets:workout_session_sets(*)
            )
          `
          )
          .eq("user_id", userId)
          .not("completed_at", "is", null)
          .order("started_at", { ascending: false })

        if (fetchError) throw fetchError

        // Сортируем упражнения и подходы
        const workoutsWithDetails = (data || []).map((workout: any) => {
          const exercises = (workout.exercises || []).sort(
            (a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index
          )
          exercises.forEach((exercise: WorkoutExercise) => {
            if (exercise.sets) {
              exercise.sets.sort((a, b) => a.set_number - b.set_number)
            }
          })
          return {
            ...workout,
            exercises,
          }
        })

        setWorkouts(workoutsWithDetails as WorkoutWithDetails[])
      } catch (err) {
        console.error("Error loading workout history:", err)
        setError("Failed to load workout history")
      } finally {
        setLoading(false)
      }
    }

    fetchWorkouts()
  }, [router])

  // Автоматический скролл к дате из хеша URL
  useEffect(() => {
    if (typeof window === "undefined" || workouts.length === 0) return

    const hash = window.location.hash.slice(1) // Убираем #
    if (!hash) return

    // Ищем тренировку с этой датой
    const targetWorkout = workouts.find((w) => {
      if (!w.started_at) return false
      const workoutDate = w.started_at.slice(0, 10) // YYYY-MM-DD
      return workoutDate === hash
    })

    if (targetWorkout) {
      // Даем время на рендер
      setTimeout(() => {
        const element = workoutRefs.current[targetWorkout.id]
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 100)
    }
  }, [workouts])

  const handleDelete = async (sessionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }

    if (!confirm("Are you sure you want to delete this workout?")) {
      return
    }

    setDeletingId(sessionId)
    try {
      await deleteWorkoutSession(sessionId)
      setWorkouts((prev) => prev.filter((w) => w.id !== sessionId))
    } catch (err) {
      console.error("Error deleting workout:", err)
      alert("Failed to delete workout")
    } finally {
      setDeletingId(null)
      setSwipedWorkoutId(null)
      setSwipeDistance(0)
    }
  }

  const handleTouchStart = (e: React.TouchEvent, workoutId: string) => {
    setTouchStart(e.touches[0].clientX)
    setSwipedWorkoutId(workoutId)
  }

  const handleTouchMove = (e: React.TouchEvent, workoutId: string) => {
    if (touchStart === null) return

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

  const handleTouchEnd = (e: React.TouchEvent, workoutId: string) => {
    if (touchStart === null) return

    // If swiped more than 80px (fully revealed), delete
    if (swipeDistance >= 80) {
      handleDelete(workoutId)
    } else {
      // Otherwise reset with animation
      setSwipeDistance(0)
      setSwipedWorkoutId(null)
    }

    setTouchStart(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear().toString().slice(-2)
    return `${day}/${month}/${year}`
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const formatWeight = (weight: number | null) => {
    if (weight === null || weight === undefined) return null
    const numericValue = Number(weight)
    if (Number.isNaN(numericValue)) return null
    return Number.isInteger(numericValue)
      ? numericValue.toString()
      : numericValue.toFixed(1)
  }
  
  const formatSet = (set: WorkoutSet) => {
    const parts = []
    const weight = formatWeight(set.weight)
    if (weight) {
      parts.push(`${weight}kg`)
    }
    if (set.reps) {
      parts.push(`×${set.reps}`)
    }
    if (set.duration) {
      parts.push(`${set.duration}s`)
    }
    return parts.length > 0 ? parts.join("") : "—"
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex justify-center p-[10px]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            href="/"
            className="p-2 -ml-2 mr-2 hover:bg-[#f7f7f7] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-[#000000]" />
          </Link>
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000]">
            history
          </h1>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-[#ff2f00]/20 bg-[#ff2f00]/10 px-3 py-2 text-[14px] leading-[140%] text-[#ff2f00]">
            {error}
          </div>
        )}

        {/* Workout List */}
        <div className="space-y-0">
          {loading ? (
            // Скелетоны загрузки
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="py-4 border-b border-[rgba(0,0,0,0.1)]"
              >
                <div className="h-[20px] w-32 rounded bg-[#0000000f] mb-2" />
                <div className="h-[16px] w-48 rounded bg-[#0000000f]" />
              </div>
            ))
          ) : workouts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[20px] leading-[120%] text-[rgba(0,0,0,0.5)] mb-2">
                No workouts yet
              </p>
              <p className="text-[16px] leading-[140%] text-[rgba(0,0,0,0.3)]">
                Start your first workout
              </p>
            </div>
          ) : (
            workouts.map((workout) => {
              const totalSets = workout.exercises.reduce(
                (sum, ex) => sum + (ex.sets?.length || 0),
                0
              )
              const currentSwipe = swipedWorkoutId === workout.id ? swipeDistance : 0
              const workoutDate = workout.started_at?.slice(0, 10) || ""
              
              return (
                <div 
                  key={workout.id} 
                  id={workoutDate}
                  ref={(el) => {
                    workoutRefs.current[workout.id] = el
                  }}
                  className="relative overflow-hidden border-b border-[rgba(0,0,0,0.1)] group"
                  onTouchStart={(e) => handleTouchStart(e, workout.id)}
                  onTouchMove={(e) => handleTouchMove(e, workout.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, workout.id)}
                >
                  {/* Красная кнопка удаления позади (swipe на мобиле) */}
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
                  
                  <div
                    className="flex items-center justify-between py-4 bg-[#ffffff] relative z-10"
                    style={{
                      transform: `translateX(-${currentSwipe}px)`,
                      transition: touchStart === null ? 'transform 0.3s ease-out' : 'none',
                    }}
                  >
                    <div className="flex-1">
                      {/* Заголовок: дата · длительность */}
                      <div className="text-[20px] leading-[120%] text-[#000000] mb-1">
                        {formatDate(workout.started_at || "")} · {formatDuration(workout.duration)}
                      </div>
                      
                      {/* Детальная информация: упражнения с подходами */}
                      <div className="mt-2 space-y-1">
                        {workout.exercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            className="text-[12px] leading-[140%] text-[rgba(0,0,0,0.4)]"
                          >
                            <span className="lowercase">
                              {exercise.exercise?.name || "exercise"}:
                            </span>{" "}
                            {exercise.sets && exercise.sets.length > 0 ? (
                              exercise.sets
                                .map((set) => formatSet(set))
                                .join(" · ")
                            ) : (
                              <span className="text-[rgba(0,0,0,0.25)]">
                                no sets
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Иконка удаления по hover на десктопе */}
                    <button
                      onClick={(e) => handleDelete(workout.id, e)}
                      disabled={deletingId === workout.id}
                      className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[rgba(0,0,0,0.3)] hover:text-[#ff2f00] hover:bg-[#ff2f00]/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ml-2 self-start"
                      aria-label="Delete workout"
                    >
                      <Trash2
                        className={`w-5 h-5 ${
                          deletingId === workout.id ? "animate-pulse" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}

