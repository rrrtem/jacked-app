"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ExerciseRecord, Exercise } from "@/lib/types/database"

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
const MONTHS_TO_SHOW = 12

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function generateContinuousDates(monthsToShow: number, workoutDays: Set<string>, extraWeeksAfterToday = 2) {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const currentDate = today.getDate()

  const allDates = []
  let lastActualDate: Date | null = null

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  for (let i = monthsToShow - 1; i >= 0; i--) {
    const monthDate = new Date(currentYear, currentMonth - i, 1)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day)
      const isToday = year === currentYear && month === currentMonth && day === currentDate
      const isPast = dateObj < today
      const isFuture = dateObj > today
      const dateKey = formatDateKey(dateObj)
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

      lastActualDate = dateObj
    }
  }

  const firstDate = new Date(currentYear, currentMonth - (monthsToShow - 1), 1)
  const firstDayOfWeek = firstDate.getDay()
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  for (let i = 0; i < offset; i++) {
    allDates.unshift({ date: null, isEmpty: true })
  }

  const todayIndex = allDates.findIndex((d: any) => d.today)

  if (todayIndex !== -1 && lastActualDate) {
    const todayRow = Math.floor(todayIndex / 7)
    let totalRows = Math.ceil(allDates.length / 7)
    let rowsAfterToday = totalRows - todayRow - 1
    const missingRows = Math.max(0, extraWeeksAfterToday - rowsAfterToday)

    if (missingRows > 0) {
      const daysToAdd = missingRows * 7

      for (let i = 1; i <= daysToAdd; i++) {
        const futureDate = new Date(lastActualDate)
        futureDate.setDate(futureDate.getDate() + i)

        const year = futureDate.getFullYear()
        const month = futureDate.getMonth()
        const day = futureDate.getDate()

        const isToday = year === currentYear && month === currentMonth && day === currentDate
        const isPast = futureDate < today
        const isFuture = futureDate > today
        const dateKey = formatDateKey(futureDate)
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
      }

      if (lastActualDate) {
        lastActualDate.setDate(lastActualDate.getDate() + missingRows * 7)
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
  exercise: Pick<Exercise, "id" | "name" | "tags"> | null
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
  const tags = record.exercise?.tags ?? []
  const isBarbell = tags.includes("barbell")

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
  const [calendarDates, setCalendarDates] = useState<any[]>(() => generateContinuousDates(MONTHS_TO_SHOW, new Set()))
  const [records, setRecords] = useState<ExerciseRecordWithExercise[]>([])
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [calendarHeight, setCalendarHeight] = useState<number | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

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
      const today = new Date()
      const calendarStart = new Date(today.getFullYear(), today.getMonth() - (MONTHS_TO_SHOW - 1), 1)
      const calendarEnd = new Date(today)
      calendarEnd.setHours(23, 59, 59, 999)

      setFetchError(null)
      setCalendarLoading(true)
      setRecordsLoading(true)

      try {
        const [sessionsResult, recordsResult] = await Promise.all([
          supabase
            .from("workout_sessions")
            .select("id, started_at")
            .eq("user_id", TEST_USER_ID)
            .gte("started_at", calendarStart.toISOString())
            .lte("started_at", calendarEnd.toISOString())
            .order("started_at", { ascending: true })
            .returns<WorkoutSessionDateRow[]>(),
          supabase
            .from("exercise_records")
            .select("*, exercise:exercises(id, name, tags)")
            .eq("user_id", TEST_USER_ID)
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

        setCalendarDates(generateContinuousDates(MONTHS_TO_SHOW, workoutDays))
        setRecords(recordsResult.data ?? [])
      } catch (error) {
        console.error("Ошибка загрузки данных дашборда:", error)
        if (isMounted) {
          setFetchError("Не удалось загрузить данные. Попробуйте обновить страницу.")
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
  }, [])

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
    <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-[10px]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[32px] leading-[120%] font-normal text-[#000000]">get jacked</h1>
          <button className="p-2" aria-label="Settings">
            <Settings className="w-6 h-6 text-[#000000]" />
          </button>
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
                    href={`/history/${item.fullDate}`}
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
                      cursor-pointer
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
              Нет сохранённых рекордов
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

            <Link href="/start" className="block">
              <button className="w-full bg-[#000000] text-[#ffffff] py-5 rounded-[60px] text-[20px] leading-[120%] font-normal hover:opacity-90 transition-opacity">
                new workout
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
