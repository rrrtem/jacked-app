"use client"

import { useEffect, useState } from "react"
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
        console.error("Ошибка загрузки истории тренировок:", err)
        setError("Не удалось загрузить историю тренировок")
      } finally {
        setLoading(false)
      }
    }

    fetchWorkouts()
  }, [router])

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault() // Предотвращаем переход по ссылке
    e.stopPropagation()

    if (!confirm("Вы уверены, что хотите удалить эту тренировку?")) {
      return
    }

    setDeletingId(sessionId)
    try {
      await deleteWorkoutSession(sessionId)
      setWorkouts((prev) => prev.filter((w) => w.id !== sessionId))
    } catch (err) {
      console.error("Ошибка удаления тренировки:", err)
      alert("Не удалось удалить тренировку")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleDateString("ru-RU", { month: "short" })
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} мин`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}ч ${remainingMinutes}м`
  }

  const formatWeight = (weight: number | null) => {
    if (weight === null || weight === undefined) return null
    const numericValue = Number(weight)
    if (Number.isNaN(numericValue)) return null
    return Number.isInteger(numericValue)
      ? numericValue.toString()
      : numericValue.toFixed(1)
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-[10px]">
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
            история
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
                Пока нет тренировок
              </p>
              <p className="text-[16px] leading-[140%] text-[rgba(0,0,0,0.3)]">
                Начните свою первую тренировку
              </p>
            </div>
          ) : (
            workouts.map((workout) => {
              const totalSets = workout.exercises.reduce(
                (sum, ex) => sum + (ex.sets?.length || 0),
                0
              )
              
              return (
                <div key={workout.id} className="border-b border-[rgba(0,0,0,0.1)]">
                  <Link
                    href={`/workout/${workout.id}`}
                    className="flex items-center justify-between py-4 transition-all duration-200 hover:bg-[#f7f7f7] group"
                  >
                    <div className="flex-1">
                      <div className="text-[20px] leading-[120%] text-[#000000] mb-1">
                        {formatDate(workout.started_at || "")}
                      </div>
                      <div className="text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)]">
                        {workout.exercises.length}{" "}
                        {workout.exercises.length === 1
                          ? "упражнение"
                          : workout.exercises.length < 5
                          ? "упражнения"
                          : "упражнений"}{" "}
                        · {totalSets}{" "}
                        {totalSets === 1
                          ? "подход"
                          : totalSets < 5
                          ? "подхода"
                          : "подходов"}{" "}
                        · {formatDuration(workout.duration)}
                      </div>
                      
                      {/* Детальная информация */}
                      <div className="mt-3 space-y-2">
                        {workout.exercises.map((exercise, idx) => (
                          <div
                            key={exercise.id}
                            className="text-[12px] leading-[140%] text-[rgba(0,0,0,0.4)]"
                          >
                            <span className="font-medium">
                              {idx + 1}. {exercise.exercise?.name || "Упражнение"}:
                            </span>{" "}
                            {exercise.sets && exercise.sets.length > 0 ? (
                              exercise.sets
                                .map((set) => {
                                  const parts = []
                                  const weight = formatWeight(set.weight)
                                  if (weight) {
                                    parts.push(`${weight}кг`)
                                  }
                                  if (set.reps) {
                                    parts.push(`×${set.reps}`)
                                  }
                                  if (set.duration) {
                                    parts.push(`${set.duration}с`)
                                  }
                                  return parts.length > 0 ? parts.join(" ") : "—"
                                })
                                .join(", ")
                            ) : (
                              <span className="text-[rgba(0,0,0,0.25)]">
                                нет подходов
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(workout.id, e)}
                      disabled={deletingId === workout.id}
                      className="p-2 text-[rgba(0,0,0,0.3)] hover:text-[#ff2f00] hover:bg-[#ff2f00]/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ml-2 self-start"
                      aria-label="Удалить тренировку"
                    >
                      <Trash2
                        className={`w-5 h-5 ${
                          deletingId === workout.id ? "animate-pulse" : ""
                        }`}
                      />
                    </button>
                  </Link>
                </div>
              )
            })
          )}
        </div>

        {/* Back Button */}
        {!loading && workouts.length > 0 && (
          <div className="mt-8">
            <Link href="/">
              <button className="w-full bg-[#f7f7f7] text-[#000000] py-4 rounded-[60px] text-[20px] leading-[120%] font-normal hover:bg-[#ebebeb] transition-colors">
                назад на главную
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

