"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { ExerciseRecord, Exercise } from "@/lib/types/database"
const LOOKBACK_DAYS = 14

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const normalizeDate = (date: Date) => {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function generateContinuousDates(startDate: Date, workoutDays: Set<string>, extraWeeksAfterToday = 2) {
  const today = normalizeDate(new Date())
  const normalizedStart = normalizeDate(startDate > today ? today : startDate)

  const allDates: any[] = []

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  let cursor = new Date(normalizedStart)

  while (cursor <= today) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const day = cursor.getDate()
    const isToday = cursor.getTime() === today.getTime()
    const isPast = cursor < today
    const isFuture = cursor > today
    const dateKey = formatDateKey(cursor)
    const hasWorkout = workoutDays.has(dateKey) && (isPast || isToday)
    const isFirstOfMonth = day === 1

    allDates.push({
      date: day,
      active: hasWorkout,
      today: isToday,
      isFuture,
      isFirstOfMonth,
      monthAbbr: monthNames[month],
      fullDate: dateKey,
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  const firstDayOfWeek = normalizedStart.getDay()
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  for (let i = 0; i < offset; i++) {
    allDates.unshift({ date: null, isEmpty: true })
  }

  const todayIndex = allDates.findIndex((d: any) => d.today)

  if (todayIndex !== -1) {
    const todayRow = Math.floor(todayIndex / 7)
    let totalRows = Math.ceil(allDates.length / 7)
    let rowsAfterToday = totalRows - todayRow - 1
    const missingRows = Math.max(0, extraWeeksAfterToday - rowsAfterToday)

    if (missingRows > 0) {
      const daysToAdd = missingRows * 7

      for (let i = 1; i <= daysToAdd; i++) {
        const futureDate = new Date(today)
        futureDate.setDate(futureDate.getDate() + i)

        const year = futureDate.getFullYear()
        const month = futureDate.getMonth()
        const day = futureDate.getDate()
        const dateKey = formatDateKey(futureDate)
        const isFirstOfMonth = day === 1

        allDates.push({
          date: day,
          active: false,
          today: false,
          isFuture: true,
          isFirstOfMonth,
          monthAbbr: monthNames[month],
          fullDate: dateKey,
        })
      }

      totalRows = Math.ceil(allDates.length / 7)
      rowsAfterToday = totalRows - todayRow - 1
    }

    const maxRows = todayRow + 1 + extraWeeksAfterToday
    const maxCells = maxRows * 7

    if (allDates.length > maxCells) {
      allDates.splice(maxCells)
    }
  }

  return allDates
}

type ExerciseRecordWithExercise = ExerciseRecord & {
  exercise: Pick<Exercise, "id" | "name" | "exercise_type"> | null
}

type WorkoutSessionDateRow = {
  id: string
  started_at: string | null
}

const formatDecimal = (value: number | null) => {
  if (value === null || value === undefined) {
    return null
  }

  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) {
    return null
  }

  return Number.isInteger(numericValue) ? numericValue.toString() : numericValue.toFixed(1)
}

const formatRecordValue = (record: ExerciseRecordWithExercise) => {
  const weight = formatDecimal(record.max_weight)
  const reps = record.max_reps ?? undefined
  const duration = record.max_duration ?? undefined
  const exerciseType = record.exercise?.exercise_type ?? ''
  const isWeight = exerciseType === 'weight'

  const parts: string[] = []

  if (weight) {
    parts.push(`${weight}kg`)
  }

  if (typeof reps === "number" && reps > 0) {
    parts.push(`×${reps}`)
  }

  if (parts.length) {
    return parts.join(" ")
  }

  if (typeof duration === "number" && duration > 0) {
    return `${duration}s`
  }

  return "—"
}

export default function WorkoutTracker() {
  const router = useRouter()
  const [calendarDates, setCalendarDates] = useState<any[]>(() => {
    const today = normalizeDate(new Date())
    const initialStart = new Date(today)
    initialStart.setDate(initialStart.getDate() - LOOKBACK_DAYS)
    return generateContinuousDates(initialStart, new Set())
  })
  const [records, setRecords] = useState<ExerciseRecordWithExercise[]>([])
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [calendarHeight, setCalendarHeight] = useState<number | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null)

  // Проверяем наличие активной тренировки
  useEffect(() => {
    const checkActiveWorkout = () => {
      if (typeof window === "undefined") return
      
      const workoutId = localStorage.getItem("currentWorkoutId")
      const workoutState = localStorage.getItem("workoutState")
      
      // Если есть ID и состояние тренировки, значит есть активная тренировка
      if (workoutId && workoutState) {
        try {
          const state = JSON.parse(workoutState)
          // Проверяем, что тренировка не завершена
          if (state.stage !== "finished") {
            setActiveWorkoutId(workoutId)
          }
        } catch {
          // Если ошибка парсинга - очищаем
          localStorage.removeItem("currentWorkoutId")
          localStorage.removeItem("workoutState")
        }
      }
    }
    
    checkActiveWorkout()
    
    // Проверяем при фокусе на окне (когда возвращаемся на вкладку)
    window.addEventListener("focus", checkActiveWorkout)
    
    return () => {
      window.removeEventListener("focus", checkActiveWorkout)
    }
  }, [])

  useEffect(() => {
    const updateHeight = () => {
      if (!calendarRef.current) return
      const cell = calendarRef.current.querySelector<HTMLElement>("[data-calendar-cell='true']")
      if (!cell) return

      const cellHeight = cell.getBoundingClientRect().height
      if (!cellHeight) return

      const adjustedHeight = Math.floor(cellHeight * 5)
      setCalendarHeight(adjustedHeight)
    }

    updateHeight()
    window.addEventListener("resize", updateHeight)

    return () => {
      window.removeEventListener("resize", updateHeight)
    }
  }, [calendarDates])

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      const supabase = createClient()
      const today = normalizeDate(new Date())
      const calendarEnd = new Date(today)
      calendarEnd.setHours(23, 59, 59, 999)

      setFetchError(null)
      setCalendarLoading(true)
      setRecordsLoading(true)

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        const userId = session?.user?.id

        if (!userId) {
          router.replace("/login")
          return
        }

        const earliestSessionResult = await supabase
          .from("workout_sessions")
          .select("started_at")
          .eq("user_id", userId)
          .order("started_at", { ascending: true })
          .limit(1)
          .returns<Array<Pick<WorkoutSessionDateRow, "started_at">>>()

        if (earliestSessionResult.error) {
          throw earliestSessionResult.error
        }

        const earliestSession = earliestSessionResult.data?.[0] ?? null

        let baseStartDate = today
        if (earliestSession?.started_at) {
          const parsedEarliest = new Date(earliestSession.started_at)
          if (!Number.isNaN(parsedEarliest.getTime())) {
            baseStartDate = normalizeDate(parsedEarliest)
          }
        }

        const calendarStart = new Date(baseStartDate)
        calendarStart.setDate(calendarStart.getDate() - LOOKBACK_DAYS)

        const [sessionsResult, recordsResult] = await Promise.all([
          supabase
            .from("workout_sessions")
            .select("id, started_at")
            .eq("user_id", userId)
            .gte("started_at", calendarStart.toISOString())
            .lte("started_at", calendarEnd.toISOString())
            .order("started_at", { ascending: true })
            .returns<WorkoutSessionDateRow[]>(),
          supabase
            .from("exercise_records")
            .select("*, exercise:exercises(id, name, exercise_type)")
            .eq("user_id", userId)
            .order("last_updated", { ascending: false })
            .returns<ExerciseRecordWithExercise[]>(),
        ])

        if (sessionsResult.error) {
          throw sessionsResult.error
        }

        if (recordsResult.error) {
          throw recordsResult.error
        }

        const workoutDays = new Set<string>()
        ;(sessionsResult.data ?? []).forEach((session) => {
          if (!session.started_at) return
          const dateKey =
            typeof session.started_at === "string"
              ? session.started_at.slice(0, 10)
              : formatDateKey(new Date(session.started_at))
          workoutDays.add(dateKey)
        })

        if (!isMounted) return

        setCalendarDates(generateContinuousDates(calendarStart, workoutDays))
        setRecords(recordsResult.data ?? [])
      } catch (error) {
        console.error("Dashboard data loading error:", error)
        if (isMounted) {
          setFetchError("Failed to load data. Please refresh the page.")
        }
      } finally {
        if (isMounted) {
          setCalendarLoading(false)
          setRecordsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [router])

  useEffect(() => {
    if (calendarRef.current && calendarDates.length) {
      requestAnimationFrame(() => {
        if (calendarRef.current) {
          calendarRef.current.scrollTop = calendarRef.current.scrollHeight
        }
      })
    }
  }, [calendarDates])

  const daysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

  return (
    <div className="min-h-screen bg-[#ffffff] flex justify-center p-[10px]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000]">workouts</h1>
          <div className="flex items-center gap-[5px]">
            <Link
              href="/history"
              className="p-2"
              aria-label="History"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.1818 10C18.1818 5.48131 14.5187 1.81818 10 1.81818C5.48131 1.81818 1.81818 5.48131 1.81818 10C1.81818 14.5187 5.48131 18.1818 10 18.1818C14.5187 18.1818 18.1818 14.5187 18.1818 10ZM9.09091 4.54545C9.09091 4.04338 9.49792 3.63636 10 3.63636C10.5021 3.63636 10.9091 4.04338 10.9091 4.54545V9.43803L14.043 11.005C14.492 11.2295 14.6741 11.7757 14.4496 12.2248C14.225 12.6739 13.6788 12.8559 13.2298 12.6314L9.5934 10.8132C9.28541 10.6592 9.09091 10.3443 9.09091 10V4.54545ZM20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10Z" fill="#1E1E1E"/>
              </svg>
            </Link>
            <Link
              href="/settings"
              className="p-2"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6 text-[#000000]" />
            </Link>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 rounded-lg border border-[#ff2f00]/20 bg-[#ff2f00]/10 px-3 py-2 text-[14px] leading-[140%] text-[#ff2f00]">
            {fetchError}
          </div>
        )}

        <div className="mb-8">
          <div className="grid grid-cols-7 gap-0 mb-2 sticky top-0 bg-[#ffffff] z-10">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-[10px] leading-[120%] text-[rgba(0,0,0,0.3)] font-normal py-2">
                {day}
              </div>
            ))}
          </div>

          <div
            ref={calendarRef}
            className={`overflow-y-auto pr-2 scrollbar-thin ${calendarLoading ? "opacity-60" : ""}`}
            aria-busy={calendarLoading}
            style={calendarHeight !== null ? { height: calendarHeight } : undefined}
          >
            <div className="grid grid-cols-7 gap-0">
              {calendarDates.map((item: any, index: number) => {
                if (item.isEmpty) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                return (
                  <Link
                    href={item.active ? `/history#${item.fullDate}` : `/history`}
                    key={index}
                    className={`
                      aspect-square flex flex-col items-center justify-center text-[20px] leading-[120%]
                      transition-all duration-200 relative
                      ${item.today ? "bg-[#ff2f00] text-[#ffffff]" : ""}
                      ${item.active && !item.today ? "bg-[#cfe9ff] text-[#000000]" : ""}
                      ${!item.active && !item.today && !item.isFuture ? "text-[#000000]" : ""}
                      ${item.isFuture && !item.today ? "text-[#000000] opacity-20" : ""}
                      ${item.today ? "hover:bg-[#ff4520]" : ""}
                      ${item.active && !item.today ? "hover:bg-[#a8d5ff]" : "hover:bg-[#f7f7f7]"}
                      ${item.active || item.today ? "cursor-pointer" : "cursor-default pointer-events-none"}
                    `}
                    data-calendar-cell="true"
                  >
                    {item.isFirstOfMonth && <span className="text-[10px] leading-[100%] mb-1">{item.monthAbbr}</span>}
                    <span>{item.date}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Exercise list */}
        <div className="space-y-0 mb-[120px]">
          {recordsLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`record-skeleton-${index}`}
                className="flex items-center justify-between py-4 border-b border-[rgba(0,0,0,0.1)]"
              >
                <div className="h-[20px] w-32 rounded bg-[#0000000f]" />
                <div className="h-[20px] w-20 rounded bg-[#0000000f]" />
              </div>
            ))
          ) : records.length ? (
            records.map((record) => (
              <Link
                key={record.id}
                href={`/exercise/${record.exercise_id}`}
                className="flex items-center justify-between py-4 border-b border-[rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-[#f7f7f7] cursor-pointer"
              >
                <span className="text-[20px] leading-[120%] text-[#000000]">
                  {record.exercise?.name ?? "unknown exercise"}
                </span>
                <span className="text-[20px] leading-[120%] text-[#000000]">{formatRecordValue(record)}</span>
              </Link>
            ))
          ) : (
            <div className="py-6 text-center text-[16px] leading-[140%] text-[rgba(0,0,0,0.5)]">
              No saved records
            </div>
          )}
        </div>

        {/* New Workout Button */}
        <div className="fixed bottom-[10px] left-0 right-0 flex justify-center pointer-events-none z-50">
          <div className="w-full max-w-md px-[10px] pointer-events-auto">
            <div
              className="absolute inset-x-0 bottom-0 h-[150px] -z-10"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
              }}
            />

            <div className="space-y-3">
              {activeWorkoutId && (
                <Link href={`/workout/${activeWorkoutId}`} className="block">
                  <button className="w-full bg-[#ff2f00] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90 transition-opacity">
                    continue workout
                  </button>
                </Link>
              )}
              <Link 
                href="/start" 
                className="block"
                onClick={() => {
                  // Если есть активная тренировка, очищаем её данные при старте новой
                  if (activeWorkoutId) {
                    if (confirm("You have an active workout. Starting a new workout will discard it. Continue?")) {
                      localStorage.removeItem("workoutState")
                      localStorage.removeItem("currentWorkoutId")
                      setActiveWorkoutId(null)
                    } else {
                      // Отменяем переход
                      return false
                    }
                  }
                }}
              >
                <button className={`w-full text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90 transition-opacity ${
                  activeWorkoutId ? "bg-[#000000]" : "bg-[#000000]"
                }`}>
                  new workout
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
